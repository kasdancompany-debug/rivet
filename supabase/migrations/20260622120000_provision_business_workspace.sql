-- Atomic workspace provisioning for /setup (bypasses client-side RLS edge cases).
-- Ensures SECURITY DEFINER functions are owned by postgres so INSERTs succeed.

CREATE OR REPLACE FUNCTION public.provision_business_workspace (
  p_name text,
  p_industry text DEFAULT 'general',
  p_display_name text DEFAULT NULL
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
  v_display text;
  v_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF length(v_name) < 2 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;

  SELECT business_id INTO v_bid
  FROM public.profiles
  WHERE id = v_uid
    AND business_id IS NOT NULL;

  IF v_bid IS NOT NULL THEN
    RETURN v_bid;
  END IF;

  INSERT INTO public.businesses (name, industry, owner_id)
  VALUES (v_name, v_industry, v_uid)
  RETURNING id INTO v_bid;

  INSERT INTO public.business_members (business_id, user_id, role)
  VALUES (v_bid, v_uid, 'owner')
  ON CONFLICT (business_id, user_id) DO UPDATE
  SET role = EXCLUDED.role;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  v_email := COALESCE(NULLIF(trim(v_email), ''), v_uid::text || '@placeholder.local');
  v_display := COALESCE(NULLIF(trim(p_display_name), ''), split_part(v_email, '@', 1), 'Owner');

  INSERT INTO public.profiles (id, full_name, email, business_id, is_owner)
  VALUES (v_uid, v_display, v_email, v_bid, true)
  ON CONFLICT (id) DO UPDATE
  SET
    business_id = EXCLUDED.business_id,
    is_owner = true,
    full_name = COALESCE(NULLIF(trim(public.profiles.full_name), ''), EXCLUDED.full_name),
    email = COALESCE(NULLIF(trim(public.profiles.email), ''), EXCLUDED.email);

  IF NOT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.business_id = v_bid
      AND tm.profile_id = v_uid
  ) THEN
    INSERT INTO public.team_members (business_id, profile_id, display_name)
    VALUES (v_bid, v_uid, v_display);
  END IF;

  RETURN v_bid;
END;
$$;

ALTER FUNCTION public.provision_business_workspace (text, text, text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.provision_business_workspace (text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.provision_business_workspace (text, text, text) TO authenticated;

ALTER FUNCTION public.create_business_workspace (text, text) OWNER TO postgres;

COMMENT ON FUNCTION public.provision_business_workspace (text, text, text) IS
  'Creates business + membership + profile link for auth.uid(); used during /setup.';
