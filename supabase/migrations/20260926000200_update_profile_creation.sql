create extension if not exists pgcrypto;

alter table public.profiles
  alter column id set default gen_random_uuid();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  profile_role text := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'student');
  profile_name text := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1));
begin

  update public.profiles
  set
    auth_user_id = new.id,
    role = profile_role,
    full_name = profile_name,
    email = new.email,
    student_number = nullif(new.raw_user_meta_data ->> 'student_number', ''),
    faculty_number = nullif(new.raw_user_meta_data ->> 'faculty_number', ''),
    course_year = nullif(new.raw_user_meta_data ->> 'course_year', ''),
    department = nullif(new.raw_user_meta_data ->> 'department', '')
  where auth_user_id is null
    and lower(email) = lower(new.email);

  if not found then
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
      profile_role,
      profile_name,
      new.email,
      nullif(new.raw_user_meta_data ->> 'student_number', ''),
      nullif(new.raw_user_meta_data ->> 'faculty_number', ''),
      nullif(new.raw_user_meta_data ->> 'course_year', ''),
      nullif(new.raw_user_meta_data ->> 'department', '')
    ) on conflict (auth_user_id) do update set
      role = excluded.role,
      full_name = excluded.full_name,
      email = excluded.email,
      student_number = excluded.student_number,
      faculty_number = excluded.faculty_number,
      course_year = excluded.course_year,
      department = excluded.department;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
