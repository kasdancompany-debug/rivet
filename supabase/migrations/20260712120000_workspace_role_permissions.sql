-- Workspace roles: owner, manager, trainer, staff (+ legacy admin, member)

ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'staff';

UPDATE public.business_members SET role = 'manager'::public.business_member_role WHERE role = 'admin'::public.business_member_role;
UPDATE public.business_members SET role = 'staff'::public.business_member_role WHERE role = 'member'::public.business_member_role;

CREATE OR REPLACE FUNCTION public.auth_user_business_member_role (p_business_id uuid)
RETURNS public.business_member_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT bm.role
      FROM public.business_members bm
      WHERE bm.business_id = p_business_id
        AND bm.user_id = (SELECT auth.uid())
    ),
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.businesses b
        WHERE b.id = p_business_id
          AND b.owner_id = (SELECT auth.uid())
      ) THEN 'owner'::public.business_member_role
      WHEN (
        SELECT p.is_owner
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.business_id = p_business_id
      ) THEN 'owner'::public.business_member_role
      ELSE 'staff'::public.business_member_role
    END
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_business_member_role (uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_business_member_role (uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.auth_user_is_owner ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_business_member_role (public.current_user_business_id ()) = 'owner'::public.business_member_role;
$$;

CREATE OR REPLACE FUNCTION public.auth_user_can_manage_training ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_business_member_role (public.current_user_business_id ()) IN (
    'owner'::public.business_member_role,
    'manager'::public.business_member_role,
    'trainer'::public.business_member_role,
    'admin'::public.business_member_role
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_can_manage_training () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_can_manage_training () TO authenticated;

CREATE OR REPLACE FUNCTION public.auth_user_can_manage_operations ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.auth_user_business_member_role (public.current_user_business_id ()) IN (
    'owner'::public.business_member_role,
    'manager'::public.business_member_role,
    'admin'::public.business_member_role
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_can_manage_operations () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_can_manage_operations () TO authenticated;

COMMENT ON FUNCTION public.auth_user_business_member_role IS
  'Resolved workspace role for the current user in a business (owner > business_members > profile.is_owner > staff).';

-- Owners may update member roles; managers may assign trainer/staff only.
DROP POLICY IF EXISTS "business_members_update" ON public.business_members;

CREATE POLICY "business_members_update"
ON public.business_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND (
        b.owner_id = (SELECT auth.uid ())
        OR (
          public.auth_user_business_member_role (b.id) = 'manager'::public.business_member_role
          AND role IS DISTINCT FROM 'owner'::public.business_member_role
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND (
        b.owner_id = (SELECT auth.uid ())
        OR (
          public.auth_user_business_member_role (b.id) = 'manager'::public.business_member_role
          AND role IN (
            'trainer'::public.business_member_role,
            'staff'::public.business_member_role,
            'member'::public.business_member_role
          )
        )
      )
  )
);
