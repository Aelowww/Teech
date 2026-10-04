update public.profiles p
set
  verification_status = 'verified',
  student_number = case when p.role = 'student' then coalesce(p.student_number, p.rejected_identifier) else p.student_number end,
  faculty_number = case when p.role = 'faculty' then coalesce(p.faculty_number, p.rejected_identifier) else p.faculty_number end,
  verified_at = coalesce(p.verified_at, now()),
  verification_note = null,
  rejected_identifier = null
where p.role in ('student', 'faculty')
  and p.created_at < '2026-10-04 05:00:00+00'
  and p.verification_status <> 'verified'
  and coalesce(p.student_number, p.faculty_number, p.rejected_identifier) is not null
  and not exists (
    select 1 from public.profiles other
    where other.id <> p.id
      and coalesce(other.student_number, other.faculty_number) = coalesce(p.student_number, p.faculty_number, p.rejected_identifier)
  );
