import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InfluencerSource {
  id: string;
  user_id: string;
  influencer_id: string;
  influencer_name: string;
  selected_platforms: string[];
  platform_identifiers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_PLATFORMS = ['youtube', 'twitter', 'podcasts', 'substack', 'newsletters'];

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
      setInfluencerSources((data || []).map(source => ({
        ...source,
        platform_identifiers: (source as any).platform_identifiers || {}
      })));
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
    selectedPlatforms: string[],
    platformIdentifiers: Record<string, string | undefined> = {}
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // FIXED: Properly handle platform identifiers
      // Keep existing identifiers if updating, merge with new ones
      const existing = influencerSources.find(source => source.influencer_name === influencerName);
      
      // Start with existing identifiers if updating, empty object if new
      let finalIdentifiers: Record<string, string> = existing?.platform_identifiers || {};
      
      // Merge in new identifiers, only adding non-empty values
      Object.entries(platformIdentifiers).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim().length > 0) {
          finalIdentifiers[key] = value.trim();
        }
      });
      
      // Remove identifiers for platforms that are no longer selected
      Object.keys(finalIdentifiers).forEach(platform => {
        if (!selectedPlatforms.includes(platform)) {
          delete finalIdentifiers[platform];
        }
      });

      console.log('Saving to database:', {
        influencerName,
        selectedPlatforms,
        platformIdentifiers: finalIdentifiers
      });

      let data;
      let error;

      if (existing) {
        // Update existing source by ID
        const result = await supabase
          .from('influencer_sources')
          .update({
            influencer_id: influencerId,
            selected_platforms: selectedPlatforms,
            platform_identifiers: finalIdentifiers  // Use the merged identifiers
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Insert new source
        const result = await supabase
          .from('influencer_sources')
          .insert({
            user_id: user.id,
            influencer_id: influencerId,
            influencer_name: influencerName,
            selected_platforms: selectedPlatforms,
            platform_identifiers: finalIdentifiers  // Use the merged identifiers
          })
          .select()
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Update local state
      setInfluencerSources(prev => {
        const normalizedData = {
          ...data,
          platform_identifiers: (data as any).platform_identifiers || {}
        } as InfluencerSource;

        if (existing) {
          return prev.map(source => source.id === existing.id ? normalizedData : source);
        } else {
          return [...prev, normalizedData];
        }
      });

      // Log success
      console.log('Successfully saved source:', {
        influencerName,
        identifiers: finalIdentifiers,
        platformCount: Object.keys(finalIdentifiers).length
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

  const removeInfluencerSource = async (influencerName: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('influencer_sources')
        .delete()
        .eq('user_id', user.id)
        .eq('influencer_name', influencerName);

      if (error) throw error;
      
      setInfluencerSources(prev => prev.filter(source => source.influencer_name !== influencerName));
      
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

  const getInfluencerPlatforms = (influencerName: string): string[] => {
    const source = influencerSources.find(source => source.influencer_name === influencerName);
    return source?.selected_platforms || [];
  };

  const isInfluencerAdded = (identifier: string): boolean => {
    return influencerSources.some(source =>
      source.influencer_name === identifier || source.influencer_id === identifier
    );
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
