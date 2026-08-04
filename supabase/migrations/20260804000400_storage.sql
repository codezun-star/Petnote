-- Petnote — storage buckets
--
-- Two buckets with deliberately different exposure:
--
--   pet-photos     public read. The Emergency Mode page is unauthenticated, so
--                  the pet's photo has to be fetchable without a token. Writes
--                  are still restricted to the owner's folder.
--   pet-documents  private. Lab results and invoices are only ever served
--                  through short-lived signed URLs created for the owner.
--
-- Both buckets key objects by `<owner_id>/<pet_id>/<filename>`, so the first
-- path segment is what the policies check against auth.uid().

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos',
  'pet-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-documents',
  'pet-documents',
  false,
  10485760, -- 10 MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- pet-photos
-- ---------------------------------------------------------------------------

drop policy if exists "pet_photos_public_read" on storage.objects;
create policy "pet_photos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'pet-photos');

drop policy if exists "pet_photos_owner_insert" on storage.objects;
create policy "pet_photos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pet_photos_owner_update" on storage.objects;
create policy "pet_photos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pet_photos_owner_delete" on storage.objects;
create policy "pet_photos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- pet-documents
-- ---------------------------------------------------------------------------

drop policy if exists "pet_documents_owner_read" on storage.objects;
create policy "pet_documents_owner_read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pet-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pet_documents_owner_insert" on storage.objects;
create policy "pet_documents_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pet-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "pet_documents_owner_delete" on storage.objects;
create policy "pet_documents_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pet-documents'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
