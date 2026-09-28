drop policy if exists "Public can view faculty profiles" on public.profiles;
drop policy if exists "Public can view faculty availability" on public.faculty_availability;
revoke select on public.profiles, public.faculty_availability from anon;

alter table public.appointment_requests
  drop constraint if exists appointment_requests_reason_length,
  drop constraint if exists appointment_requests_details_length;
alter table public.appointment_requests
  add constraint appointment_requests_reason_length check (char_length(reason) <= 200) not valid,
  add constraint appointment_requests_details_length check (details is null or char_length(details) <= 1000) not valid;
