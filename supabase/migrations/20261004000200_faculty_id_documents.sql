alter table public.profiles add column if not exists verification_document_path text;

alter table public.profiles drop constraint if exists profiles_verification_document_path_format;
alter table public.profiles add constraint profiles_verification_document_path_format
  check (verification_document_path is null or verification_document_path ~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$');

create unique index if not exists profiles_verification_document_path_key
  on public.profiles (verification_document_path)
  where verification_document_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('faculty-ids', 'faculty-ids', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can submit a faculty ID document" on storage.objects;
create policy "Anyone can submit a faculty ID document" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'faculty-ids'
    and name ~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$'
  );

drop policy if exists "Admins can view faculty ID documents" on storage.objects;
create policy "Admins can view faculty ID documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'faculty-ids' and public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  profile_role text := case when meta ->> 'role' = 'faculty' then 'faculty' else 'student' end;
  profile_name text := left(coalesce(nullif(btrim(meta ->> 'full_name'), ''), split_part(new.email, '@', 1)), 120);
  student_no text := case when profile_role = 'student' then nullif(btrim(meta ->> 'student_number'), '') end;
  faculty_no text := case when profile_role = 'faculty' then nullif(btrim(meta ->> 'faculty_number'), '') end;
  course text := case when profile_role = 'student' then left(nullif(btrim(meta ->> 'course_year'), ''), 80) end;
  dept text := case when profile_role = 'faculty' then left(nullif(btrim(meta ->> 'department'), ''), 80) end;
  document_path text := case when profile_role = 'faculty' then nullif(btrim(meta ->> 'id_document_path'), '') end;
begin
  if student_no is not null and student_no !~ '^[0-9]{6}$' then
    raise exception 'Student ID must be exactly 6 digits.' using errcode = '22023';
  end if;

  if faculty_no is not null and char_length(faculty_no) > 32 then
    raise exception 'Faculty ID is too long.' using errcode = '22023';
  end if;

  if profile_role = 'faculty' and (document_path is null or document_path !~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$') then
    raise exception 'A photo of your Faculty ID is required.' using errcode = '22023';
  end if;

  update public.profiles
  set
    auth_user_id = new.id,
    role = profile_role,
    full_name = profile_name,
    email = new.email,
    student_number = student_no,
    faculty_number = faculty_no,
    course_year = course,
    department = dept,
    verification_document_path = document_path,
    verification_status = 'pending',
    verified_at = null,
    verified_by = null,
    verification_note = null,
    rejected_identifier = null
  where auth_user_id is null
    and lower(email) = lower(new.email);

  if not found then
    insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department, verification_document_path, verification_status)
    values (new.id, profile_role, profile_name, new.email, student_no, faculty_no, course, dept, document_path, 'pending')
    on conflict (auth_user_id) do update set
      role = excluded.role,
      full_name = excluded.full_name,
      email = excluded.email,
      student_number = excluded.student_number,
      faculty_number = excluded.faculty_number,
      course_year = excluded.course_year,
      department = excluded.department,
      verification_document_path = excluded.verification_document_path,
      verification_status = 'pending',
      verified_at = null,
      verified_by = null,
      verification_note = null,
      rejected_identifier = null;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop function if exists public.resubmit_my_verification(text);
create or replace function public.resubmit_my_verification(new_identifier text, document_path text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  cleaned text := btrim(coalesce(new_identifier, ''));
  cleaned_document text := nullif(btrim(coalesce(document_path, '')), '');
begin
  select * into caller from public.profiles where auth_user_id = auth.uid() for update;
  if caller.id is null or caller.role not in ('student', 'faculty') then
    return 'not_allowed';
  end if;

  if caller.verification_status <> 'rejected' then
    return 'not_rejected';
  end if;

  if (caller.role = 'student' and cleaned !~ '^[0-9]{6}$')
    or (caller.role = 'faculty' and (cleaned = '' or char_length(cleaned) > 32)) then
    return 'invalid';
  end if;

  if caller.role = 'faculty' and (cleaned_document is null or cleaned_document !~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$') then
    return 'document_required';
  end if;

  if (
    select count(*) from public.verification_reviews
    where profile_id = caller.id and decision = 'resubmitted' and created_at > now() - interval '24 hours'
  ) >= 5 then
    return 'too_many';
  end if;

  begin
    update public.profiles
    set
      student_number = case when role = 'student' then cleaned end,
      faculty_number = case when role = 'faculty' then cleaned end,
      verification_document_path = case when role = 'faculty' then cleaned_document else verification_document_path end,
      verification_status = 'pending',
      verification_note = null,
      rejected_identifier = null,
      verified_at = null,
      verified_by = null
    where id = caller.id;
  exception when unique_violation then
    return 'taken';
  end;

  insert into public.verification_reviews (profile_id, reviewer_auth_user_id, decision, identifier)
  values (caller.id, auth.uid(), 'resubmitted', cleaned);

  return 'ok';
end;
$$;

revoke all on function public.resubmit_my_verification(text, text) from public, anon;
grant execute on function public.resubmit_my_verification(text, text) to authenticated;

drop function if exists public.admin_verification_queue();
create or replace function public.admin_verification_queue()
returns table (
  profile_id uuid,
  role text,
  full_name text,
  email text,
  identifier text,
  course_year text,
  department text,
  verification_status text,
  verification_note text,
  rejected_identifier text,
  document_path text,
  email_confirmed boolean,
  created_at timestamptz,
  verified_at timestamptz
)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.role,
    p.full_name,
    p.email,
    coalesce(p.student_number, p.faculty_number),
    p.course_year,
    p.department,
    p.verification_status,
    p.verification_note,
    p.rejected_identifier,
    p.verification_document_path,
    u.email_confirmed_at is not null,
    p.created_at,
    p.verified_at
  from public.profiles p
  left join auth.users u on u.id = p.auth_user_id
  where p.role in ('student', 'faculty')
  order by p.created_at desc
  limit 2000;
end;
$$;

revoke all on function public.admin_verification_queue() from public, anon;
grant execute on function public.admin_verification_queue() to authenticated;

create or replace function public.admin_account_contact(target_profile_id uuid)
returns table (role text, full_name text, email text, verification_status text, verification_note text)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
  select p.role, p.full_name, u.email, p.verification_status, p.verification_note
  from public.profiles p
  join auth.users u on u.id = p.auth_user_id
  where p.id = target_profile_id and p.role in ('student', 'faculty');
end;
$$;

revoke all on function public.admin_account_contact(uuid) from public, anon;
grant execute on function public.admin_account_contact(uuid) to authenticated;

create or replace function public.resolve_sign_in(requested_role text, identifier text, password text)
returns table (status text, email text)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  account public.profiles%rowtype;
  account_email text;
  stored_hash text;
  attempt public.login_attempts%rowtype;
  cleaned text := lower(btrim(coalesce(identifier, '')));
begin
  if requested_role not in ('student', 'faculty') or cleaned = '' or coalesce(password, '') = '' or char_length(password) > 200 then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  select p.* into account
  from public.profiles p
  where p.role = requested_role
    and p.auth_user_id is not null
    and lower(btrim(case when requested_role = 'student' then p.student_number else p.faculty_number end)) = cleaned
  limit 1;

  if account.id is null and requested_role = 'faculty' then
    select p.* into account
    from public.profiles p
    where p.role = 'faculty'
      and p.auth_user_id is not null
      and p.verification_status = 'rejected'
      and lower(btrim(p.rejected_identifier)) = cleaned
    limit 1;
  end if;

  if account.id is null then
    perform crypt(password, gen_salt('bf', 10));
    return query select 'invalid'::text, null::text;
    return;
  end if;

  select * into attempt from public.login_attempts where profile_id = account.id;
  if attempt.locked_until is not null and attempt.locked_until > now() then
    return query select 'locked'::text, null::text;
    return;
  end if;

  select u.email, u.encrypted_password into account_email, stored_hash
  from auth.users u
  where u.id = account.auth_user_id;

  if stored_hash is null or stored_hash = '' or stored_hash <> crypt(password, stored_hash) then
    insert into public.login_attempts (profile_id, failed_count, locked_until, lockouts)
    values (account.id, 1, null, 0)
    on conflict (profile_id) do update set
      failed_count = case when login_attempts.failed_count + 1 >= 5 then 0 else login_attempts.failed_count + 1 end,
      lockouts = case when login_attempts.failed_count + 1 >= 5 then login_attempts.lockouts + 1 else login_attempts.lockouts end,
      locked_until = case
        when login_attempts.failed_count + 1 < 5 then null
        when login_attempts.lockouts + 1 >= 3 then now() + interval '24 hours'
        else now() + interval '15 minutes'
      end;
    return query select 'invalid'::text, null::text;
    return;
  end if;

  delete from public.login_attempts where profile_id = account.id;

  if account.role = 'faculty' and account.verification_status = 'pending' then
    return query select 'pending_verification'::text, null::text;
    return;
  end if;

  return query select 'ok'::text, account_email;
end;
$$;

revoke all on function public.resolve_sign_in(text, text, text) from public;
grant execute on function public.resolve_sign_in(text, text, text) to anon, authenticated;
