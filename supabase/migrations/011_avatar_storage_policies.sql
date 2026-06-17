-- Storage policies for the `avatars` bucket.
-- Each user may only read/write files inside their own folder (userId/avatar.*).
-- The bucket itself must be created manually in the Supabase dashboard as a
-- public bucket named "avatars" before these policies take effect.

-- Allow authenticated users to upload into their own folder
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text );

-- Allow authenticated users to overwrite their own avatar (upsert)
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using ( bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text )
with check ( bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text );

-- Allow authenticated users to delete their own avatar
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using ( bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text );

-- Allow anyone to read avatars (required for <Image> to load the public URL)
create policy "Public avatar read"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );
