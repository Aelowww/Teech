create or replace function public.local_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Asia/Manila')::date;
$$;

alter table public.password_reset_attempts
  add column if not exists lockouts integer not null default 0;

create table if not exists public.password_reset_failures (
  id bigint generated always as identity primary key,
  failed_at timestamptz not null default now()
);

create index if not exists password_reset_failures_failed_at_idx
  on public.password_reset_failures (failed_at);

alter table public.password_reset_failures enable row level security;
revoke all on public.password_reset_failures from anon, authenticated;

create or replace function public.reset_student_password(
  requested_student_number text,
  questions text[],
  answers text[],
  new_password text
)
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  student public.profiles%rowtype;
  attempt public.password_reset_attempts%rowtype;
  matched integer;
begin
  if char_length(coalesce(new_password, '')) < 8
    or new_password !~ '[a-z]'
    or new_password !~ '[A-Z]'
    or new_password !~ '[0-9]'
    or new_password !~ '[^A-Za-z0-9]' then
    return 'weak_password';
  end if;

  if (select count(*) from public.password_reset_failures where failed_at > now() - interval '1 hour') >= 100 then
    return 'locked';
  end if;

  select * into student
  from public.profiles
  where role = 'student' and lower(btrim(student_number)) = lower(btrim(requested_student_number));
  if student.id is null or student.auth_user_id is null then
    insert into public.password_reset_failures default values;
    return 'invalid';
  end if;

  select * into attempt from public.password_reset_attempts where profile_id = student.id;
  if attempt.locked_until is not null and attempt.locked_until > now() then
    return 'locked';
  end if;

  select count(distinct stored.id) into matched
  from public.student_security_answers stored
  join unnest(questions, answers) as given(question, answer) on given.question = stored.question
  where stored.profile_id = student.id
    and stored.answer_hash = crypt(public.normalize_security_answer(given.answer), stored.answer_hash);

  if matched <> 3 then
    insert into public.password_reset_attempts (profile_id, failed_count, locked_until, lockouts)
    values (student.id, 1, null, 0)
    on conflict (profile_id) do update set
      failed_count = case when password_reset_attempts.failed_count + 1 >= 5 then 0 else password_reset_attempts.failed_count + 1 end,
      lockouts = case when password_reset_attempts.failed_count + 1 >= 5 then password_reset_attempts.lockouts + 1 else password_reset_attempts.lockouts end,
      locked_until = case
        when password_reset_attempts.failed_count + 1 < 5 then null
        when password_reset_attempts.lockouts + 1 >= 3 then now() + interval '24 hours'
        else now() + interval '15 minutes'
      end;
    insert into public.password_reset_failures default values;
    delete from public.password_reset_failures where failed_at < now() - interval '1 day';
    return 'invalid';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf', 10)), updated_at = now()
  where id = student.auth_user_id;
  delete from auth.sessions where user_id = student.auth_user_id;
  delete from public.password_reset_attempts where profile_id = student.id;
  return 'ok';
end;
$$;

revoke all on function public.reset_student_password(text, text[], text[], text) from public;
grant execute on function public.reset_student_password(text, text[], text[], text) to anon, authenticated;

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
  select * into faculty_record from public.profiles where id = new.faculty_profile_id and role = 'faculty';
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

create or replace function public.enforce_appointment_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending' and new.status in ('confirmed', 'declined', 'cancelled'))
    or (old.status = 'confirmed' and new.status = 'cancelled')
  ) then
    raise exception 'This request can no longer be changed from % to %.', old.status, new.status;
  end if;

  if new.status = 'confirmed' and old.preferred_date < public.local_today() then
    raise exception 'This request''s date has passed, so it can no longer be confirmed.';
  end if;

  if new.status = 'cancelled' then
    new.cancelled_by := case
      when auth.uid() is null then 'system'
      when exists (
        select 1 from public.profiles
        where id = new.faculty_profile_id and auth_user_id = auth.uid()
      ) then 'faculty'
      else 'student'
    end;
  end if;

  return new;
end;
$$;

create or replace function public.record_daily_login(client_date date)
returns table (
  current_streak integer,
  points_balance integer,
  active_dates date[],
  frozen_dates date[],
  day_points jsonb,
  upcoming_rewards integer[],
  freezes_available integer,
  new_badges text[]
)
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid;
  today date := public.local_today();
  last_day date;
  missed integer;
  freezes integer;
  checked_in boolean;
  current_length integer;
  longest_length integer;
  earned text[];
begin
  select id into caller_id from public.profiles where auth_user_id = auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (select 1 from public.login_activity where profile_id = caller_id and activity_date = today) then
    select max(activity_date) into last_day
    from public.login_activity
    where profile_id = caller_id and activity_date < today;
    missed := today - last_day - 1;
    if missed > 0 then
      select available into freezes from public.streak_freezes where profile_id = caller_id for update;
      if coalesce(freezes, 0) >= missed then
        insert into public.login_activity (profile_id, activity_date, frozen)
        select caller_id, missed_day::date, true
        from generate_series(last_day + 1, today - 1, interval '1 day') as missed_day
        on conflict do nothing;
        update public.streak_freezes set available = available - missed where profile_id = caller_id;
      end if;
    end if;
  end if;

  insert into public.login_activity (profile_id, activity_date)
  values (caller_id, today)
  on conflict do nothing;
  checked_in := not exists (
    select 1 from public.points_ledger
    where profile_id = caller_id and activity_date = today
  );

  with runs as (
    select activity_date, activity_date - (row_number() over (order by activity_date))::integer as run_id
    from public.login_activity
    where profile_id = caller_id and activity_date <= today
  ),
  streaks as (
    select max(activity_date) as last_day, count(*)::integer as length
    from runs
    group by run_id
  )
  select
    coalesce((select length from streaks where streaks.last_day = today), 0),
    coalesce((select max(length) from streaks), 0)
  into current_length, longest_length;

  if checked_in then
    insert into public.points_ledger (profile_id, amount, reason, activity_date)
    values (caller_id, public.streak_reward(current_length), 'Day ' || current_length || ' check-in', today);
  end if;

  earned := public.award_badges(caller_id, longest_length);

  return query
  select
    current_length,
    (select coalesce(sum(amount), 0)::integer from public.points_ledger where profile_id = caller_id),
    coalesce((
      select array_agg(activity_date order by activity_date)
      from public.login_activity
      where profile_id = caller_id and not frozen and activity_date between today - 6 and today
    ), '{}'::date[]),
    coalesce((
      select array_agg(activity_date order by activity_date)
      from public.login_activity
      where profile_id = caller_id and frozen and activity_date between today - 6 and today
    ), '{}'::date[]),
    coalesce((
      select jsonb_object_agg(activity_date::text, total)
      from (
        select ledger.activity_date, sum(ledger.amount)::integer as total
        from public.points_ledger ledger
        where ledger.profile_id = caller_id and ledger.activity_date between today - 6 and today
        group by ledger.activity_date
      ) daily
    ), '{}'::jsonb),
    array(select public.streak_reward(current_length + step) from generate_series(1, 6) as step),
    coalesce((select available from public.streak_freezes where profile_id = caller_id), 0),
    earned;
end;
$$;

revoke all on function public.record_daily_login(date) from public, anon;
grant execute on function public.record_daily_login(date) to authenticated;
