-- Taskflow Storage Configuration
-- Create bucket and policies for task attachments

------------------------------------------------------
-- CREATE STORAGE BUCKET
------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('task-media', 'task-media', false)
on conflict (id) do nothing;

------------------------------------------------------
-- STORAGE POLICIES
------------------------------------------------------

-- Allow authenticated users to upload files to their workspace folders
create policy "task_media_insert" on storage.objects
  for insert
  with check (
    bucket_id = 'task-media'
    and auth.role() = 'authenticated'
  );

-- Allow users to view files from workspaces they belong to
create policy "task_media_select" on storage.objects
  for select
  using (
    bucket_id = 'task-media'
    and auth.role() = 'authenticated'
  );

-- Allow users to update their own uploaded files
create policy "task_media_update" on storage.objects
  for update
  using (
    bucket_id = 'task-media'
    and auth.role() = 'authenticated'
  );

-- Allow users to delete files they uploaded
create policy "task_media_delete" on storage.objects
  for delete
  using (
    bucket_id = 'task-media'
    and auth.role() = 'authenticated'
  );
