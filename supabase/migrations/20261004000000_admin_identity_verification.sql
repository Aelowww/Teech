alter table public.profiles add column if not exists verification_status text not null default 'pending';
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists verified_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists verification_note text;
alter table public.profiles add column if not exists rejected_identifier text;

alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles add constraint profiles_verification_status_check
  check (verification_status in ('pending', 'verified', 'rejected'));

alter table public.profiles drop constraint if exists profiles_verification_note_length;
alter table public.profiles add constraint profiles_verification_note_length
  check (verification_note is null or char_length(verification_note) <= 300);

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'faculty', 'admin'));

alter table public.profiles drop constraint if exists valid_profile_identity;
alter table public.profiles add constraint valid_profile_identity check (
  (role = 'student' and faculty_number is null and (student_number is not null or verification_status = 'rejected'))
  or (role = 'faculty' and student_number is null and (faculty_number is not null or verification_status = 'rejected'))
  or (role = 'admin' and student_number is null and faculty_number is null)
);

create index if not exists profiles_verification_queue_idx
  on public.profiles (verification_status, created_at)
  where role in ('student', 'faculty');

grant select (verification_status, verified_at, verification_note, rejected_identifier) on public.profiles to authenticated;

create table if not exists public.verification_reviews (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_auth_user_id uuid references auth.users(id) on delete set null,
  decision text not null check (decision in ('approved', 'rejected', 'resubmitted')),
  identifier text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.verification_reviews enable row level security;
revoke all on public.verification_reviews from anon, authenticated;
create index if not exists verification_reviews_profile_idx on public.verification_reviews (profile_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    and exists (
      select 1 from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.my_admin_status()
returns text
language sql
stable
security definer set search_path = ''
as $$
  select case
    when not exists (select 1 from public.profiles where auth_user_id = (select auth.uid()) and role = 'admin') then 'not_admin'
    when coalesce(auth.jwt() ->> 'aal', '') <> 'aal2' then 'needs_mfa'
    else 'ok'
  end;
$$;

revoke all on function public.my_admin_status() from public, anon;
grant execute on function public.my_admin_status() to authenticated;

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
    verification_status = 'pending',
    verified_at = null,
    verified_by = null,
    verification_note = null,
    rejected_identifier = null
  where auth_user_id is null
    and lower(email) = lower(new.email);

  if not found then
    insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department, verification_status)
    values (new.id, profile_role, profile_name, new.email, student_no, faculty_no, course, dept, 'pending')
    on conflict (auth_user_id) do update set
      role = excluded.role,
      full_name = excluded.full_name,
      email = excluded.email,
      student_number = excluded.student_number,
      faculty_number = excluded.faculty_number,
      course_year = excluded.course_year,
      department = excluded.department,
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

create or replace function public.create_account_notifications()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_profile_id, kind, title, body, created_at)
  values
    (new.id, 'account_created', 'Account created', 'Your Teech account is ready to use.', now()),
    (new.id, 'welcome', 'Welcome to Teech', 'Set up your profile and start managing consultations.', now() + interval '1 millisecond');

  if new.role in ('student', 'faculty') and new.verification_status = 'pending' then
    insert into public.notifications (recipient_profile_id, kind, title, body, created_at)
    values (
      new.id,
      'verification_pending',
      'Verification in progress',
      case when new.role = 'student'
        then 'An admin is confirming your Student ID. You can book consultations once it''s verified.'
        else 'An admin is confirming your Faculty ID. Students can book you once it''s verified.'
      end,
      now() + interval '2 milliseconds'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.create_account_notifications() from public, anon, authenticated;

create or replace function public.prepare_appointment_request()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  student_record public.profiles%rowtype;
  faculty_record public.profiles%rowtype;
  slot_location text;
begin
  select * into student_record from public.profiles where id = new.student_profile_id;
  if student_record.verification_status is distinct from 'verified' then
    raise exception 'Your Student ID has not been verified yet. You can book once an admin verifies it.';
  end if;

  select * into faculty_record from public.profiles where id = new.faculty_profile_id and role = 'faculty' and verification_status = 'verified';
  if faculty_record.id is null then
    raise exception 'The selected faculty member could not be found.';
  end if;

  if new.preferred_date is null or new.preferred_time is null or new.preferred_date < public.local_today() then
    raise exception 'The selected date is no longer available.';
  end if;

  if new.preferred_date = public.local_today() and new.preferred_time <= (now() at time zone 'Asia/Manila')::time then
    raise exception 'That time has already passed today. Please choose a later time.';
  end if;

  if exists (
    select 1 from public.appointment_requests
    where student_profile_id = new.student_profile_id
      and status in ('pending', 'confirmed')
      and preferred_date = new.preferred_date
      and preferred_time = new.preferred_time
  ) then
    raise exception 'You already have a consultation at this date and time.';
  end if;

  if exists (
    select 1 from public.appointment_requests
    where student_profile_id = new.student_profile_id
      and faculty_profile_id = new.faculty_profile_id
      and status = 'pending'
      and preferred_date >= public.local_today()
  ) then
    raise exception 'You already have a pending request with this faculty member. Wait for their response or cancel it first.';
  end if;

  if (
    select count(*) from public.appointment_requests
    where student_profile_id = new.student_profile_id
      and status = 'pending'
      and preferred_date >= public.local_today()
  ) >= 3 then
    raise exception 'You can have up to 3 pending requests at a time.';
  end if;

  select availability.meeting_location into slot_location
  from public.faculty_availability availability
  where availability.faculty_profile_id = new.faculty_profile_id
    and availability.available_date = new.preferred_date
    and availability.is_available = true
    and new.preferred_time >= availability.start_time
    and new.preferred_time < availability.end_time
  limit 1;
  if not found then
    raise exception 'The selected time is no longer available.';
  end if;

  new.status := 'pending';
  new.student_name := student_record.full_name;
  new.student_number := student_record.student_number;
  new.faculty_name := faculty_record.full_name;
  new.meeting_location := slot_location;
  return new;
end;
$$;

revoke all on function public.prepare_appointment_request() from public, anon, authenticated;

drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Profiles are readable by signed-in users" on public.profiles
  for select to authenticated
  using ((role = 'faculty' and verification_status = 'verified') or auth_user_id = (select auth.uid()));

drop policy if exists "Students can create own requests" on public.appointment_requests;
create policy "Students can create own requests" on public.appointment_requests
  for insert to authenticated
  with check (
    student_profile_id = (
      select id from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'student' and verification_status = 'verified'
    )
    and status = 'pending'
    and faculty_profile_id in (
      select id from public.profiles where role = 'faculty' and verification_status = 'verified'
    )
  );

drop policy if exists "Faculty can update assigned requests" on public.appointment_requests;
create policy "Faculty can update assigned requests" on public.appointment_requests
  for update to authenticated
  using (
    faculty_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'faculty' and verification_status = 'verified'
    )
    and status in ('pending', 'confirmed')
  )
  with check (
    faculty_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'faculty' and verification_status = 'verified'
    )
    and status in ('confirmed', 'declined', 'cancelled')
  );

