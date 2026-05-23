-- Fix workspace setup: ensure authenticated users can create a business they own.
-- Also exposes create_business_workspace() (SECURITY DEFINER) so setup works even when
-- direct INSERT policies were never applied on a remote project.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;

DROP POLICY IF EXISTS "businesses_insert_owner" ON public.businesses;

CREATE POLICY "businesses_insert_owner"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.create_business_workspace (
  p_name text,
  p_industry text DEFAULT 'general'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_bid uuid;
  v_name text := trim(p_name);
  v_industry text := COALESCE(NULLIF(trim(p_industry), ''), 'general');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  INSERT INTO public.businesses (name, industry, owner_id)
  VALUES (v_name, v_industry, v_uid)
  RETURNING id INTO v_bid;

  RETURN v_bid;
END;
$$;

REVOKE ALL ON FUNCTION public.create_business_workspace (text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_business_workspace (text, text) TO authenticated;

COMMENT ON FUNCTION public.create_business_workspace (text, text) IS
  'Creates a business owned by auth.uid(); used during /setup workspace creation.';
