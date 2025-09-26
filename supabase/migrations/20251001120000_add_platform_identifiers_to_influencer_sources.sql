-- Add platform identifiers storage to influencer_sources
ALTER TABLE public.influencer_sources
ADD COLUMN IF NOT EXISTS platform_identifiers JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill platform identifiers from previously stored influencer_id JSON blobs
UPDATE public.influencer_sources
SET platform_identifiers = CASE
  WHEN jsonb_typeof(influencer_id::jsonb) = 'object' THEN influencer_id::jsonb
  ELSE '{}'::jsonb
END;
