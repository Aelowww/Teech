create or replace function public.faculty_can_view_student_avatar(owner_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.appointment_requests requests
    join public.profiles students on students.id = requests.student_profile_id
    join public.profiles faculty on faculty.id = requests.faculty_profile_id
    where faculty.auth_user_id = auth.uid()
      and students.auth_user_id::text = owner_id
  );
$$;

create or replace function public.request_student_avatars(request_ids uuid[])
returns table (request_id uuid, avatar_path text)
language sql
stable
security definer
set search_path = public
as $$
  select requests.id, students.avatar_path
  from public.appointment_requests requests
  join public.profiles students on students.id = requests.student_profile_id
  join public.profiles faculty on faculty.id = requests.faculty_profile_id
  where requests.id = any(request_ids)
    and faculty.auth_user_id = auth.uid()
    and students.avatar_path is not null;
$$;

revoke all on function public.faculty_can_view_student_avatar(text) from public, anon;
revoke all on function public.request_student_avatars(uuid[]) from public, anon;
grant execute on function public.faculty_can_view_student_avatar(text) to authenticated;
grant execute on function public.request_student_avatars(uuid[]) to authenticated;

drop policy if exists "Faculty can view avatars of their students" on storage.objects;
create policy "Faculty can view avatars of their students"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and public.faculty_can_view_student_avatar((storage.foldername(objects.name))[1])
);