drop policy if exists "Faculty can manage own availability" on public.faculty_availability;
create policy "Faculty can manage own availability" on public.faculty_availability
  for all to authenticated
  using (
    faculty_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'faculty' and verification_status = 'verified'
    )
  )
  with check (
    faculty_profile_id in (
      select id from public.profiles
      where auth_user_id = (select auth.uid()) and role = 'faculty' and verification_status = 'verified'
    )
  );

drop policy if exists "Signed-in users can view faculty availability" on public.faculty_availability;
create policy "Signed-in users can view faculty availability" on public.faculty_availability
  for select to authenticated
  using (
    faculty_profile_id in (
      select id from public.profiles
      where (role = 'faculty' and verification_status = 'verified') or auth_user_id = (select auth.uid())
    )
  );

create or replace function public.resubmit_my_verification(new_identifier text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  cleaned text := btrim(coalesce(new_identifier, ''));
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

revoke all on function public.resubmit_my_verification(text) from public, anon;
grant execute on function public.resubmit_my_verification(text) to authenticated;

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

create or replace function public.admin_review_account(target_profile_id uuid, decision text, note text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  target public.profiles%rowtype;
  cleaned_note text := nullif(btrim(coalesce(note, '')), '');
  identifier text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select * into target from public.profiles where id = target_profile_id for update;
  if target.id is null or target.role not in ('student', 'faculty') then
    return 'not_found';
  end if;

  if cleaned_note is not null and char_length(cleaned_note) > 300 then
    return 'note_too_long';
  end if;

  identifier := coalesce(target.student_number, target.faculty_number);

  if decision = 'approve' then
    if identifier is null then
      return 'missing_identifier';
    end if;
    if not exists (select 1 from auth.users where id = target.auth_user_id and email_confirmed_at is not null) then
      return 'email_unconfirmed';
    end if;

    update public.profiles
    set verification_status = 'verified', verified_at = now(), verified_by = auth.uid(), verification_note = null, rejected_identifier = null
    where id = target.id;

    insert into public.notifications (recipient_profile_id, kind, title, body)
    values (
      target.id,
      'verification_approved',
      'You''re verified',
      case when target.role = 'student'
        then 'Your Student ID has been verified. You can now book consultations.'
        else 'Your Faculty ID has been verified. Students can now book consultations with you.'
      end
    );

    insert into public.verification_reviews (profile_id, reviewer_auth_user_id, decision, identifier)
    values (target.id, auth.uid(), 'approved', identifier);
  elsif decision = 'reject' then
    if cleaned_note is null then
      return 'note_required';
    end if;

    update public.profiles
    set
      verification_status = 'rejected',
      verification_note = cleaned_note,
      rejected_identifier = coalesce(identifier, target.rejected_identifier),
      student_number = null,
      faculty_number = null,
      verified_at = null,
      verified_by = auth.uid()
    where id = target.id;

    insert into public.notifications (recipient_profile_id, kind, title, body)
    values (
      target.id,
      'verification_rejected',
      'Verification unsuccessful',
      'We couldn''t verify your ' || case when target.role = 'student' then 'Student ID' else 'Faculty ID' end || ': ' || cleaned_note
    );

    insert into public.verification_reviews (profile_id, reviewer_auth_user_id, decision, identifier, note)
    values (target.id, auth.uid(), 'rejected', coalesce(identifier, target.rejected_identifier), cleaned_note);
  else
    return 'invalid_decision';
  end if;

  return 'ok';
end;
$$;

revoke all on function public.admin_review_account(uuid, text, text) from public, anon;
grant execute on function public.admin_review_account(uuid, text, text) to authenticated;

create or replace function public.promote_to_admin(target_email text)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  promoted uuid;
begin
  update public.profiles
  set
    role = 'admin',
    student_number = null,
    faculty_number = null,
    course_year = null,
    department = null,
    verification_status = 'verified',
    verified_at = now(),
    verification_note = null,
    rejected_identifier = null
  where lower(email) = lower(btrim(target_email)) and auth_user_id is not null
  returning id into promoted;

  if promoted is null then
    raise exception 'No account found for %', target_email;
  end if;

  delete from public.faculty_availability where faculty_profile_id = promoted;
  return promoted;
end;
$$;

revoke all on function public.promote_to_admin(text) from public, anon, authenticated;
