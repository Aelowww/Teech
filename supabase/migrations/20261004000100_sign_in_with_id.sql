create unique index if not exists profiles_faculty_number_ci_key
  on public.profiles (lower(btrim(faculty_number)))
  where faculty_number is not null;

create table if not exists public.login_attempts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  failed_count integer not null default 0,
  locked_until timestamptz,
  lockouts integer not null default 0
);

alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;

create or replace function public.resolve_sign_in(requested_role text, identifier text, password text)
returns table (status text, email text)
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  account public.profiles%rowtype;
  account_email text;
  stored_hash text;
  attempt public.login_attempts%rowtype;
  cleaned text := lower(btrim(coalesce(identifier, '')));
begin
  if requested_role not in ('student', 'faculty') or cleaned = '' or coalesce(password, '') = '' or char_length(password) > 200 then
    return query select 'invalid'::text, null::text;
    return;
  end if;

  select p.* into account
  from public.profiles p
  where p.role = requested_role
    and p.auth_user_id is not null
    and lower(btrim(case when requested_role = 'student' then p.student_number else p.faculty_number end)) = cleaned
  limit 1;

  if account.id is null then
    perform crypt(password, gen_salt('bf', 10));
    return query select 'invalid'::text, null::text;
    return;
  end if;

  select * into attempt from public.login_attempts where profile_id = account.id;
  if attempt.locked_until is not null and attempt.locked_until > now() then
    return query select 'locked'::text, null::text;
    return;
  end if;

  select u.email, u.encrypted_password into account_email, stored_hash
  from auth.users u
  where u.id = account.auth_user_id;

  if stored_hash is null or stored_hash = '' or stored_hash <> crypt(password, stored_hash) then
    insert into public.login_attempts (profile_id, failed_count, locked_until, lockouts)
    values (account.id, 1, null, 0)
    on conflict (profile_id) do update set
      failed_count = case when login_attempts.failed_count + 1 >= 5 then 0 else login_attempts.failed_count + 1 end,
      lockouts = case when login_attempts.failed_count + 1 >= 5 then login_attempts.lockouts + 1 else login_attempts.lockouts end,
      locked_until = case
        when login_attempts.failed_count + 1 < 5 then null
        when login_attempts.lockouts + 1 >= 3 then now() + interval '24 hours'
        else now() + interval '15 minutes'
      end;
    return query select 'invalid'::text, null::text;
    return;
  end if;

  delete from public.login_attempts where profile_id = account.id;
  return query select 'ok'::text, account_email;
end;
$$;

revoke all on function public.resolve_sign_in(text, text, text) from public;
grant execute on function public.resolve_sign_in(text, text, text) to anon, authenticated;

create or replace function public.reset_login_attempts_on_password_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    delete from public.login_attempts
    where profile_id in (select id from public.profiles where auth_user_id = new.id);
  end if;
  return new;
end;
$$;

revoke all on function public.reset_login_attempts_on_password_change() from public, anon, authenticated;

drop trigger if exists auth_user_password_changed on auth.users;
create trigger auth_user_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.reset_login_attempts_on_password_change();
