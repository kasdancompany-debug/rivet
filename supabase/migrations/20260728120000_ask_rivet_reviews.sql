-- Ask Rivet owner review workflow: approve or improve staff-facing answers.
-- Bootstraps rivet_ask_queries when 20260707120000 was not applied yet.

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

ALTER TABLE public.rivet_ask_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rivet_ask_queries_select" ON public.rivet_ask_queries;
CREATE POLICY "rivet_ask_queries_select"
ON public.rivet_ask_queries FOR SELECT TO authenticated
USING (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "rivet_ask_queries_insert" ON public.rivet_ask_queries;
CREATE POLICY "rivet_ask_queries_insert"
ON public.rivet_ask_queries FOR INSERT TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

DO $$
BEGIN
  CREATE TYPE public.ask_rivet_review_status AS ENUM (
    'auto_approved',
    'pending',
    'approved',
    'improved'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.rivet_ask_queries
  ADD COLUMN IF NOT EXISTS review_status public.ask_rivet_review_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_improved_answer text;

CREATE INDEX IF NOT EXISTS idx_rivet_ask_queries_business_review
  ON public.rivet_ask_queries (business_id, review_status, created_at DESC);

COMMENT ON COLUMN public.rivet_ask_queries.review_status IS
  'Owner review: auto_approved (high confidence), pending (needs review), approved, improved (FAQ saved).';

COMMENT ON COLUMN public.rivet_ask_queries.owner_improved_answer IS
  'Owner-edited answer text when review_status is improved; also saved to play FAQ.';

DROP POLICY IF EXISTS "rivet_ask_queries_update_owner" ON public.rivet_ask_queries;

CREATE POLICY "rivet_ask_queries_update_owner"
ON public.rivet_ask_queries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = rivet_ask_queries.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = rivet_ask_queries.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);
