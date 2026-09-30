alter table public.appointment_requests
  drop constraint if exists appointment_requests_cancelled_by_check;
alter table public.appointment_requests
  add constraint appointment_requests_cancelled_by_check
  check (cancelled_by is null or cancelled_by in ('student', 'faculty', 'system'));

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

  if new.status = 'confirmed' and old.preferred_date < current_date then
    raise exception 'This request''s date has passed, so it can no longer be confirmed.';
  end if;

  if new.status = 'cancelled' then
    new.cancelled_by := case
      when auth.uid() is null then 'system'
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
    elsif new.status = 'cancelled' and new.cancelled_by = 'system' then
      insert into public.notifications (recipient_profile_id, appointment_request_id, kind, title, body)
      values (new.student_profile_id, new.id, 'request_expired', 'Request expired', 'Your consultation request with ' || faculty_display_name || ' for ' || consultation_date || ' expired without a response.');
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

create or replace function public.expire_stale_requests()
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  expired_count integer;
begin
  update public.appointment_requests
  set status = 'cancelled'
  where status = 'pending'
    and preferred_date < (now() at time zone 'Asia/Manila')::date;
  get diagnostics expired_count = row_count;
  return expired_count;
end;
$$;

revoke all on function public.expire_stale_requests() from public, anon, authenticated;

do $$
begin
  create extension if not exists pg_cron;
  if exists (select 1 from cron.job where jobname = 'expire-stale-requests') then
    perform cron.unschedule('expire-stale-requests');
  end if;
  perform cron.schedule('expire-stale-requests', '5 16 * * *', 'select public.expire_stale_requests()');
exception
  when others then
    raise notice 'Could not schedule expiry job: %', sqlerrm;
end;
$$;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  booking record;
begin
  select * into caller from public.profiles where auth_user_id = auth.uid();
  if caller.id is null then
    raise exception 'Authentication required';
  end if;

  for booking in
    select * from public.appointment_requests
    where (student_profile_id = caller.id or faculty_profile_id = caller.id)
      and status in ('pending', 'confirmed')
      and preferred_date >= current_date
  loop
    insert into public.notifications (recipient_profile_id, kind, title, body)
    values (
      case when booking.student_profile_id = caller.id then booking.faculty_profile_id else booking.student_profile_id end,
      'request_cancelled',
      'Consultation cancelled',
      coalesce(nullif(caller.full_name, ''), 'A user') || ' deleted their account, so the consultation on '
        || to_char(booking.preferred_date, 'Mon FMDD, YYYY') || ' was cancelled.'
    );
  end loop;

  delete from public.appointment_requests
  where student_profile_id = caller.id or faculty_profile_id = caller.id;
  delete from public.faculty_availability where faculty_profile_id = caller.id;

  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
