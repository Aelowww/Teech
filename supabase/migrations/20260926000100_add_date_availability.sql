alter table public.faculty_availability
  add column if not exists available_date date;

alter table public.faculty_availability
  alter column day_of_week drop not null;

create unique index if not exists faculty_availability_date_time_unique
  on public.faculty_availability (faculty_profile_id, available_date, start_time, end_time)
  where available_date is not null;

create index if not exists faculty_availability_date_lookup
  on public.faculty_availability (faculty_profile_id, available_date)
  where available_date is not null and is_available = true;
