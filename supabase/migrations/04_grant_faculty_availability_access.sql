drop policy if exists "Signed-in users can view faculty availability" on public.faculty_availability;

create policy "Signed-in users can view faculty availability"
on public.faculty_availability
for select to authenticated
using (true);
