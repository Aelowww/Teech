drop policy if exists "Anyone can submit a faculty ID document" on storage.objects;

create or replace function public.can_submit_my_id()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = (select auth.uid())
      and role in ('student', 'faculty')
      and verification_status in ('unsubmitted', 'rejected')
  );
$$;

revoke all on function public.can_submit_my_id() from public, anon;
grant execute on function public.can_submit_my_id() to authenticated;

drop policy if exists "Users can upload their own ID document" on storage.objects;
create policy "Users can upload their own ID document" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'faculty-ids'
    and name ~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and (select public.can_submit_my_id())
  );

drop policy if exists "Users can replace their own ID document" on storage.objects;
create policy "Users can replace their own ID document" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'faculty-ids'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and (select public.can_submit_my_id())
  )
  with check (
    bucket_id = 'faculty-ids'
    and name ~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$'
    and split_part(name, '/', 2) = (select auth.uid())::text
  );

drop policy if exists "Users can view their own ID document" on storage.objects;
create policy "Users can view their own ID document" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'faculty-ids'
    and split_part(name, '/', 2) = (select auth.uid())::text
  );

drop policy if exists "Users can delete their own ID document" on storage.objects;
create policy "Users can delete their own ID document" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'faculty-ids'
    and split_part(name, '/', 2) = (select auth.uid())::text
    and (select public.can_submit_my_id())
  );

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
  initial_status text := case when profile_role = 'student' and student_no is not null then 'pending' else 'unsubmitted' end;
begin
  if student_no is not null and student_no !~ '^[0-9]{6}$' then
    raise exception 'Student ID must be exactly 6 digits.' using errcode = '22023';
  end if;

  if faculty_no is not null and char_length(faculty_no) > 32 then
    raise exception 'Faculty ID is too long.' using errcode = '22023';
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
    verification_document_path = null,
    verification_status = initial_status,
    verified_at = null,
    verified_by = null,
    verification_note = null,
    rejected_identifier = null
  where auth_user_id is null
    and lower(email) = lower(new.email);

  if not found then
    insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department, verification_document_path, verification_status)
    values (new.id, profile_role, profile_name, new.email, student_no, faculty_no, course, dept, null, initial_status)
    on conflict (auth_user_id) do update set
      role = excluded.role,
      full_name = excluded.full_name,
      email = excluded.email,
      student_number = excluded.student_number,
      faculty_number = excluded.faculty_number,
      course_year = excluded.course_year,
      department = excluded.department,
      verification_document_path = excluded.verification_document_path,
      verification_status = excluded.verification_status,
      verified_at = null,
      verified_by = null,
      verification_note = null,
      rejected_identifier = null;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.submit_my_verification(new_identifier text, document_path text, new_department text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  cleaned text := btrim(coalesce(new_identifier, ''));
  cleaned_document text := nullif(btrim(coalesce(document_path, '')), '');
  cleaned_department text := nullif(btrim(coalesce(new_department, '')), '');
begin
  select * into caller from public.profiles where auth_user_id = auth.uid() for update;
  if caller.id is null or caller.role not in ('student', 'faculty') then
    return 'not_allowed';
  end if;

  if caller.verification_status not in ('unsubmitted', 'rejected') then
    return 'not_rejected';
  end if;

  if (caller.role = 'student' and cleaned !~ '^[0-9]{6}$')
    or (caller.role = 'faculty' and (cleaned = '' or char_length(cleaned) > 32)) then
    return 'invalid';
  end if;

  if caller.role = 'student' and (cleaned_department is null or char_length(cleaned_department) > 80) then
    return 'department_required';
  end if;

  if cleaned_document is null
    or cleaned_document !~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$'
    or split_part(cleaned_document, '/', 2) <> auth.uid()::text then
    return 'document_required';
  end if;

  if (
    select count(*) from public.verification_reviews
    where profile_id = caller.id and decision in ('resubmitted', 'submitted') and created_at > now() - interval '24 hours'
  ) >= 5 then
    return 'too_many';
  end if;

  begin
    update public.profiles
    set
      student_number = case when role = 'student' then cleaned end,
      faculty_number = case when role = 'faculty' then cleaned end,
      department = coalesce(left(cleaned_department, 80), department),
      verification_document_path = cleaned_document,
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
  values (caller.id, auth.uid(), case when caller.verification_status = 'unsubmitted' then 'submitted' else 'resubmitted' end, cleaned);

  insert into public.notifications (recipient_profile_id, kind, title, body)
  values (
    caller.id,
    'verification_submitted',
    'ID submitted',
    case when caller.role = 'student'
      then 'We received your Student ID. An admin will review it soon, and we''ll let you know here once you''re verified.'
      else 'We received your Faculty ID. An admin will review it soon, and we''ll email you once you can sign in.'
    end
  );

  return 'ok';
end;
$$;

revoke all on function public.submit_my_verification(text, text, text) from public, anon;
grant execute on function public.submit_my_verification(text, text, text) to authenticated;
