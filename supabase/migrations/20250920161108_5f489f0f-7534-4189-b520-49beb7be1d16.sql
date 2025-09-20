-- Create table to store user preferences for influencer content sources
CREATE TABLE public.influencer_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  influencer_id TEXT NOT NULL,
  influencer_name TEXT NOT NULL,
  selected_platforms TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, influencer_id)
);

-- Enable Row Level Security
ALTER TABLE public.influencer_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own influencer sources" 
ON public.influencer_sources 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own influencer sources" 
ON public.influencer_sources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own influencer sources" 
ON public.influencer_sources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own influencer sources" 
ON public.influencer_sources 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_influencer_sources_updated_at
BEFORE UPDATE ON public.influencer_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();