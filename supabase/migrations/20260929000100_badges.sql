create table if not exists public.badges (
  id text primary key,
  role text not null check (role in ('all', 'student', 'faculty')),
  name text not null,
  description text not null,
  sort_order integer not null
);

insert into public.badges (id, role, name, description, sort_order) values
  ('streak-7', 'all', 'On a Roll', 'Log in 7 days in a row', 1),
  ('streak-30', 'all', 'Committed', 'Log in 30 days in a row', 2),
  ('streak-100', 'all', 'Unstoppable', 'Log in 100 days in a row', 3),
  ('photo', 'all', 'Picture Perfect', 'Add a profile photo', 4),
  ('security', 'student', 'Safe & Sound', 'Set up your security questions', 5),
  ('first-consultation', 'student', 'First Steps', 'Complete your first consultation', 6),
  ('regular', 'student', 'Regular', 'Complete 5 consultations', 7),
  ('open-door', 'faculty', 'Open Door', 'Publish your first available date', 5),
  ('quick-responder', 'faculty', 'Quick Responder', 'Answer 5 requests within 24 hours', 6),
  ('mentor', 'faculty', 'Mentor', 'Complete 10 consultations', 7)
on conflict (id) do update set
  role = excluded.role,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

alter table public.badges enable row level security;
revoke all on public.badges from anon, authenticated;
grant select on public.badges to authenticated;
drop policy if exists "Signed-in users can view badges" on public.badges;
create policy "Signed-in users can view badges"
on public.badges for select to authenticated using (true);

create table if not exists public.user_badges (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (profile_id, badge_id)
);

alter table public.user_badges enable row level security;
revoke all on public.user_badges from anon, authenticated;
grant select on public.user_badges to authenticated;
drop policy if exists "Users can view their badges" on public.user_badges;
create policy "Users can view their badges"
on public.user_badges for select to authenticated
using (profile_id = (select id from public.profiles where auth_user_id = auth.uid()));

create or replace function public.award_badges(target_profile_id uuid, longest integer)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  profile public.profiles%rowtype;
  qualified text[] := '{}';
  completed integer;
  new_names text[];
begin
  select * into profile from public.profiles where id = target_profile_id;
  if profile.id is null then
    return '{}';
  end if;

  if longest >= 7 then qualified := qualified || 'streak-7'::text; end if;
  if longest >= 30 then qualified := qualified || 'streak-30'::text; end if;
  if longest >= 100 then qualified := qualified || 'streak-100'::text; end if;
  if profile.avatar_path is not null then qualified := qualified || 'photo'::text; end if;

  if profile.role = 'student' then
    if exists (select 1 from public.student_security_answers where profile_id = profile.id) then
      qualified := qualified || 'security'::text;
    end if;
    select count(*) into completed from public.appointment_requests
    where student_profile_id = profile.id and status = 'confirmed' and preferred_date < current_date;
    if completed >= 1 then qualified := qualified || 'first-consultation'::text; end if;
    if completed >= 5 then qualified := qualified || 'regular'::text; end if;
  elsif profile.role = 'faculty' then
    if exists (select 1 from public.faculty_availability where faculty_profile_id = profile.id and available_date is not null) then
      qualified := qualified || 'open-door'::text;
    end if;
    if (
      select count(*) from public.appointment_requests
      where faculty_profile_id = profile.id
        and status in ('confirmed', 'declined')
        and updated_at - created_at <= interval '24 hours'
    ) >= 5 then
      qualified := qualified || 'quick-responder'::text;
    end if;
    select count(*) into completed from public.appointment_requests
    where faculty_profile_id = profile.id and status = 'confirmed' and preferred_date < current_date;
    if completed >= 10 then qualified := qualified || 'mentor'::text; end if;
  end if;

  with inserted as (
    insert into public.user_badges (profile_id, badge_id)
    select profile.id, badge_id from unnest(qualified) as badge_id
    on conflict do nothing
    returning badge_id
  ),
  named as (
    select badges.name, badges.sort_order
    from inserted join public.badges on badges.id = inserted.badge_id
  ),
  notified as (
    insert into public.notifications (recipient_profile_id, kind, title, body)
    select profile.id, 'badge_earned', 'Badge earned: ' || named.name, 'You earned the "' || named.name || '" badge. See it on your profile.'
    from named
  )
  select array_agg(name order by sort_order) into new_names from named;

  return coalesce(new_names, '{}');
end;
$$;

revoke all on function public.award_badges(uuid, integer) from public, anon, authenticated;

drop function if exists public.record_daily_login(date);
create function public.record_daily_login(client_date date)
returns table (current_streak integer, longest_streak integer, active_dates date[], badge_count integer, new_badges text[])
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid;
  today date := case
    when client_date between current_date - 1 and current_date + 1 then client_date
    else current_date
  end;
  current_length integer;
  longest_length integer;
  earned text[];
begin
  select id into caller_id from public.profiles where auth_user_id = auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.login_activity (profile_id, activity_date)
  values (caller_id, today)
  on conflict do nothing;

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
    coalesce((select length from streaks where last_day = today), 0),
    coalesce((select max(length) from streaks), 0)
  into current_length, longest_length;

  earned := public.award_badges(caller_id, longest_length);

  return query
  select
    current_length,
    longest_length,
    coalesce((
      select array_agg(activity_date order by activity_date)
      from public.login_activity
      where profile_id = caller_id and activity_date between today - 6 and today
    ), '{}'::date[]),
    (select count(*)::integer from public.user_badges where profile_id = caller_id),
    earned;
end;
$$;

revoke all on function public.record_daily_login(date) from public, anon;
grant execute on function public.record_daily_login(date) to authenticated;
