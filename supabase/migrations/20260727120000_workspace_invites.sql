-- Workspace team invites: owner sends email link → employee joins business_members.

-- Invite roles (also defined in 20260712120000_workspace_role_permissions.sql)
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'trainer';
ALTER TYPE public.business_member_role ADD VALUE IF NOT EXISTS 'staff';

CREATE TYPE public.workspace_invite_status AS ENUM ('pending', 'accepted', 'revoked');

CREATE TABLE public.workspace_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.business_member_role NOT NULL,
  token text NOT NULL UNIQUE,
  status public.workspace_invite_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  accepted_by_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  revoked_at timestamptz,
  last_sent_at timestamptz,
  send_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workspace_invites_role_check CHECK (
    role IN (
      'manager'::public.business_member_role,
      'trainer'::public.business_member_role,
      'staff'::public.business_member_role
    )
  ),
  CONSTRAINT workspace_invites_email_nonempty CHECK (char_length(trim(email)) > 0)
);

CREATE UNIQUE INDEX workspace_invites_pending_email_unique
ON public.workspace_invites (business_id, lower(trim(email)))
WHERE status = 'pending';

CREATE INDEX idx_workspace_invites_token ON public.workspace_invites (token);
CREATE INDEX idx_workspace_invites_business_status ON public.workspace_invites (business_id, status, created_at DESC);

COMMENT ON TABLE public.workspace_invites IS
  'Email invites for workspace membership; accepted via /join/{token} server action.';

CREATE OR REPLACE FUNCTION public.resolve_workspace_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.workspace_invites%ROWTYPE;
  v_business public.businesses%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.workspace_invites WHERE token = p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;

  IF v_row.status = 'accepted' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'already_accepted');
  END IF;

  IF v_row.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;

  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'expired',
      'inviteId', v_row.id,
      'businessId', v_row.business_id
    );
  END IF;

  SELECT * INTO v_business FROM public.businesses WHERE id = v_row.business_id;

  RETURN jsonb_build_object(
    'valid', true,
    'inviteId', v_row.id,
    'businessId', v_row.business_id,
    'businessName', coalesce(v_business.name, 'Your workplace'),
    'email', v_row.email,
    'role', v_row.role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_workspace_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_workspace_invite(text) TO anon, authenticated;

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_invites_select"
ON public.workspace_invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = workspace_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "workspace_invites_insert"
ON public.workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = workspace_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
  AND invited_by = (SELECT auth.uid())
);

CREATE POLICY "workspace_invites_update"
ON public.workspace_invites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = workspace_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = workspace_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);
