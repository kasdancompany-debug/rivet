-- Step-level completion proof requirements + unified progress storage

ALTER TABLE public.standard_steps
ADD COLUMN IF NOT EXISTS requires_video_proof boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_manager_signoff boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_checklist_completion boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.standard_steps.requires_video_proof IS
  'Staff must upload video proof to complete this step in training / execution.';
COMMENT ON COLUMN public.standard_steps.requires_manager_signoff IS
  'A manager must sign off this step after crew completes other proof.';
COMMENT ON COLUMN public.standard_steps.requires_checklist_completion IS
  'Step must be checked off on the play checklist before the item can complete.';

ALTER TABLE public.training_sop_progress
ADD COLUMN IF NOT EXISTS step_proofs jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.training_sop_progress.step_proofs IS
  'Unified step proofs: photo, video, checklist completion, manager sign-off per stepId.';
