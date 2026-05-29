-- Track play opens for high-friction detection (views vs low training scores)

CREATE TABLE public.standard_play_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  standard_id uuid NOT NULL REFERENCES public.standards (id) ON DELETE CASCADE,
  viewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'portal',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT standard_play_views_source CHECK (source IN ('portal', 'owner', 'training'))
);

CREATE INDEX idx_standard_play_views_business_standard_created
  ON public.standard_play_views (business_id, standard_id, created_at DESC);

ALTER TABLE public.standard_play_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standard_play_views_select"
ON public.standard_play_views FOR SELECT TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "standard_play_views_insert"
ON public.standard_play_views FOR INSERT TO authenticated
WITH CHECK (public.user_can_access_business (business_id));
