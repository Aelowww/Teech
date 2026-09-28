create or replace function public.security_question_options()
returns text[]
language sql
immutable
as $$
  select array[
    'What is the name of your childhood best friend?',
    'What city do you live in?',
    'What is your mother''s first name?',
    'What is your father''s first name?',
    'What was the name of your first pet?',
    'What city were you born in?',
    'What was the name of your first school?',
    'What is your favorite food?',
    'What is your favorite color?',
    'What was your childhood nickname?'
  ];
$$;

create table if not exists public.login_activity (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  primary key (profile_id, activity_date)
);

alter table public.login_activity enable row level security;
revoke all on public.login_activity from anon, authenticated;

create or replace function public.record_daily_login(client_date date)
returns table (current_streak integer, longest_streak integer, active_dates date[])
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid;
  today date := case
    when client_date between current_date - 1 and current_date + 1 then client_date
    else current_date
  end;
begin
  select id into caller_id from public.profiles where auth_user_id = auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.login_activity (profile_id, activity_date)
  values (caller_id, today)
  on conflict do nothing;

  return query
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
    coalesce((select max(length) from streaks), 0),
    coalesce((
      select array_agg(activity_date order by activity_date)
      from public.login_activity
      where profile_id = caller_id and activity_date between today - 6 and today
    ), '{}'::date[]);
end;
$$;

revoke all on function public.record_daily_login(date) from public;
grant execute on function public.record_daily_login(date) to authenticated;
