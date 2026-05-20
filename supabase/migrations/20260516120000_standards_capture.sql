-- Standards Capture: structured JSON on SOPs + public media bucket for uploads

ALTER TABLE public.sops
  ADD COLUMN IF NOT EXISTS standards_capture jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.sops.standards_capture IS
  'Standards Capture payload (v1): onboarding prompts, media URLs, QC lines, examples, roles, competencies.';

-- ---------------------------------------------------------------------------
-- Storage: photos and short video clips linked from standards
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('sop-media', 'sop-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "sop_media_select_public" ON storage.objects;
CREATE POLICY "sop_media_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'sop-media');

DROP POLICY IF EXISTS "sop_media_insert_authenticated" ON storage.objects;
CREATE POLICY "sop_media_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'sop-media');

DROP POLICY IF EXISTS "sop_media_update_authenticated" ON storage.objects;
CREATE POLICY "sop_media_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'sop-media')
WITH CHECK (bucket_id = 'sop-media');

DROP POLICY IF EXISTS "sop_media_delete_authenticated" ON storage.objects;
CREATE POLICY "sop_media_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'sop-media');
