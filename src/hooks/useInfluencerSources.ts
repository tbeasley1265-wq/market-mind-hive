import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type PodcastMetadata = {
  feed_url: string;
};

type PlatformMetadata = {
  podcasts?: PodcastMetadata;
};

export interface InfluencerSource {
  id: string;
  user_id: string;
  influencer_id: string;
  influencer_name: string;
  selected_platforms: string[];
  platform_metadata: PlatformMetadata | null;
  created_at: string;
  updated_at: string;
}

type RawInfluencerSource = Omit<InfluencerSource, 'selected_platforms' | 'platform_metadata'> & {
  selected_platforms: string[] | null;
  platform_metadata?: PlatformMetadata | null;
};

const AVAILABLE_PLATFORMS = ['youtube', 'twitter', 'podcasts', 'substack', 'newsletters'];

const PODCAST_FEEDS: Record<string, string> = {
  'anthony-pompliano': 'https://feeds.simplecast.com/tOjNXec5',
  'raoul-pal': 'https://realvision.libsyn.com/rss',
  'lex-fridman': 'https://lexfridman.com/feed/podcast/'
};

const normalizeSource = (source: RawInfluencerSource): InfluencerSource => ({
  ...source,
  selected_platforms: Array.isArray(source.selected_platforms) ? source.selected_platforms : [],
  platform_metadata: source.platform_metadata || null,
});

export function useInfluencerSources() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [influencerSources, setInfluencerSources] = useState<InfluencerSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInfluencerSources = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('influencer_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setInfluencerSources((data || []).map(item => normalizeSource(item as RawInfluencerSource)));
    } catch (error) {
      console.error('Error fetching influencer sources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch influencer sources. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateInfluencerSource = async (
    influencerId: string, 
    influencerName: string, 
    selectedPlatforms: string[]
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingSource = influencerSources.find(source => source.influencer_id === influencerId);
      const updatedMetadata: PlatformMetadata = { ...(existingSource?.platform_metadata || {}) };

      if (selectedPlatforms.includes('podcasts')) {
        const feedUrl = PODCAST_FEEDS[influencerId];
        if (feedUrl) {
          updatedMetadata.podcasts = { feed_url: feedUrl };
        } else {
          delete updatedMetadata.podcasts;
          toast({
            title: "Missing podcast feed",
            description: `No podcast RSS feed configured for ${influencerName}. Podcasts will be skipped until one is added.`,
          });
        }
      } else {
        delete updatedMetadata.podcasts;
      }

      const platformMetadata = Object.keys(updatedMetadata).length > 0 ? updatedMetadata : null;

      const { data, error } = await supabase
        .from('influencer_sources')
        .upsert({
          user_id: user.id,
          influencer_id: influencerId,
          influencer_name: influencerName,
          selected_platforms: selectedPlatforms,
          platform_metadata: platformMetadata
        }, {
          onConflict: 'user_id,influencer_id'
        })
        .select()
        .single();

      if (error) throw error;

      const normalizedSource = normalizeSource(data as RawInfluencerSource);

      setInfluencerSources(prev => {
        const existing = prev.find(source => source.influencer_id === influencerId);
        if (existing) {
          return prev.map(source => source.influencer_id === influencerId ? normalizedSource : source);
        } else {
          return [...prev, normalizedSource];
        }
      });

      toast({
        title: "Success",
        description: `${influencerName} source preferences updated successfully.`
      });
      
      return data;
    } catch (error) {
      console.error('Error updating influencer source:', error);
      toast({
        title: "Error",
        description: "Failed to update source preferences. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const removeInfluencerSource = async (influencerId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('influencer_sources')
        .delete()
        .eq('user_id', user.id)
        .eq('influencer_id', influencerId);

      if (error) throw error;
      
      setInfluencerSources(prev => prev.filter(source => source.influencer_id !== influencerId));
      
      toast({
        title: "Success",
        description: "Influencer source removed successfully."
      });
    } catch (error) {
      console.error('Error removing influencer source:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer source. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getInfluencerPlatforms = (influencerId: string): string[] => {
    const source = influencerSources.find(source => source.influencer_id === influencerId);
    return source?.selected_platforms || [];
  };

  const isInfluencerAdded = (influencerId: string): boolean => {
    return influencerSources.some(source => source.influencer_id === influencerId);
  };

  useEffect(() => {
    fetchInfluencerSources();
  }, [user]);

  return {
    influencerSources,
    loading,
    availablePlatforms: AVAILABLE_PLATFORMS,
    addOrUpdateInfluencerSource,
    removeInfluencerSource,
    getInfluencerPlatforms,
    isInfluencerAdded,
    refetch: fetchInfluencerSources
  };
}