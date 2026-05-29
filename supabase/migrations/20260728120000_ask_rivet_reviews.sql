-- Ask Rivet owner review workflow: approve or improve staff-facing answers.
-- Requires: 20260707120000_rivet_ask_rivet.sql (creates public.rivet_ask_queries)

DO $$
BEGIN
  IF to_regclass('public.rivet_ask_queries') IS NULL THEN
    RAISE EXCEPTION
      'Missing table public.rivet_ask_queries — run migration 20260707120000_rivet_ask_rivet.sql first.';
  END IF;
END $$;

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
