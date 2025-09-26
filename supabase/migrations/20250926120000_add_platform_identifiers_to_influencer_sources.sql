ALTER TABLE public.influencer_sources
ADD COLUMN IF NOT EXISTS platform_identifiers JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill existing podcast sources to preserve RSS feed references
UPDATE public.influencer_sources
SET platform_identifiers = jsonb_build_object('podcasts', influencer_id)
WHERE platform_identifiers = '{}'::jsonb
  AND ARRAY['podcasts'] && selected_platforms;
