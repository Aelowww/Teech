alter table public.user_badges
  add column if not exists showcased boolean not null default false;

create or replace function public.set_badge_showcase(requested_badge_id text, show boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller_id uuid;
begin
  select id into caller_id from public.profiles where auth_user_id = auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('showcase:' || caller_id::text));

  if show and (
    select count(*) from public.user_badges
    where profile_id = caller_id and showcased and badge_id <> requested_badge_id
  ) >= 3 then
    raise exception 'You can show up to 3 badges on your profile. Hide one first.';
  end if;

  update public.user_badges
  set showcased = show
  where profile_id = caller_id and badge_id = requested_badge_id;
  if not found then
    raise exception 'You have not earned this badge yet.';
  end if;
end;
$$;

revoke all on function public.set_badge_showcase(text, boolean) from public, anon;
grant execute on function public.set_badge_showcase(text, boolean) to authenticated;
