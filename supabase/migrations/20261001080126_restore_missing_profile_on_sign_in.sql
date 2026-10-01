create or replace function public.ensure_my_profile()
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  account auth.users%rowtype;
  existing_role text;
begin
  select role into existing_role from public.profiles where auth_user_id = auth.uid();
  if existing_role is not null then
    return existing_role;
  end if;

  select * into account from auth.users where id = auth.uid();
  if account.id is null then
    return null;
  end if;

  insert into public.profiles (auth_user_id, role, full_name, email, student_number, faculty_number, course_year, department)
  values (
    account.id,
    case when account.raw_user_meta_data ->> 'role' = 'faculty' then 'faculty' else 'student' end,
    coalesce(nullif(account.raw_user_meta_data ->> 'full_name', ''), split_part(account.email, '@', 1)),
    account.email,
    nullif(account.raw_user_meta_data ->> 'student_number', ''),
    nullif(account.raw_user_meta_data ->> 'faculty_number', ''),
    nullif(account.raw_user_meta_data ->> 'course_year', ''),
    nullif(account.raw_user_meta_data ->> 'department', '')
  )
  on conflict do nothing;

  select role into existing_role from public.profiles where auth_user_id = auth.uid();
  return existing_role;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;
