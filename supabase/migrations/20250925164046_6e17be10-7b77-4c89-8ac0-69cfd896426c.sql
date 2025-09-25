-- Add test podcast RSS feeds for the user
INSERT INTO influencer_sources (user_id, influencer_id, influencer_name, selected_platforms) VALUES 
('9faa1d25-a4cf-4591-b15a-6be7f5715441', 'https://feeds.simplecast.com/tOjNXec5', 'The Pomp Podcast', ARRAY['podcasts']),
('9faa1d25-a4cf-4591-b15a-6be7f5715441', 'https://realvision.libsyn.com/rss', 'Raoul Pals Podcast', ARRAY['podcasts']),
('9faa1d25-a4cf-4591-b15a-6be7f5715441', 'https://lexfridman.com/feed/podcast/', 'Lex Fridman', ARRAY['podcasts'])
ON CONFLICT (user_id, influencer_id) DO UPDATE SET 
selected_platforms = EXCLUDED.selected_platforms,
updated_at = now();