-- Add published_at column to content_items to store actual publication dates from RSS feeds
ALTER TABLE public.content_items
ADD COLUMN published_at timestamp with time zone;

-- Create index for better sorting performance
CREATE INDEX idx_content_items_published_at ON public.content_items(published_at DESC NULLS LAST);

-- For existing records, use created_at as fallback
UPDATE public.content_items 
SET published_at = created_at 
WHERE published_at IS NULL;