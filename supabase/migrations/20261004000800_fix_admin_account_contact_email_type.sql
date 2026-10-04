create or replace function public.admin_account_contact(target_profile_id uuid)
returns table (role text, full_name text, email text, verification_status text, verification_note text)
language plpgsql
stable
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  return query
  select p.role, p.full_name, u.email::text, p.verification_status, p.verification_note
  from public.profiles p
  join auth.users u on u.id = p.auth_user_id
  where p.id = target_profile_id and p.role in ('student', 'faculty');
end;
$$;

revoke all on function public.admin_account_contact(uuid) from public, anon;
grant execute on function public.admin_account_contact(uuid) to authenticated;
