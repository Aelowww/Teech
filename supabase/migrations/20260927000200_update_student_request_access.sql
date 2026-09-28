drop policy if exists "Students can view own requests" on public.appointment_requests;

create policy "Students can view own requests"
on public.appointment_requests
for select to authenticated
using (
  student_profile_id = (
    select id
    from public.profiles
    where auth_user_id = auth.uid()
  )
);
