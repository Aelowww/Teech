alter table public.profiles
  add column if not exists presence_status text not null default 'available'
  check (presence_status in ('available', 'in_meeting', 'busy'));

grant update (presence_status) on public.profiles to authenticated;
