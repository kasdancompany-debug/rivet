-- Owner hourly value for recovered-time → dollar metrics.

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS owner_hourly_value_cad numeric(10, 2),
ADD CONSTRAINT businesses_owner_hourly_value_non_negative CHECK (
  owner_hourly_value_cad IS NULL OR owner_hourly_value_cad >= 0
);
