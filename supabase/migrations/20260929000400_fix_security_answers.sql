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
  select student_id, questions[slot], crypt(public.normalize_security_answer(answers[slot]), gen_salt('bf', 10))
  from generate_series(1, 3) as slot;
end;
$$;

revoke all on function public.set_security_answers(text[], text[]) from public;
grant execute on function public.set_security_answers(text[], text[]) to authenticated;
