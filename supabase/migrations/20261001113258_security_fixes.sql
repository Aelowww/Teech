create or replace function public.reset_student_password(requested_student_number text, questions text[], answers text[], new_password text)
returns text
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  student public.profiles%rowtype;
  attempt public.password_reset_attempts%rowtype;
  matched integer;
begin
  if char_length(coalesce(new_password, '')) < 8
    or new_password !~ '[a-z]'
    or new_password !~ '[A-Z]'
    or new_password !~ '[0-9]'
    or new_password !~ '[^A-Za-z0-9]' then
    return 'weak_password';
  end if;

  select * into student
  from public.profiles
  where role = 'student' and lower(btrim(student_number)) = lower(btrim(requested_student_number));
  if student.id is null or student.auth_user_id is null then
    return 'invalid';
  end if;

  select * into attempt from public.password_reset_attempts where profile_id = student.id;
  if attempt.locked_until is not null and attempt.locked_until > now() then
    return 'locked';
  end if;

  select count(distinct stored.id) into matched
  from public.student_security_answers stored
  join unnest(questions, answers) as given(question, answer) on given.question = stored.question
  where stored.profile_id = student.id
    and stored.answer_hash = crypt(public.normalize_security_answer(given.answer), stored.answer_hash);

  if matched <> 3 then
    insert into public.password_reset_attempts (profile_id, failed_count, locked_until, lockouts)
    values (student.id, 1, null, 0)
    on conflict (profile_id) do update set
      failed_count = case when password_reset_attempts.failed_count + 1 >= 5 then 0 else password_reset_attempts.failed_count + 1 end,
      lockouts = case when password_reset_attempts.failed_count + 1 >= 5 then password_reset_attempts.lockouts + 1 else password_reset_attempts.lockouts end,
      locked_until = case
        when password_reset_attempts.failed_count + 1 < 5 then null
        when password_reset_attempts.lockouts + 1 >= 3 then now() + interval '24 hours'
        else now() + interval '15 minutes'
      end;
    return 'invalid';
  end if;

  update auth.users
  set encrypted_password = crypt(new_password, gen_salt('bf', 10)), updated_at = now()
  where id = student.auth_user_id;
  delete from auth.sessions where user_id = student.auth_user_id;
  delete from public.password_reset_attempts where profile_id = student.id;
  return 'ok';
end;
$$;

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
  if account.id is null or coalesce(account.raw_user_meta_data ->> 'role', 'student') <> 'student' then
    return null;
  end if;

  insert into public.profiles (auth_user_id, role, full_name, email, student_number, course_year)
  values (
    account.id,
    'student',
    coalesce(nullif(account.raw_user_meta_data ->> 'full_name', ''), split_part(account.email, '@', 1)),
    account.email,
    nullif(account.raw_user_meta_data ->> 'student_number', ''),
    nullif(account.raw_user_meta_data ->> 'course_year', '')
  )
  on conflict do nothing;

  select role into existing_role from public.profiles where auth_user_id = auth.uid();
  return existing_role;
end;
$$;

revoke all on function public.ensure_my_profile() from public, anon;
grant execute on function public.ensure_my_profile() to authenticated;

revoke all on function public.assign_appointment_code() from public, anon, authenticated;
revoke all on function public.create_account_notifications() from public, anon, authenticated;
revoke all on function public.create_appointment_notifications() from public, anon, authenticated;
revoke all on function public.enforce_appointment_status_change() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.prepare_appointment_request() from public, anon, authenticated;
revoke all on function public.sync_profile_email() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

revoke all on function public.get_confirmed_appointment_times(uuid, date) from public, anon;
grant execute on function public.get_confirmed_appointment_times(uuid, date) to authenticated;
revoke all on function public.get_reserved_appointment_slots(uuid) from public, anon;
grant execute on function public.get_reserved_appointment_slots(uuid) to authenticated;
revoke all on function public.set_security_answers(text[], text[]) from public, anon;
grant execute on function public.set_security_answers(text[], text[]) to authenticated;

alter function public.set_updated_at() set search_path = '';
alter function public.normalize_security_answer(text) set search_path = '';
alter function public.security_question_options() set search_path = '';
alter function public.streak_reward(integer) set search_path = '';
alter function public.local_today() set search_path = '';
