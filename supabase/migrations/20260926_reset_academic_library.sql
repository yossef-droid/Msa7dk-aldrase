-- DANGER: one-time clean reset of academic/library data.
-- Preserves auth.users and public.profiles (including your admin role).
-- Deletes all uploaded files, their storage objects, reviews, downloads,
-- notifications related to files, and all academic taxonomy.
begin;

delete from storage.objects where bucket_id = 'study-files';
delete from public.files;
delete from public.subjects;
delete from public.semesters;
delete from public.stages;
delete from public.academic_years;
delete from public.batches;

commit;
