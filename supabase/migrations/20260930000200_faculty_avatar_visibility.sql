drop policy if exists "Signed-in users can view faculty avatars" on storage.objects;
create policy "Signed-in users can view faculty avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1 from public.profiles
    where profiles.role = 'faculty'
      and profiles.auth_user_id::text = (storage.foldername(objects.name))[1]
  )
);
