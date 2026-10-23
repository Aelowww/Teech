revoke update (department) on public.profiles from authenticated;

create or replace function public.enforce_profile_locks()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role in ('student', 'faculty') then
    new.department := 'IT';
  end if;
  if tg_op = 'UPDATE'
    and old.role = 'student'
    and new.full_name is distinct from old.full_name
    and current_user in ('authenticated', 'anon') then
    raise exception 'Student names cannot be changed.';
  end if;
  if new.role = 'student'
    and new.course_year is not null
    and new.course_year is distinct from case when tg_op = 'UPDATE' then old.course_year end
    and new.course_year !~ '^IT - Year [1-4]$'
    and current_user in ('authenticated', 'anon') then
    raise exception 'Course must be IT with a year level from 1 to 4.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_locks on public.profiles;
create trigger enforce_profile_locks
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_locks();

update public.profiles
set department = 'IT'
where role in ('student', 'faculty') and department is distinct from 'IT';
