-- Faculty can cancel consultations they already confirmed, and every request
-- records who cancelled it so the other person is notified.

alter table public.appointment_requests
  add column if not exists cancelled_by text;

alter table public.appointment_requests
  drop constraint if exists appointment_requests_cancelled_by_check;
alter table public.appointment_requests
  add constraint appointment_requests_cancelled_by_check
  check (cancelled_by is null or cancelled_by in ('student', 'faculty'));

drop policy if exists "Faculty can update assigned requests" on public.appointment_requests;
create policy "Faculty can update assigned requests"
on public.appointment_requests for update to authenticated
using (
  faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty')
  and status in ('pending', 'confirmed')
)
with check (
  faculty_profile_id in (select id from public.profiles where auth_user_id = auth.uid() and role = 'faculty')
  and status in ('confirmed', 'declined', 'cancelled')
);

-- Only these status changes are allowed, whoever makes them:
--   pending   -> confirmed | declined | cancelled
--   confirmed -> cancelled
create or replace function public.enforce_appointment_status_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if not (
    (old.status = 'pending' and new.status in ('confirmed', 'declined', 'cancelled'))
    or (old.status = 'confirmed' and new.status = 'cancelled')
  ) then
    raise exception 'This request can no longer be changed from % to %.', old.status, new.status;
  end if;

  if new.status = 'cancelled' then
    new.cancelled_by := case
      when exists (
        select 1 from public.profiles
        where id = new.faculty_profile_id and auth_user_id = auth.uid()
      ) then 'faculty'
      else 'student'
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists appointment_request_status_change on public.appointment_requests;
create trigger appointment_request_status_change
before update of status on public.appointment_requests
for each row execute procedure public.enforce_appointment_status_change();

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
    elsif new.status = 'cancelled' and new.cancelled_by = 'faculty' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.student_profile_id, new.id, 'request_cancelled', 'Consultation cancelled', faculty_display_name || ' cancelled your consultation for ' || consultation_date || '.');
    elsif new.status = 'cancelled' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.faculty_profile_id, new.id, 'request_cancelled', 'Request cancelled', student_display_name || ' cancelled their consultation request for ' || consultation_date || '.');
    end if;
  end if;

  return new;
end;
$$;
