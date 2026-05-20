-- Private bucket for standard evidence media (signed URLs in app).
-- Path layout: {business_id}/{standard_id}/{uuid}.{ext}

INSERT INTO storage.buckets (id, name, public)
VALUES ('standard-media', 'standard-media', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users may read objects only under businesses they belong to (or own).
DROP POLICY IF EXISTS "standard_media_storage_select" ON storage.objects;
CREATE POLICY "standard_media_storage_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'standard-media'
  AND (
    (storage.foldername (name))[1]::uuid IN (
      SELECT bm.business_id
      FROM public.business_members bm
      WHERE bm.user_id = auth.uid ()
    )
    OR (storage.foldername (name))[1]::uuid IN (
      SELECT b.id
      FROM public.businesses b
      WHERE b.owner_id = auth.uid ()
    )
  )
);

DROP POLICY IF EXISTS "standard_media_storage_insert" ON storage.objects;
CREATE POLICY "standard_media_storage_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'standard-media'
  AND (
    (storage.foldername (name))[1]::uuid IN (
      SELECT bm.business_id
      FROM public.business_members bm
      WHERE bm.user_id = auth.uid ()
    )
    OR (storage.foldername (name))[1]::uuid IN (
      SELECT b.id
      FROM public.businesses b
      WHERE b.owner_id = auth.uid ()
    )
  )
);

DROP POLICY IF EXISTS "standard_media_storage_update" ON storage.objects;
CREATE POLICY "standard_media_storage_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'standard-media'
  AND (
    (storage.foldername (name))[1]::uuid IN (
      SELECT bm.business_id
      FROM public.business_members bm
      WHERE bm.user_id = auth.uid ()
    )
    OR (storage.foldername (name))[1]::uuid IN (
      SELECT b.id
      FROM public.businesses b
      WHERE b.owner_id = auth.uid ()
    )
  )
)
WITH CHECK (
  bucket_id = 'standard-media'
  AND (
    (storage.foldername (name))[1]::uuid IN (
      SELECT bm.business_id
      FROM public.business_members bm
      WHERE bm.user_id = auth.uid ()
    )
    OR (storage.foldername (name))[1]::uuid IN (
      SELECT b.id
      FROM public.businesses b
      WHERE b.owner_id = auth.uid ()
    )
  )
);

DROP POLICY IF EXISTS "standard_media_storage_delete" ON storage.objects;
CREATE POLICY "standard_media_storage_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'standard-media'
  AND (
    (storage.foldername (name))[1]::uuid IN (
      SELECT bm.business_id
      FROM public.business_members bm
      WHERE bm.user_id = auth.uid ()
    )
    OR (storage.foldername (name))[1]::uuid IN (
      SELECT b.id
      FROM public.businesses b
      WHERE b.owner_id = auth.uid ()
    )
  )
);
