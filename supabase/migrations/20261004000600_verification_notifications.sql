create or replace function public.submit_my_verification(new_identifier text, document_path text, new_department text default null)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  cleaned text := btrim(coalesce(new_identifier, ''));
  cleaned_document text := nullif(btrim(coalesce(document_path, '')), '');
  cleaned_department text := nullif(btrim(coalesce(new_department, '')), '');
begin
  select * into caller from public.profiles where auth_user_id = auth.uid() for update;
  if caller.id is null or caller.role not in ('student', 'faculty') then
    return 'not_allowed';
  end if;

  if caller.verification_status not in ('unsubmitted', 'rejected') then
    return 'not_rejected';
  end if;

  if (caller.role = 'student' and cleaned !~ '^[0-9]{6}$')
    or (caller.role = 'faculty' and (cleaned = '' or char_length(cleaned) > 32)) then
    return 'invalid';
  end if;

  if caller.role = 'student' and (cleaned_department is null or char_length(cleaned_department) > 80) then
    return 'department_required';
  end if;

  if cleaned_document is null or cleaned_document !~ '^submissions/[0-9a-f-]{36}/id\.(jpg|jpeg|png|webp|pdf)$' then
    return 'document_required';
  end if;

  if (
    select count(*) from public.verification_reviews
    where profile_id = caller.id and decision in ('resubmitted', 'submitted') and created_at > now() - interval '24 hours'
  ) >= 5 then
    return 'too_many';
  end if;

  begin
    update public.profiles
    set
      student_number = case when role = 'student' then cleaned end,
      faculty_number = case when role = 'faculty' then cleaned end,
      department = coalesce(left(cleaned_department, 80), department),
      verification_document_path = cleaned_document,
      verification_status = 'pending',
      verification_note = null,
      rejected_identifier = null,
      verified_at = null,
      verified_by = null
    where id = caller.id;
  exception when unique_violation then
    return 'taken';
  end;

  insert into public.verification_reviews (profile_id, reviewer_auth_user_id, decision, identifier)
  values (caller.id, auth.uid(), case when caller.verification_status = 'unsubmitted' then 'submitted' else 'resubmitted' end, cleaned);

  insert into public.notifications (recipient_profile_id, kind, title, body)
  values (
    caller.id,
    'verification_submitted',
    'ID submitted',
    case when caller.role = 'student'
      then 'We received your Student ID. An admin will review it soon, and we''ll let you know here once you''re verified.'
      else 'We received your Faculty ID. An admin will review it soon, and we''ll email you once you can sign in.'
    end
  );

  return 'ok';
end;
$$;

revoke all on function public.submit_my_verification(text, text, text) from public, anon;
grant execute on function public.submit_my_verification(text, text, text) to authenticated;

insert into public.notifications (recipient_profile_id, kind, title, body)
select
  p.id,
  'verification_approved',
  'You''re verified',
  case when p.role = 'student'
    then 'Your Student ID has been verified. You can now book consultations.'
    else 'Your Faculty ID has been verified. Students can now book consultations with you.'
  end
from public.profiles p
where p.role in ('student', 'faculty')
  and p.verification_status = 'verified'
  and (
    select n.kind from public.notifications n
    where n.recipient_profile_id = p.id and n.kind like 'verification%'
    order by n.created_at desc
    limit 1
  ) is distinct from 'verification_approved'
  and exists (
    select 1 from public.notifications n
    where n.recipient_profile_id = p.id and n.kind like 'verification%'
  );

update public.badges set description = 'Get your Student ID verified' where id = 'security';

create or replace function public.award_badges(target_profile_id uuid, longest integer)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  profile public.profiles%rowtype;
  qualified text[] := '{}';
  completed integer;
  new_names text[];
begin
  select * into profile from public.profiles where id = target_profile_id;
  if profile.id is null then
    return '{}';
  end if;

  if longest >= 7 then qualified := qualified || 'streak-7'::text; end if;
  if longest >= 30 then qualified := qualified || 'streak-30'::text; end if;
  if longest >= 100 then qualified := qualified || 'streak-100'::text; end if;
  if profile.avatar_path is not null then qualified := qualified || 'photo'::text; end if;

  if profile.role = 'student' then
    if profile.verification_status = 'verified' then
      qualified := qualified || 'security'::text;
    end if;
    select count(*) into completed from public.appointment_requests
    where student_profile_id = profile.id and status = 'confirmed' and preferred_date < current_date;
    if completed >= 1 then qualified := qualified || 'first-consultation'::text; end if;
    if completed >= 5 then qualified := qualified || 'regular'::text; end if;
  elsif profile.role = 'faculty' then
    if exists (select 1 from public.faculty_availability where faculty_profile_id = profile.id and available_date is not null) then
      qualified := qualified || 'open-door'::text;
    end if;
    if (
      select count(*) from public.appointment_requests
      where faculty_profile_id = profile.id
        and status in ('confirmed', 'declined')
        and updated_at - created_at <= interval '24 hours'
    ) >= 5 then
      qualified := qualified || 'quick-responder'::text;
    end if;
    select count(*) into completed from public.appointment_requests
    where faculty_profile_id = profile.id and status = 'confirmed' and preferred_date < current_date;
    if completed >= 10 then qualified := qualified || 'mentor'::text; end if;
  end if;

  with inserted as (
    insert into public.user_badges (profile_id, badge_id)
    select profile.id, badge_id from unnest(qualified) as badge_id
    on conflict do nothing
    returning badge_id
  ),
  named as (
    select badges.name, badges.sort_order
    from inserted join public.badges on badges.id = inserted.badge_id
  ),
  notified as (
    insert into public.notifications (recipient_profile_id, kind, title, body)
    select profile.id, 'badge_earned', 'Badge earned: ' || named.name, 'You earned the "' || named.name || '" badge and 20 points. See it on your profile.'
    from named
  ),
  rewarded as (
    insert into public.points_ledger (profile_id, amount, reason)
    select profile.id, 20, 'Badge earned: ' || named.name
    from named
  )
  select array_agg(name order by sort_order) into new_names from named;

  return coalesce(new_names, '{}');
end;
$$;

revoke all on function public.award_badges(uuid, integer) from public, anon, authenticated;

drop function if exists public.reset_student_password(text, text[], text[], text);
drop function if exists public.get_security_questions(text);
drop function if exists public.set_security_answers(text[], text[]);
drop function if exists public.security_question_options();
drop function if exists public.normalize_security_answer(text);

drop table if exists public.student_security_answers;
drop table if exists public.password_reset_attempts;
drop table if exists public.password_reset_failures;
