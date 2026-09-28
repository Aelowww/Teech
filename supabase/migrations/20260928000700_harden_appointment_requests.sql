drop policy if exists "Students can create own requests" on public.appointment_requests;
create policy "Students can create own requests"
on public.appointment_requests for insert to authenticated
with check (
  student_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid() and role = 'student'
  )
  and status = 'pending'
  and faculty_profile_id in (select id from public.profiles where role = 'faculty')
);

drop policy if exists "Faculty can update assigned requests" on public.appointment_requests;
create policy "Faculty can update assigned requests"
on public.appointment_requests for update to authenticated
using (
  faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty')
  and status = 'pending'
)
with check (
  faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty')
  and status in ('confirmed', 'declined')
);

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

  if new.preferred_date is null or new.preferred_time is null or new.preferred_date < current_date then
    raise exception 'The selected date is no longer available.';
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

drop trigger if exists appointment_request_prepare on public.appointment_requests;
create trigger appointment_request_prepare
before insert on public.appointment_requests
for each row execute procedure public.prepare_appointment_request();

create or replace function public.assign_appointment_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.appointment_code := 'APPT-'
    || to_char(coalesce(new.preferred_date, current_date), 'YYYY')
    || '-'
    || lpad(nextval('public.appointment_reference_sequence')::text, 4, '0');
  return new;
end;
$$;
