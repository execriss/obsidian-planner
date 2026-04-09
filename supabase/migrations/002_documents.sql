-- ═══════════════════════════════════════════════════════════════════════════════
-- DOCUMENTS TABLE + STORAGE BUCKET
-- Run this in the Supabase SQL editor to enable the Documents section.
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── TABLE ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  number     TEXT,
  cat        TEXT        NOT NULL DEFAULT 'otro',
  notes      TEXT,
  expires    TEXT,
  file_path  TEXT,
  file_name  TEXT,
  file_size  BIGINT,
  file_type  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_user_access" ON documents;
CREATE POLICY "documents_user_access" ON documents
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── STORAGE BUCKET ──────────────────────────────────────────────────────────
-- Files are stored at: {userId}/{docId}/{filename}
-- Each user can only access files inside their own folder.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "docs_storage_insert" ON storage.objects;
CREATE POLICY "docs_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "docs_storage_select" ON storage.objects;
CREATE POLICY "docs_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "docs_storage_update" ON storage.objects;
CREATE POLICY "docs_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "docs_storage_delete" ON storage.objects;
CREATE POLICY "docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
