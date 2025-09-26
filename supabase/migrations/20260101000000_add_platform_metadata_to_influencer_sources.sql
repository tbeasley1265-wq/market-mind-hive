-- Add platform metadata to influencer_sources for storing platform-specific identifiers
ALTER TABLE public.influencer_sources
ADD COLUMN IF NOT EXISTS platform_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_influencer_sources_platform_metadata
  ON public.influencer_sources
  USING GIN (platform_metadata);

-- Backfill podcast feed URLs from influencer_id when it already stores an RSS link
UPDATE public.influencer_sources
SET platform_metadata = COALESCE(platform_metadata, '{}'::jsonb) || jsonb_build_object(
  'podcasts',
  jsonb_build_object('feed_url', influencer_id)
)
WHERE (selected_platforms @> ARRAY['podcasts']::text[])
  AND (platform_metadata IS NULL OR NOT (platform_metadata ? 'podcasts'))
  AND influencer_id LIKE 'http%';
