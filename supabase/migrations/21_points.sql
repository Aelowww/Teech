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
  return new;
end;
$$;

update public.notifications notification
set created_at = created.created_at + interval '1 millisecond'
from public.notifications created
where notification.kind = 'welcome'
  and created.kind = 'account_created'
  and created.recipient_profile_id = notification.recipient_profile_id
  and notification.created_at <= created.created_at;

alter table public.login_activity
  add column if not exists frozen boolean not null default false;

create table if not exists public.points_ledger (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  activity_date date,
  created_at timestamptz not null default now()
);

create index if not exists points_ledger_profile_created_idx
  on public.points_ledger (profile_id, created_at desc);

alter table public.points_ledger enable row level security;
revoke all on public.points_ledger from anon, authenticated;
grant select on public.points_ledger to authenticated;
drop policy if exists "Users can view their points" on public.points_ledger;
create policy "Users can view their points"
on public.points_ledger for select to authenticated
using (profile_id = (select id from public.profiles where auth_user_id = auth.uid()));

create table if not exists public.streak_freezes (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  available integer not null default 0 check (available >= 0)
);

alter table public.streak_freezes enable row level security;
revoke all on public.streak_freezes from anon, authenticated;
grant select on public.streak_freezes to authenticated;
drop policy if exists "Users can view their streak freezes" on public.streak_freezes;
create policy "Users can view their streak freezes"
on public.streak_freezes for select to authenticated
using (profile_id = (select id from public.profiles where auth_user_id = auth.uid()));

insert into public.badges (id, role, name, description, sort_order) values
  ('shop-bookworm', 'all', 'Bookworm', 'Redeem in the points shop', 20),
  ('shop-night-owl', 'all', 'Night Owl', 'Redeem in the points shop', 21),
  ('shop-legend', 'all', 'Legend', 'Redeem in the points shop', 22)
on conflict (id) do update set
  role = excluded.role,
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.shop_items (
  id text primary key,
  name text not null,
  description text not null,
  cost integer not null check (cost > 0),
  kind text not null check (kind in ('freeze', 'badge')),
  badge_id text references public.badges(id) on delete cascade,
  max_owned integer not null default 1,
  sort_order integer not null
);

insert into public.shop_items (id, name, description, cost, kind, badge_id, max_owned, sort_order) values
  ('streak-freeze', 'Streak Freeze', 'Protects your streak if you miss a day. Used automatically.', 40, 'freeze', null, 2, 1),
  ('badge-bookworm', 'Bookworm Badge', 'A collectible badge for your profile.', 100, 'badge', 'shop-bookworm', 1, 2),
  ('badge-night-owl', 'Night Owl Badge', 'A rarer collectible badge for your profile.', 150, 'badge', 'shop-night-owl', 1, 3),
  ('badge-legend', 'Legend Badge', 'The rarest collectible badge in Teech.', 300, 'badge', 'shop-legend', 1, 4)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  cost = excluded.cost,
  kind = excluded.kind,
  badge_id = excluded.badge_id,
  max_owned = excluded.max_owned,
  sort_order = excluded.sort_order;

alter table public.shop_items enable row level security;
revoke all on public.shop_items from anon, authenticated;
grant select on public.shop_items to authenticated;
drop policy if exists "Signed-in users can view the shop" on public.shop_items;
create policy "Signed-in users can view the shop"
on public.shop_items for select to authenticated using (true);

create or replace function public.streak_reward(streak_day integer)
returns integer
language sql
immutable
as $$
  select case ((greatest(streak_day, 1) - 1) % 7) + 1
    when 1 then 5
    when 2 then 5
    when 3 then 10
    when 4 then 10
    when 5 then 15
    when 6 then 15
    else 25
  end;
$$;

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
    select profile.id, 'badge_earned', 'Badge earned: ' || named.name, 'You earned the "' || named.name || '" badge and 20 points. See it on your profile.'
    from named
  ),
  rewarded as (
    insert into public.points_ledger (profile_id, amount, reason)
    select profile.id, 20, 'Badge earned: ' || named.name
    from named
  )
  select array_agg(name order by sort_order) into new_names from named;

  return coalesce(new_names, '{}');
end;
$$;

revoke all on function public.award_badges(uuid, integer) from public, anon, authenticated;

drop function if exists public.record_daily_login(date);
create function public.record_daily_login(client_date date)
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
  checked_in := found;

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

create or replace function public.redeem_shop_item(requested_item_id text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid;
  item public.shop_items%rowtype;
  balance integer;
  owned integer;
begin
  select id into caller_id from public.profiles where auth_user_id = auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('points:' || caller_id::text));

  select * into item from public.shop_items where id = requested_item_id;
  if item.id is null then
    raise exception 'This item is not available.';
  end if;

  select coalesce(sum(amount), 0) into balance from public.points_ledger where profile_id = caller_id;
  if balance < item.cost then
    raise exception 'You need % more points for this.', item.cost - balance;
  end if;

  if item.kind = 'freeze' then
    select available into owned from public.streak_freezes where profile_id = caller_id;
    if coalesce(owned, 0) >= item.max_owned then
      raise exception 'You can hold up to % streak freezes at a time.', item.max_owned;
    end if;
    insert into public.streak_freezes (profile_id, available) values (caller_id, 1)
    on conflict (profile_id) do update set available = streak_freezes.available + 1;
  else
    if exists (select 1 from public.user_badges where profile_id = caller_id and badge_id = item.badge_id) then
      raise exception 'You already own this badge.';
    end if;
    insert into public.user_badges (profile_id, badge_id) values (caller_id, item.badge_id);
  end if;

  insert into public.points_ledger (profile_id, amount, reason)
  values (caller_id, -item.cost, 'Redeemed: ' || item.name);
end;
$$;

revoke all on function public.redeem_shop_item(text) from public, anon;
grant execute on function public.redeem_shop_item(text) to authenticated;
