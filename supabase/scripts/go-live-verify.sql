-- Rivet go-live checks — paste into Supabase → SQL Editor → Run.
-- Every row should show status = 'ok'. Fix any MISSING line before inviting users.

SELECT 'businesses' AS check_name,
  CASE WHEN to_regclass('public.businesses') IS NOT NULL THEN 'ok'
       ELSE 'MISSING — run 20260511120000_founder_os_schema.sql' END AS status
UNION ALL
SELECT 'provision_business_workspace',
  CASE WHEN to_regproc('public.provision_business_workspace') IS NOT NULL THEN 'ok'
       ELSE 'MISSING — run 20260622120000_provision_business_workspace.sql' END
UNION ALL
SELECT 'create_business_workspace',
  CASE WHEN to_regproc('public.create_business_workspace') IS NOT NULL THEN 'ok'
       ELSE 'MISSING — run 20260621120000_businesses_create_workspace_rpc.sql' END
UNION ALL
SELECT 'user_can_access_business',
  CASE WHEN to_regproc('public.user_can_access_business') IS NOT NULL THEN 'ok'
       ELSE 'MISSING — run 20260601120000_rivet_v1_schema_rename.sql' END
UNION ALL
SELECT 'industry_template_columns',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'businesses'
      AND column_name = 'template_installed_at'
  ) THEN 'ok'
       ELSE 'MISSING — run 20260619120000_industry_template_foundation.sql' END
UNION ALL
SELECT 'rivet_ask_queries',
  CASE WHEN to_regclass('public.rivet_ask_queries') IS NOT NULL THEN 'ok'
       ELSE 'MISSING — run 20260707120000_rivet_ask_rivet.sql' END
UNION ALL
SELECT 'rivet_purchases',
  CASE WHEN to_regclass('public.rivet_purchases') IS NOT NULL THEN 'ok'
       ELSE 'optional — run 20260603120000_rivet_one_time_purchases.sql for billing' END
ORDER BY 1;
