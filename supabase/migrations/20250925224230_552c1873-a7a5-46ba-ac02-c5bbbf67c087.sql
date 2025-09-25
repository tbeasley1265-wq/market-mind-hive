-- Fix incorrect platform and author data for content item
UPDATE content_items 
SET 
  platform = 'podcast', 
  author = 'WebRush Podcast'
WHERE id = '16a17a16-1647-4cc6-a09b-b3fb5a68240c';