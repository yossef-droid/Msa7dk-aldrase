create policy "approved files can create signed links"
on storage.objects for select
using (
  bucket_id = 'study-files'
  and exists (
    select 1 from public.files
    where files.storage_path = storage.objects.name
      and files.status = 'approved'
  )
);
