import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface InfluencerSource {
  id: string;
  user_id: string;
  influencer_id: string;
  influencer_name: string;
  connector_handles: Record<string, unknown>;
  selected_platforms: string[];
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
      setInfluencerSources((data || []).map(item => ({
        ...item,
        connector_handles: item.connector_handles || {}
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
    connectorHandles?: Record<string, unknown>
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const existingSource = influencerSources.find(source => source.influencer_id === influencerId);
      const hasProvidedHandles = connectorHandles && Object.keys(connectorHandles).length > 0;
      const resolvedConnectorHandles = hasProvidedHandles
        ? connectorHandles
        : existingSource?.connector_handles || {};

      const { data, error } = await supabase
        .from('influencer_sources')
        .upsert({
          user_id: user.id,
          influencer_id: influencerId,
          influencer_name: influencerName,
          selected_platforms: selectedPlatforms,
          connector_handles: resolvedConnectorHandles
        }, {
          onConflict: 'user_id,influencer_id'
        })
        .select()
        .single();

      if (error) throw error;

      const normalizedData: InfluencerSource = {
        ...(data as InfluencerSource),
        connector_handles: (data as InfluencerSource).connector_handles || {}
      };

      setInfluencerSources(prev => {
        const existing = prev.find(source => source.influencer_id === influencerId);
        if (existing) {
          return prev.map(source => source.influencer_id === influencerId ? normalizedData : source);
        } else {
          return [...prev, normalizedData];
        }
      });

      toast({
        title: "Success",
        description: `${influencerName} source preferences updated successfully.`
      });

      return normalizedData;
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