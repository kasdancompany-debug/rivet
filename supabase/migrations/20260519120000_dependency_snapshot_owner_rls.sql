-- Allow business owners (businesses.owner_id) to write dependency assessments and
-- Rivet Index snapshots even when profiles.is_owner is not yet set (edge case) or
-- the profile row is missing. Keeps team members without extra privilege.

DROP POLICY IF EXISTS "dependency_assessments_insert" ON public.dependency_assessments;
CREATE POLICY "dependency_assessments_insert"
ON public.dependency_assessments
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

DROP POLICY IF EXISTS "dependency_assessments_update" ON public.dependency_assessments;
CREATE POLICY "dependency_assessments_update"
ON public.dependency_assessments
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
)
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

DROP POLICY IF EXISTS "dependency_assessments_delete" ON public.dependency_assessments;
CREATE POLICY "dependency_assessments_delete"
ON public.dependency_assessments
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

DROP POLICY IF EXISTS "handoff_score_snapshots_insert" ON public.handoff_score_snapshots;
CREATE POLICY "handoff_score_snapshots_insert"
ON public.handoff_score_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

DROP POLICY IF EXISTS "handoff_score_snapshots_update" ON public.handoff_score_snapshots;
CREATE POLICY "handoff_score_snapshots_update"
ON public.handoff_score_snapshots
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
)
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

DROP POLICY IF EXISTS "handoff_score_snapshots_delete" ON public.handoff_score_snapshots;
CREATE POLICY "handoff_score_snapshots_delete"
ON public.handoff_score_snapshots
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);
