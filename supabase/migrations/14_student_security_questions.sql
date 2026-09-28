create extension if not exists pgcrypto with schema extensions;

create table if not exists public.student_security_answers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  answer_hash text not null,
  updated_at timestamptz not null default now(),
  unique (profile_id, question)
);

alter table public.student_security_answers enable row level security;
revoke all on public.student_security_answers from anon, authenticated;
grant select (id, profile_id, question, updated_at) on public.student_security_answers to authenticated;

drop policy if exists "Students can view their security questions" on public.student_security_answers;
create policy "Students can view their security questions"
on public.student_security_answers for select to authenticated
using (profile_id = (select id from public.profiles where auth_user_id = auth.uid()));

create table if not exists public.password_reset_attempts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  failed_count integer not null default 0,
  locked_until timestamptz
);

alter table public.password_reset_attempts enable row level security;
revoke all on public.password_reset_attempts from anon, authenticated;

create or replace function public.security_question_options()
returns text[]
language sql
immutable
as $$
  select array[
    'What is the name of your first pet?',
    'What city were you born in?',
    'What is your mother''s maiden name?',
    'What was the name of your elementary school?',
    'What is your favorite food?',
    'What was your childhood nickname?',
    'What is the name of your best friend in high school?',
    'What was the first concert you attended?'
  ];
$$;

create or replace function public.normalize_security_answer(answer text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(btrim(coalesce(answer, ''))), '\s+', ' ', 'g');
$$;

grant execute on function public.security_question_options() to anon, authenticated;

create or replace function public.set_security_answers(questions text[], answers text[])
returns void
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  student_id uuid;
  question_index integer;
begin
  select id into student_id
  from public.profiles
  where auth_user_id = auth.uid() and role = 'student';
  if student_id is null then
    raise exception 'Only students can set security questions.';
  end if;

  if coalesce(array_length(questions, 1), 0) <> 3 or coalesce(array_length(answers, 1), 0) <> 3 then
    raise exception 'Choose three questions and answer each one.';
  end if;
  if (select count(distinct question) from unnest(questions) question) <> 3 then
    raise exception 'Choose three different questions.';
  end if;
  if not (questions <@ public.security_question_options()) then
    raise exception 'Choose questions from the list.';
  end if;
  for question_index in 1..3 loop
    if char_length(public.normalize_security_answer(answers[question_index])) < 2
      or char_length(answers[question_index]) > 100 then
      raise exception 'Each answer must be 2 to 100 characters.';
    end if;
  end loop;

  delete from public.student_security_answers where profile_id = student_id;
  insert into public.student_security_answers (profile_id, question, answer_hash)
  select student_id, questions[question_index], crypt(public.normalize_security_answer(answers[question_index]), gen_salt('bf', 10))
  from generate_series(1, 3) question_index;
end;
$$;

revoke all on function public.set_security_answers(text[], text[]) from public;
grant execute on function public.set_security_answers(text[], text[]) to authenticated;

create or replace function public.get_security_questions(requested_student_number text)
returns text[]
language plpgsql
security definer set search_path = public, extensions
as $$
declare
  student_id uuid;
  result text[];
begin
  select id into student_id
  from public.profiles
  where role = 'student' and lower(btrim(student_number)) = lower(btrim(requested_student_number));

  if student_id is not null then
    select array_agg(question order by question) into result
    from public.student_security_answers
    where profile_id = student_id;
  end if;

  if result is null or array_length(result, 1) <> 3 then
    select array_agg(option order by option) into result
    from (
      select option
      from unnest(public.security_question_options()) option
      order by md5(option || lower(btrim(coalesce(requested_student_number, ''))))
      limit 3
    ) decoys;
  end if;

  return result;
end;
$$;

revoke all on function public.get_security_questions(text) from public;
grant execute on function public.get_security_questions(text) to anon, authenticated;

create or replace function public.reset_student_password(
  requested_student_number text,
  questions text[],
  answers text[],
  new_password text
)
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
    insert into public.password_reset_attempts (profile_id, failed_count, locked_until)
    values (student.id, 1, null)
    on conflict (profile_id) do update set
      failed_count = case when password_reset_attempts.failed_count + 1 >= 5 then 0 else password_reset_attempts.failed_count + 1 end,
      locked_until = case when password_reset_attempts.failed_count + 1 >= 5 then now() + interval '15 minutes' else null end;
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

revoke all on function public.reset_student_password(text, text[], text[], text) from public;
grant execute on function public.reset_student_password(text, text[], text[], text) to anon, authenticated;
