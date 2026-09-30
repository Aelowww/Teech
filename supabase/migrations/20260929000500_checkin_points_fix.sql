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
  today date := case
    when client_date between current_date - 1 and current_date + 1 then client_date
    else current_date
  end;
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
