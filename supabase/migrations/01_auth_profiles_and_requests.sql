alter table public.profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

alter table public.appointment_requests
  add column if not exists student_name text,
  add column if not exists student_number text,
  add column if not exists faculty_name text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists appointments_set_updated_at on public.appointment_requests;
create trigger appointments_set_updated_at
before update on public.appointment_requests
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    auth_user_id,
    role,
    full_name,
    email,
    student_number,
    faculty_number,
    course_year,
    department
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'student_number', ''),
    nullif(new.raw_user_meta_data ->> 'faculty_number', ''),
    nullif(new.raw_user_meta_data ->> 'course_year', ''),
    nullif(new.raw_user_meta_data ->> 'department', '')
  ) on conflict (auth_user_id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    student_number = excluded.student_number,
    faculty_number = excluded.faculty_number,
    course_year = excluded.course_year,
    department = excluded.department;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.profiles (
  auth_user_id,
  role,
  full_name,
  email,
  student_number,
  faculty_number,
  course_year,
  department
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'role', 'student'),
  coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1)),
  users.email,
  nullif(users.raw_user_meta_data ->> 'student_number', ''),
  nullif(users.raw_user_meta_data ->> 'faculty_number', ''),
  nullif(users.raw_user_meta_data ->> 'course_year', ''),
  nullif(users.raw_user_meta_data ->> 'department', '')
from auth.users users
left join public.profiles profiles on profiles.auth_user_id = users.id
where profiles.id is null
on conflict (auth_user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.faculty_availability enable row level security;
alter table public.appointment_requests enable row level security;

revoke all on public.profiles, public.faculty_availability, public.appointment_requests
from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.faculty_availability to anon;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.faculty_availability to authenticated;
grant select, insert on public.appointment_requests to authenticated;
grant update(status) on public.appointment_requests to authenticated;

drop policy if exists "Public can view faculty profiles" on public.profiles;
drop policy if exists "Profiles are readable by their owner" on public.profiles;
drop policy if exists "Profiles are readable by signed-in users" on public.profiles;
create policy "Public can view faculty profiles"
on public.profiles for select to anon using (role = 'faculty');
create policy "Profiles are readable by signed-in users"
on public.profiles for select to authenticated
using (role = 'faculty' or auth_user_id = auth.uid());

drop policy if exists "Public can view faculty availability" on public.faculty_availability;
drop policy if exists "Signed-in users can view faculty availability" on public.faculty_availability;
drop policy if exists "Faculty can manage own availability" on public.faculty_availability;
create policy "Public can view faculty availability"
on public.faculty_availability for select to anon using (true);
create policy "Signed-in users can view faculty availability"
on public.faculty_availability for select to authenticated using (true);
create policy "Faculty can manage own availability"
on public.faculty_availability for all to authenticated
using (faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty'))
with check (faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty'));

drop policy if exists "Students can view own requests" on public.appointment_requests;
drop policy if exists "Faculty can view assigned requests" on public.appointment_requests;
drop policy if exists "Students can create own requests" on public.appointment_requests;
drop policy if exists "Faculty can update assigned requests" on public.appointment_requests;
drop policy if exists "Students can cancel own requests" on public.appointment_requests;
create policy "Students can view own requests"
on public.appointment_requests for select to authenticated
using (student_profile_id = (select id from public.profiles where auth_user_id = auth.uid()));
create policy "Faculty can view assigned requests"
on public.appointment_requests for select to authenticated
using (faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty'));
create policy "Students can create own requests"
on public.appointment_requests for insert to authenticated
with check (student_profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "Faculty can update assigned requests"
on public.appointment_requests for update to authenticated
using (faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty'))
with check (faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty'));
create policy "Students can cancel own requests"
on public.appointment_requests for update to authenticated
using (student_profile_id in (select id from public.profiles where auth_user_id = auth.uid()) and status = 'pending')
with check (student_profile_id in (select id from public.profiles where auth_user_id = auth.uid()) and status = 'cancelled');
