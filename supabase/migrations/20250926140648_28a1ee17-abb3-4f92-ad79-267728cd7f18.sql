-- Create storage buckets for large content files
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('audio-files', 'audio-files', false),
  ('transcripts', 'transcripts', false),
  ('documents', 'documents', false);

-- Create policies for audio files
CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for transcripts
CREATE POLICY "Users can view their own transcripts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own transcripts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'transcripts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for documents  
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add storage references to existing tables
ALTER TABLE content_items ADD COLUMN transcript_url TEXT;
ALTER TABLE content_items ADD COLUMN audio_url TEXT;
ALTER TABLE podcast_episodes ADD COLUMN transcript_storage_path TEXT;
ALTER TABLE podcast_episodes ADD COLUMN audio_storage_path TEXT;

-- Add processing status tracking
ALTER TABLE content_items ADD COLUMN processing_status TEXT DEFAULT 'pending';
ALTER TABLE podcast_episodes ADD COLUMN processing_status TEXT DEFAULT 'pending';

-- Create indexes for better performance
CREATE INDEX idx_content_items_processing_status ON content_items(processing_status);
CREATE INDEX idx_content_items_user_created ON content_items(user_id, created_at DESC);
CREATE INDEX idx_podcast_episodes_user_created ON podcast_episodes(user_id, created_at DESC);