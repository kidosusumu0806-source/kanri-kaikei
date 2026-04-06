-- ============================================================
-- supabase/migrations/002_storage.sql
-- 領収書画像保存用 Storage バケット設定
-- ============================================================

-- receipts バケット作成（Supabase Dashboardでも可）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,  -- 10MB
  array['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
on conflict (id) do nothing;

-- RLS: 自組織のファイルのみ操作可
create policy "receipts storage: members can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (
      select om.org_id::text
      from public.org_members om
      where om.user_id = auth.uid()
      limit 1
    )
  );

create policy "receipts storage: members can read"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (
      select om.org_id::text
      from public.org_members om
      where om.user_id = auth.uid()
      limit 1
    )
  );

create policy "receipts storage: members can delete own"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (
      select om.org_id::text
      from public.org_members om
      where om.user_id = auth.uid()
      limit 1
    )
  );
