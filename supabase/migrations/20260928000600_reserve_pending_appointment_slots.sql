drop index if exists public.confirmed_appointment_slot_unique;

create unique index if not exists active_appointment_slot_unique
  on public.appointment_requests (faculty_profile_id, preferred_date, preferred_time)
  where status in ('pending', 'confirmed');

create or replace function public.get_reserved_appointment_slots(
  requested_faculty_profile_id uuid
)
returns table (
  preferred_date date,
  preferred_time time without time zone
)
language plpgsql

security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select requests.preferred_date, requests.preferred_time
  from public.appointment_requests requests
  where requests.faculty_profile_id = requested_faculty_profile_id
    and requests.status in ('pending', 'confirmed')
    and requests.preferred_date >= current_date;
end;
$$;

revoke all on function public.get_reserved_appointment_slots(uuid) from public;
grant execute on function public.get_reserved_appointment_slots(uuid) to authenticated;
