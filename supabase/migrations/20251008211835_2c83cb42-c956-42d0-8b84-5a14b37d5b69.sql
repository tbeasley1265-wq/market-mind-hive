-- Add platform_identifiers column to store URLs for each platform
ALTER TABLE influencer_sources 
ADD COLUMN platform_identifiers JSONB DEFAULT '{}'::jsonb;