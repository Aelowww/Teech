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
      and preferred_date >= current_date
  ) then
    raise exception 'You already have a pending request with this faculty member. Wait for their response or cancel it first.';
  end if;

  if (
    select count(*) from public.appointment_requests
    where student_profile_id = new.student_profile_id
      and status = 'pending'
      and preferred_date >= current_date
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

  if new.status = 'confirmed' and old.preferred_date < current_date then
    raise exception 'This request''s date has passed, so it can no longer be confirmed.';
  end if;

  if new.status = 'cancelled' then
    new.cancelled_by := case
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
