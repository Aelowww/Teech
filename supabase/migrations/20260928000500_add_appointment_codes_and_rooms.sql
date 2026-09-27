alter table public.faculty_availability
  add column if not exists meeting_location text;

alter table public.appointment_requests
  add column if not exists appointment_code text,
  add column if not exists meeting_location text;

create sequence if not exists public.appointment_reference_sequence;

create or replace function public.assign_appointment_code()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.appointment_code is null or btrim(new.appointment_code) = '' then
    new.appointment_code := 'APPT-'
      || to_char(coalesce(new.preferred_date, current_date), 'YYYY')
      || '-'
      || lpad(nextval('public.appointment_reference_sequence')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_request_assign_code on public.appointment_requests;
create trigger appointment_request_assign_code
before insert on public.appointment_requests
for each row execute procedure public.assign_appointment_code();

update public.appointment_requests
set appointment_code = 'APPT-'
  || to_char(coalesce(preferred_date, current_date), 'YYYY')
  || '-'
  || lpad(nextval('public.appointment_reference_sequence')::text, 4, '0')
where appointment_code is null or btrim(appointment_code) = '';

create unique index if not exists appointment_request_code_unique
  on public.appointment_requests (appointment_code)
  where appointment_code is not null;
