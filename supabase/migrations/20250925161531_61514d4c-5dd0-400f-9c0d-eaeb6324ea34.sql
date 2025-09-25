-- Create podcast_episodes table
CREATE TABLE public.podcast_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  podcast_name TEXT NOT NULL,
  episode_title TEXT NOT NULL,
  episode_url TEXT NOT NULL,
  audio_url TEXT,
  published_date TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- duration in seconds
  description TEXT,
  transcript TEXT,
  summary TEXT,
  guests TEXT[],
  tags TEXT[],
  sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(episode_url, user_id) -- prevent duplicates
);

-- Enable Row Level Security
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own podcast episodes" 
ON public.podcast_episodes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own podcast episodes" 
ON public.podcast_episodes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own podcast episodes" 
ON public.podcast_episodes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_podcast_episodes_updated_at
BEFORE UPDATE ON public.podcast_episodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_podcast_episodes_user_published ON public.podcast_episodes(user_id, published_date DESC);
CREATE INDEX idx_podcast_episodes_podcast_name ON public.podcast_episodes(podcast_name);
CREATE INDEX idx_podcast_episodes_tags ON public.podcast_episodes USING GIN(tags);