-- Retire legacy public sop-media bucket (replaced by private standard-media).
-- App code no longer writes here; remove permissive authenticated policies.

UPDATE storage.buckets
SET public = false
WHERE id = 'sop-media';

DROP POLICY IF EXISTS "sop_media_select_public" ON storage.objects;
DROP POLICY IF EXISTS "sop_media_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "sop_media_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "sop_media_delete_authenticated" ON storage.objects;
