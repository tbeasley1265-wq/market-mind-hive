import React, { useState } from 'react';
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  MessageCircle, 
  Mic,
  FileText, 
  Mail,
  Search,
  Users,
  Edit,
  Trash2,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { useInfluencerSources } from "@/hooks/useInfluencerSources";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Sources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingInfluencer, setEditingInfluencer] = useState<string | null>(null);
  const [testingAggregator, setTestingAggregator] = useState(false);
  const { toast } = useToast();
  
  const {
    influencerSources,
    loading,
    availablePlatforms,
    addOrUpdateInfluencerSource,
    removeInfluencerSource,
    getInfluencerPlatforms,
    isInfluencerAdded
  } = useInfluencerSources();

  // Influencers list - financial experts and thought leaders
  const influencers = [
    // Crypto & Bitcoin
    { 
      id: "raoul-pal", 
      name: "Raoul Pal", 
      platform: "Real Vision", 
      followers: "1.2M", 
      category: "Macro",
      urls: {
        youtube: "UCJ9m8jMgFo-BOmNVYdb_LQQ",
        podcasts: "https://feeds.megaphone.fm/realvision",
        newsletters: "https://www.realvision.com/feed"
      }
    },
    { 
      id: "anthony-pompliano", 
      name: "Anthony Pompliano", 
      platform: "YouTube", 
      followers: "1.8M", 
      category: "Crypto",
      urls: {
        youtube: "UCqK_GSMbpiV8spgD3ZGloSw",
        podcasts: "https://feeds.simplecast.com/7y1CbAbN",
        newsletters: "https://pomp.substack.com/feed"
      }
    },
    { 
      id: "lex-fridman", 
      name: "Lex Fridman", 
      platform: "MIT/Podcast", 
      followers: "2.8M", 
      category: "AI",
      urls: {
        youtube: "UCSHZKyawb77ixDdsGog4iWA",
        podcasts: "https://lexfridman.com/feed/podcast/",
        newsletters: "https://lexfridman.com/feed/"
      }
    },
    { 
      id: "coin-bureau", 
      name: "Coin Bureau (Guy)", 
      platform: "YouTube", 
      followers: "2.1M", 
      category: "Crypto",
      urls: {
        youtube: "UCqK_GSMbpiV8spgD3ZGloSw",
        newsletters: "https://coinbureau.com/feed/"
      }
    },
    { 
      id: "benjamin-cowen", 
      name: "Benjamin Cowen", 
      platform: "YouTube", 
      followers: "1.8M", 
      category: "Crypto",
      urls: {
        youtube: "UCRvqjQPSeaWn-uEx-w0XOIg"
      }
    }
  ];

  const filteredInfluencers = influencers.filter(influencer => 
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return Play;
      case 'twitter': return MessageCircle;
      case 'podcasts': return Mic;
      case 'substack': return FileText;
      case 'newsletters': return Mail;
      default: return FileText;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'text-red-500';
      case 'twitter': return 'text-blue-500';
      case 'podcasts': return 'text-purple-500';
      case 'substack': return 'text-orange-500';
      case 'newsletters': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const handlePlatformToggle = async (
    influencerId: string,
    influencerName: string,
    platform: string,
    platformIdentifiers: Record<string, string | undefined>
  ) => {
    const currentPlatforms = getInfluencerPlatforms(influencerName);
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];

    try {
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        newPlatforms,
        platformIdentifiers
      );
    } catch (error) {
      console.error('Error updating platforms:', error);
    }
  };

  const handleRemoveInfluencer = async (influencerName: string) => {
    try {
      await removeInfluencerSource(influencerName);
      setEditingInfluencer(null);
    } catch (error) {
      console.error('Error removing influencer:', error);
    }
  };

  const handleSelectAllPlatforms = async (
    influencerId: string,
    influencerName: string,
    platformIdentifiers: Record<string, string | undefined>
  ) => {
    try {
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        [...availablePlatforms],
        platformIdentifiers
      );
    } catch (error) {
      console.error('Error selecting all platforms:', error);
    }
  };

  const handleSelectAllInfluencers = async () => {
    try {
      for (const influencer of influencers) {
        if (!isInfluencerAdded(influencer.id)) {
          await addOrUpdateInfluencerSource(
            influencer.id,
            influencer.name,
            [...availablePlatforms],
            influencer.urls || {}
          );
        }
      }
    } catch (error) {
      console.error('Error selecting all influencers:', error);
    }
  };

  const fixExistingSourceURLs = async () => {
    try {
      // Update each existing source with the correct URLs
      for (const source of influencerSources) {
        const influencer = influencers.find(inf => inf.id === source.influencer_id);
        if (influencer && influencer.urls) {
          await addOrUpdateInfluencerSource(
            source.influencer_id,
            source.influencer_name,
            source.selected_platforms,
            influencer.urls
          );
        }
      }
      
      toast({
        title: "Success",
        description: "All source URLs have been updated successfully!"
      });
    } catch (error) {
      console.error('Error fixing sources:', error);
      toast({
        title: "Error",
        description: "Failed to update source URLs. Check the console for details.",
        variant: "destructive"
      });
    }
  };

  const testPodcastIngestion = async () => {
    setTestingAggregator(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const { data, error } = await supabase.functions.invoke('content-aggregator', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Content aggregation completed! ${data?.processedCount || 0} new items processed.`
      });
      
      console.log('Aggregation results:', data);
    } catch (error) {
      console.error('Error testing aggregator:', error);
      toast({
        title: "Error",
        description: "Failed to run content aggregation. Check the console for details.",
        variant: "destructive"
      });
    } finally {
      setTestingAggregator(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Sources</h1>
          <p className="text-muted-foreground">
            Select financial influencers and experts, then choose which platforms to monitor for their content.
          </p>
        </div>

        {/* Added Influencers Section */}
        {influencerSources.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Active Sources ({influencerSources.length})
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Manage your selected influencers and their content platforms
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {influencerSources.map((source) => {
                const influencer = influencers.find(inf => inf.id === source.influencer_id);
                const mergedIdentifiers = {
                  ...(source.platform_identifiers || {}),
                  ...(influencer?.urls || {})
                };
                const isEditing = editingInfluencer === source.influencer_id;
                
                return (
                  <div key={source.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{source.influencer_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {influencer?.platform} • {influencer?.followers} followers
                          </div>
                        </div>
                        <Badge variant="outline">{influencer?.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingInfluencer(isEditing ? null : source.influencer_id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleRemoveInfluencer(source.influencer_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Platform Selection */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Content Platforms:</div>
                      <div className="flex flex-wrap gap-2">
                        {availablePlatforms.map((platform) => {
                          const Icon = getPlatformIcon(platform);
                          const isSelected = source.selected_platforms.includes(platform);
                          
                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${source.influencer_id}-${platform}`}
                                checked={isSelected}
                                disabled={!isEditing}
                                onCheckedChange={() => {
                                  if (isEditing) {
                                    handlePlatformToggle(
                                      source.influencer_id,
                                      source.influencer_name,
                                      platform,
                                      mergedIdentifiers
                                    );
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`${source.influencer_id}-${platform}`}
                                className={`flex items-center gap-1 cursor-pointer capitalize ${
                                  !isEditing ? 'opacity-50' : ''
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${getPlatformColor(platform)}`} />
                                {platform}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Add New Influencers Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add People & Platforms
            </CardTitle>
            <div className="text-sm text-muted-foreground mb-4">
              Browse and add influential voices in finance, crypto, and technology
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleSelectAllInfluencers}
                variant="outline"
              >
                Select All People
              </Button>
              <Button
                onClick={fixExistingSourceURLs}
                variant="outline"
                className="flex items-center gap-2"
              >
                Fix Source URLs
              </Button>
              <Button
                onClick={testPodcastIngestion}
                disabled={testingAggregator}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testingAggregator ? 'animate-spin' : ''}`} />
                {testingAggregator ? 'Testing...' : 'Test Podcast Ingestion'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, category, or platform..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Available Influencers */}
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {filteredInfluencers.map((influencer) => {
                const isAdded = isInfluencerAdded(influencer.name);
                const selectedPlatforms = getInfluencerPlatforms(influencer.name);
                
                return (
                  <div key={influencer.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{influencer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {influencer.platform} • {influencer.followers} followers
                          </div>
                        </div>
                        <Badge variant="outline">{influencer.category}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleSelectAllPlatforms(
                              influencer.id,
                              influencer.name,
                              influencer.urls || {}
                            )
                          }
                        >
                          Select All
                        </Button>
                        {isAdded && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Added
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Platform Selection */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">Select Content Platforms:</div>
                      <div className="flex flex-wrap gap-2">
                        {availablePlatforms.map((platform) => {
                          const Icon = getPlatformIcon(platform);
                          const isSelected = selectedPlatforms.includes(platform);
                          
                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${influencer.id}-${platform}`}
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handlePlatformToggle(
                                    influencer.id,
                                    influencer.name,
                                    platform,
                                    influencer.urls || {}
                                  )
                                }
                              />
                              <Label 
                                htmlFor={`${influencer.id}-${platform}`}
                                className="flex items-center gap-1 cursor-pointer capitalize"
                              >
                                <Icon className={`h-4 w-4 ${getPlatformColor(platform)}`} />
                                {platform}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredInfluencers.length === 0 && searchTerm && (
              <div className="text-center py-8 text-muted-foreground">
                No influencers found matching "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Sources;