alter table public.profiles drop constraint if exists profiles_verification_status_check;
alter table public.profiles add constraint profiles_verification_status_check
  check (verification_status in ('unsubmitted', 'pending', 'verified', 'rejected'));

alter table public.profiles drop constraint if exists valid_profile_identity;
alter table public.profiles add constraint valid_profile_identity check (
  (role = 'student' and faculty_number is null and (student_number is not null or verification_status in ('unsubmitted', 'rejected')))
  or (role = 'faculty' and student_number is null and (faculty_number is not null or verification_status = 'rejected'))
  or (role = 'admin' and student_number is null and faculty_number is null)
);

grant select (department) on public.profiles to authenticated;

alter table public.verification_reviews drop constraint if exists verification_reviews_decision_check;
alter table public.verification_reviews add constraint verification_reviews_decision_check
  check (decision in ('approved', 'rejected', 'resubmitted', 'submitted'));

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
  initial_status text := case when profile_role = 'student' and student_no is null then 'unsubmitted' else 'pending' end;
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
    verification_status = initial_status,
    verified_at = null,
    verified_by = null,
    verification_note = null,
    rejected_identifier = null
  where auth_user_id is null
    and lower(email) = lower(new.email);

  if not found then
    insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department, verification_document_path, verification_status)
    values (new.id, profile_role, profile_name, new.email, student_no, faculty_no, course, dept, document_path, initial_status)
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

create or replace function public.ensure_my_profile()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  account auth.users%rowtype;
  existing_role text;
  account_role text;
  student_no text;
begin
  select role into existing_role from public.profiles where auth_user_id = auth.uid();
  if existing_role is not null then
    return existing_role;
  end if;

  select * into account from auth.users where id = auth.uid();
  if account.id is null then
    return null;
  end if;

  account_role := case when account.raw_user_meta_data ->> 'role' = 'faculty' then 'faculty' else 'student' end;
  student_no := case when account_role = 'student' then nullif(account.raw_user_meta_data ->> 'student_number', '') end;

  insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department, verification_status)
  values (
    account.id,
    account_role,
    coalesce(nullif(account.raw_user_meta_data ->> 'full_name', ''), split_part(account.email, '@', 1)),
    account.email,
    student_no,
    case when account_role = 'faculty' then nullif(account.raw_user_meta_data ->> 'faculty_number', '') end,
    case when account_role = 'student' then nullif(account.raw_user_meta_data ->> 'course_year', '') end,
    case when account_role = 'faculty' then nullif(account.raw_user_meta_data ->> 'department', '') end,
    case when account_role = 'student' and student_no is null then 'unsubmitted' else 'pending' end
  )
  on conflict do nothing;

  select role into existing_role from public.profiles where auth_user_id = auth.uid();
  return existing_role;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

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

  if new.role = 'student' and new.verification_status = 'unsubmitted' then
    insert into public.notifications (recipient_profile_id, kind, title, body, created_at)
    values (new.id, 'verification_required', 'Verify your identity', 'Submit your Student ID so you can start booking consultations.', now() + interval '2 milliseconds');
  elsif new.role in ('student', 'faculty') and new.verification_status = 'pending' then
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

drop function if exists public.resubmit_my_verification(text, text);
drop function if exists public.resubmit_my_verification(text);

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

  if cleaned_document is null or cleaned_document !~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$' then
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

  return 'ok';
end;
$$;

revoke all on function public.submit_my_verification(text, text, text) from public, anon;
grant execute on function public.submit_my_verification(text, text, text) to authenticated;

create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  today date := public.local_today();
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'students', (
      select jsonb_build_object(
        'total', count(*),
        'verified', count(*) filter (where verification_status = 'verified'),
        'pending', count(*) filter (where verification_status = 'pending'),
        'rejected', count(*) filter (where verification_status = 'rejected'),
        'unsubmitted', count(*) filter (where verification_status = 'unsubmitted')
      ) from public.profiles where role = 'student'
    ),
    'faculty', (
      select jsonb_build_object(
        'total', count(*),
        'verified', count(*) filter (where verification_status = 'verified'),
        'pending', count(*) filter (where verification_status = 'pending'),
        'rejected', count(*) filter (where verification_status = 'rejected'),
        'available', count(*) filter (where verification_status = 'verified' and presence_status = 'available')
      ) from public.profiles where role = 'faculty'
    ),
    'appointments', (
      select jsonb_build_object(
        'total', count(*),
        'pending', count(*) filter (where status = 'pending'),
        'confirmed', count(*) filter (where status = 'confirmed'),
        'declined', count(*) filter (where status = 'declined'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'today', count(*) filter (where preferred_date = today and status in ('pending', 'confirmed')),
        'upcoming', count(*) filter (where preferred_date >= today and status = 'confirmed')
      ) from public.appointment_requests
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'date', day,
        'requests', (select count(*) from public.appointment_requests a where (a.created_at at time zone 'Asia/Manila')::date = day),
        'signUps', (select count(*) from public.profiles p where p.role in ('student', 'faculty') and (p.created_at at time zone 'Asia/Manila')::date = day)
      ) order by day)
      from (select today - offset_days as day from generate_series(0, 13) as offset_days) days
    ),
    'recent', (
      select coalesce(jsonb_agg(item order by (item ->> 'at') desc), '[]'::jsonb)
      from (
        select * from (
          select jsonb_build_object('kind', 'sign_up', 'name', p.full_name, 'role', p.role, 'at', p.created_at) as item
          from public.profiles p where p.role in ('student', 'faculty')
          order by p.created_at desc limit 8
        ) a
        union all
        select * from (
          select jsonb_build_object('kind', 'request', 'name', coalesce(r.student_name, 'A student'), 'role', 'student', 'detail', r.faculty_name, 'at', r.created_at)
          from public.appointment_requests r
          order by r.created_at desc limit 8
        ) b
        union all
        select * from (
          select jsonb_build_object('kind', 'review_' || v.decision, 'name', p.full_name, 'role', p.role, 'at', v.created_at)
          from public.verification_reviews v join public.profiles p on p.id = v.profile_id
          order by v.created_at desc limit 8
        ) c
      ) recent_items
    )
  ) into result;

  select jsonb_set(result, '{recent}', coalesce((
    select jsonb_agg(value order by value ->> 'at' desc)
    from (select value from jsonb_array_elements(result -> 'recent') order by value ->> 'at' desc limit 10) top
  ), '[]'::jsonb)) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard() from public, anon;
grant execute on function public.admin_dashboard() to authenticated;
