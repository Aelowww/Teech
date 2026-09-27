create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where auth_user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists auth_user_email_changed on auth.users;
create trigger auth_user_email_changed
after update of email on auth.users
for each row execute procedure public.sync_profile_email();

update public.profiles profiles
set email = users.email
from auth.users users
where profiles.auth_user_id = users.id
  and profiles.email is distinct from users.email;
