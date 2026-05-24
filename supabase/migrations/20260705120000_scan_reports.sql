-- Hosted scan reports + email delivery tracking (server-side via service role).

CREATE TABLE public.scan_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_lead_id uuid REFERENCES public.scan_leads(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  report_payload jsonb NOT NULL,
  email_status text NOT NULL DEFAULT 'pending'
    CHECK (email_status IN ('pending', 'sending', 'sent', 'failed')),
  email_provider text,
  email_provider_id text,
  delivery_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  retry_count integer NOT NULL DEFAULT 0,
  last_send_attempt_at timestamptz,
  sent_at timestamptz
);

CREATE INDEX scan_reports_public_id_idx ON public.scan_reports (public_id);
CREATE INDEX scan_reports_pending_email_idx ON public.scan_reports (email_status, created_at DESC)
  WHERE email_status IN ('pending', 'failed');

ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.scan_reports IS 'Public-hosted scan reports; read/write via service role from server actions only.';
