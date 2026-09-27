create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  appointment_request_id uuid references public.appointment_requests(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_profile_id, created_at desc);

alter table public.notifications enable row level security;
alter table public.notifications replica identity full;

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

drop policy if exists "Users can view their notifications" on public.notifications;
drop policy if exists "Users can mark their notifications read" on public.notifications;

create policy "Users can view their notifications"
on public.notifications for select to authenticated
using (
  recipient_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid()
  )
);

create policy "Users can mark their notifications read"
on public.notifications for update to authenticated
using (
  recipient_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid()
  )
)
with check (
  recipient_profile_id = (
    select id from public.profiles where auth_user_id = auth.uid()
  )
);

create or replace function public.create_account_notifications()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.notifications (recipient_profile_id, kind, title, body)
  values
    (new.id, 'account_created', 'Account created', 'Your Teech account is ready to use.'),
    (new.id, 'welcome', 'Welcome to Teech', 'Set up your profile and start managing consultations.');
  return new;
end;
$$;

drop trigger if exists profile_account_notifications on public.profiles;
create trigger profile_account_notifications
after insert on public.profiles
for each row execute procedure public.create_account_notifications();

create or replace function public.create_appointment_notifications()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  consultation_date text := to_char(new.preferred_date, 'Mon FMDD, YYYY');
  faculty_display_name text := coalesce(nullif(new.faculty_name, ''), 'your faculty member');
  student_display_name text := coalesce(nullif(new.student_name, ''), 'A student');
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
    values
      (new.student_profile_id, new.id, 'request_submitted', 'Request submitted', 'Your consultation request with ' || faculty_display_name || ' for ' || consultation_date || ' was submitted.'),
      (new.faculty_profile_id, new.id, 'request_received', 'New consultation request', student_display_name || ' requested a consultation for ' || consultation_date || '.');
  elsif new.status is distinct from old.status then
    if new.status = 'confirmed' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.student_profile_id, new.id, 'request_confirmed', 'Consultation confirmed', faculty_display_name || ' confirmed your consultation for ' || consultation_date || '.');
    elsif new.status = 'declined' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.student_profile_id, new.id, 'request_declined', 'Consultation declined', faculty_display_name || ' declined your consultation request for ' || consultation_date || '.');
    elsif new.status = 'cancelled' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.faculty_profile_id, new.id, 'request_cancelled', 'Request cancelled', student_display_name || ' cancelled their consultation request for ' || consultation_date || '.');
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_notification_events on public.appointment_requests;
create trigger appointment_notification_events
after insert or update of status on public.appointment_requests
for each row execute procedure public.create_appointment_notifications();

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.appointment_requests;
exception
  when duplicate_object then null;
end;
$$;
