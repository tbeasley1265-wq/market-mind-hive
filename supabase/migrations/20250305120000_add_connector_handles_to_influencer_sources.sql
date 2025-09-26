ALTER TABLE public.influencer_sources
  ADD COLUMN IF NOT EXISTS connector_handles jsonb NOT NULL DEFAULT '{}'::jsonb;
