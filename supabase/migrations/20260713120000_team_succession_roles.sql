-- Team succession map: role → primary / backup owners per business

CREATE TABLE public.team_succession_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  role_label text NOT NULL,
  capability_field text,
  primary_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  backup_profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_succession_roles_label_unique UNIQUE (business_id, role_label),
  CONSTRAINT team_succession_roles_capability_check CHECK (
    capability_field IS NULL
    OR capability_field IN ('open_alone', 'close_alone', 'train_others', 'handle_complaints')
  )
);

CREATE INDEX idx_team_succession_roles_business ON public.team_succession_roles (business_id, sort_order);

COMMENT ON TABLE public.team_succession_roles IS
  'Succession map: operational role with named primary and backup owners.';

ALTER TABLE public.team_succession_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_succession_roles_select"
ON public.team_succession_roles
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "team_succession_roles_insert"
ON public.team_succession_roles
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "team_succession_roles_update"
ON public.team_succession_roles
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "team_succession_roles_delete"
ON public.team_succession_roles
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE TRIGGER set_team_succession_roles_updated_at
BEFORE UPDATE ON public.team_succession_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();
