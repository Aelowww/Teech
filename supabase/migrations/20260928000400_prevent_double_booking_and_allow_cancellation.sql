drop policy if exists "Students can cancel own requests" on public.appointment_requests;
drop policy if exists "Students can cancel active requests" on public.appointment_requests;

create policy "Students can cancel active requests"
on public.appointment_requests for update to authenticated
using (
  student_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid()
  )
  and status in ('pending', 'confirmed')
)
with check (
  student_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid()
  )
  and status = 'cancelled'
);

create unique index if not exists confirmed_appointment_slot_unique
  on public.appointment_requests (faculty_profile_id, preferred_date, preferred_time)
  where status = 'confirmed';

create or replace function public.get_confirmed_appointment_times(
  requested_faculty_profile_id uuid,
  requested_date date
)
returns table (preferred_time time without time zone)
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select requests.preferred_time
  from public.appointment_requests requests
  where requests.faculty_profile_id = requested_faculty_profile_id
    and requests.preferred_date = requested_date
    and requests.status = 'confirmed';
end;
$$;

revoke all on function public.get_confirmed_appointment_times(uuid, date) from public;
grant execute on function public.get_confirmed_appointment_times(uuid, date) to authenticated;
