-- Ask Rivet: operational Q&A log + high-friction procedure alerts

CREATE TABLE IF NOT EXISTS public.rivet_ask_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  asked_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  question_text text NOT NULL,
  normalized_question text NOT NULL,
  standard_id uuid REFERENCES public.standards (id) ON DELETE SET NULL,
  matched_source text,
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  prevented_owner_interrupt boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rivet_ask_queries_question_len CHECK (char_length(question_text) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_rivet_ask_queries_business_created
  ON public.rivet_ask_queries (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rivet_ask_queries_business_normalized
  ON public.rivet_ask_queries (business_id, normalized_question);

CREATE TABLE IF NOT EXISTS public.rivet_high_friction_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  normalized_question text NOT NULL,
  display_question text NOT NULL,
  ask_count integer NOT NULL DEFAULT 1,
  standard_id uuid REFERENCES public.standards (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open',
  first_asked_at timestamptz NOT NULL DEFAULT now(),
  last_asked_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rivet_high_friction_status CHECK (status IN ('open', 'acknowledged', 'resolved')),
  CONSTRAINT rivet_high_friction_unique UNIQUE (business_id, normalized_question)
);

CREATE INDEX IF NOT EXISTS idx_rivet_high_friction_business_status
  ON public.rivet_high_friction_procedures (business_id, status, last_asked_at DESC);

ALTER TABLE public.rivet_ask_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rivet_high_friction_procedures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rivet_ask_queries_select" ON public.rivet_ask_queries;
CREATE POLICY "rivet_ask_queries_select"
ON public.rivet_ask_queries FOR SELECT TO authenticated
USING (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "rivet_ask_queries_insert" ON public.rivet_ask_queries;
CREATE POLICY "rivet_ask_queries_insert"
ON public.rivet_ask_queries FOR INSERT TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "rivet_high_friction_select" ON public.rivet_high_friction_procedures;
CREATE POLICY "rivet_high_friction_select"
ON public.rivet_high_friction_procedures FOR SELECT TO authenticated
USING (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "rivet_high_friction_insert" ON public.rivet_high_friction_procedures;
CREATE POLICY "rivet_high_friction_insert"
ON public.rivet_high_friction_procedures FOR INSERT TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "rivet_high_friction_update" ON public.rivet_high_friction_procedures;
CREATE POLICY "rivet_high_friction_update"
ON public.rivet_high_friction_procedures FOR UPDATE TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));
