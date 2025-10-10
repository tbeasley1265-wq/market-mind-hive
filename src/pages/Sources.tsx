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
  RefreshCw,
  Loader2
} from "lucide-react";
import { useInfluencerSources } from "@/hooks/useInfluencerSources";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Sources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingInfluencer, setEditingInfluencer] = useState<string | null>(null);
  const [testingAggregator, setTestingAggregator] = useState(false);
  const [findingUrls, setFindingUrls] = useState<string | null>(null); // Track which influencer is being processed
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
      category: "Macro"
    },
    { 
      id: "anthony-pompliano", 
      name: "Anthony Pompliano", 
      platform: "YouTube", 
      followers: "1.8M", 
      category: "Crypto"
    },
    { 
      id: "lex-fridman", 
      name: "Lex Fridman", 
      platform: "MIT/Podcast", 
      followers: "2.8M", 
      category: "AI"
    },
    { 
      id: "coin-bureau", 
      name: "Coin Bureau (Guy)", 
      platform: "YouTube", 
      followers: "2.1M", 
      category: "Crypto"
    },
    { 
      id: "benjamin-cowen", 
      name: "Benjamin Cowen", 
      platform: "YouTube", 
      followers: "1.8M", 
      category: "Crypto"
    },
    { 
      id: "michael-saylor", 
      name: "Michael Saylor", 
      platform: "MicroStrategy", 
      followers: "3.5M", 
      category: "Bitcoin"
    },
    { 
      id: "balaji-srinivasan", 
      name: "Balaji Srinivasan", 
      platform: "Twitter", 
      followers: "900K", 
      category: "Crypto"
    },
    { 
      id: "cathie-wood", 
      name: "Cathie Wood", 
      platform: "ARK Invest", 
      followers: "1.3M", 
      category: "Innovation"
    },
    { 
      id: "the-pomp-podcast", 
      name: "The Pomp Podcast", 
      platform: "Podcast", 
      followers: "500K", 
      category: "Crypto"
    },
    { 
      id: "lyn-alden", 
      name: "Lyn Alden", 
      platform: "Newsletter", 
      followers: "800K", 
      category: "Macro"
    },
    { 
      id: "ray-dalio", 
      name: "Ray Dalio", 
      platform: "Bridgewater", 
      followers: "2.1M", 
      category: "Macro"
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

  // NEW: AI-powered URL finder
  const findPlatformUrls = async (influencerName: string, selectedPlatforms: string[]) => {
    try {
      console.log(`🔍 Finding URLs for ${influencerName}, platforms: ${selectedPlatforms.join(', ')}`);
      
      const { data, error } = await supabase.functions.invoke('ai-url-finder', {
        body: {
          influencerName,
          selectedPlatforms
        }
      });

      if (error) {
        console.error('AI URL finder error:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to find URLs');
      }

      console.log('✅ Found URLs:', data.platformIdentifiers);
      console.log(`📊 Found ${data.foundCount} of ${data.requestedCount} platforms`);
      
      return {
        platformIdentifiers: data.platformIdentifiers,
        foundCount: data.foundCount,
        requestedCount: data.requestedCount,
        confidence: data.confidence
      };
    } catch (error) {
      console.error('Error finding platform URLs:', error);
      throw error;
    }
  };

  // UPDATED: handlePlatformToggle with AI integration
  const handlePlatformToggle = async (
    influencerId: string,
    influencerName: string,
    platform: string,
    platformIdentifiers: Record<string, string | undefined>
  ) => {
    const currentPlatforms = getInfluencerPlatforms(influencerName);
    const isAdding = !currentPlatforms.includes(platform);
    const newPlatforms = isAdding
      ? [...currentPlatforms, platform]
      : currentPlatforms.filter(p => p !== platform);

    // If removing platform, just update without AI
    if (!isAdding) {
      try {
        await addOrUpdateInfluencerSource(
          influencerId,
          influencerName,
          newPlatforms,
          platformIdentifiers
        );
        
        toast({
          title: "Platform Removed",
          description: `Removed ${platform} from ${influencerName}`
        });
      } catch (error) {
        console.error('Error removing platform:', error);
        toast({
          title: "Error",
          description: "Failed to remove platform",
          variant: "destructive"
        });
      }
      return;
    }

    // If adding platform, use AI to find URL
    setFindingUrls(influencerId);
    
    try {
      // Call AI to find URLs for the new platform
      const result = await findPlatformUrls(influencerName, [platform]);
      
      // Merge with existing identifiers
      const mergedIdentifiers = {
        ...platformIdentifiers,
        ...result.platformIdentifiers
      };

      // Save to database
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        newPlatforms,
        mergedIdentifiers
      );

      // Show success message
      if (result.foundCount > 0) {
        toast({
          title: "Platform Added!",
          description: `✅ Found and added ${platform} for ${influencerName}`
        });
      } else {
        toast({
          title: "Platform Added (Manual Setup Needed)",
          description: `⚠️ Added ${platform} but couldn't find URL automatically. Use "Fix Source URLs" to add it manually.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error adding platform:', error);
      toast({
        title: "Error",
        description: `Failed to add ${platform}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setFindingUrls(null);
    }
  };

  const handleRemoveInfluencer = async (influencerName: string) => {
    try {
      await removeInfluencerSource(influencerName);
      setEditingInfluencer(null);
      
      toast({
        title: "Removed",
        description: `Removed ${influencerName} from your sources`
      });
    } catch (error) {
      console.error('Error removing influencer:', error);
      toast({
        title: "Error",
        description: "Failed to remove influencer",
        variant: "destructive"
      });
    }
  };

  // UPDATED: handleSelectAllPlatforms with AI integration
  const handleSelectAllPlatforms = async (
    influencerId: string,
    influencerName: string,
    platformIdentifiers: Record<string, string | undefined>
  ) => {
    setFindingUrls(influencerId);
    
    try {
      // Call AI to find all platform URLs
      toast({
        title: "Finding URLs...",
        description: `🔍 Using AI to find all platform URLs for ${influencerName}`,
      });

      const result = await findPlatformUrls(influencerName, availablePlatforms);
      
      // Merge with existing identifiers
      const mergedIdentifiers = {
        ...platformIdentifiers,
        ...result.platformIdentifiers
      };

      // Save to database with all platforms selected
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        [...availablePlatforms],
        mergedIdentifiers
      );

      // Show detailed success message
      if (result.foundCount === result.requestedCount) {
        toast({
          title: "All Platforms Added!",
          description: `✅ Successfully found all ${result.foundCount} platforms for ${influencerName}`,
        });
      } else if (result.foundCount > 0) {
        toast({
          title: "Partially Added",
          description: `⚠️ Found ${result.foundCount} of ${result.requestedCount} platforms for ${influencerName}. You can add missing ones manually.`,
        });
      } else {
        toast({
          title: "Added (Manual Setup Needed)",
          description: `❌ Couldn't find URLs automatically for ${influencerName}. Please use "Fix Source URLs" to add them manually.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error selecting all platforms:', error);
      toast({
        title: "Error",
        description: "Failed to add all platforms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFindingUrls(null);
    }
  };

  const handleSelectAllInfluencers = async () => {
    setFindingUrls('all');
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const influencer of influencers) {
        if (!isInfluencerAdded(influencer.name)) {
          try {
            // Find URLs for this influencer
            const result = await findPlatformUrls(influencer.name, availablePlatforms);
            
            // Save to database
            await addOrUpdateInfluencerSource(
              influencer.id,
              influencer.name,
              [...availablePlatforms],
              result.platformIdentifiers
            );
            
            successCount++;
          } catch (error) {
            console.error(`Error adding ${influencer.name}:`, error);
            errorCount++;
          }
        }
      }

      if (errorCount === 0) {
        toast({
          title: "All Influencers Added!",
          description: `✅ Successfully added ${successCount} influencers with auto-discovered URLs`,
        });
      } else {
        toast({
          title: "Partially Added",
          description: `Added ${successCount} influencers, but ${errorCount} failed. Check console for details.`,
        });
      }
      
    } catch (error) {
      console.error('Error selecting all influencers:', error);
      toast({
        title: "Error",
        description: "Failed to add all influencers",
        variant: "destructive"
      });
    } finally {
      setFindingUrls(null);
    }
  };

  const fixExistingSourceURLs = async () => {
    setFindingUrls('fixing');
    
    try {
      let successCount = 0;
      let errorCount = 0;

      // Update each existing source with AI-discovered URLs
      for (const source of influencerSources) {
        try {
          // Find URLs using AI
          const result = await findPlatformUrls(source.influencer_name, source.selected_platforms);
          
          // Update the source
          await addOrUpdateInfluencerSource(
            source.influencer_id,
            source.influencer_name,
            source.selected_platforms,
            result.platformIdentifiers
          );
          
          successCount++;
        } catch (error) {
          console.error(`Error fixing ${source.influencer_name}:`, error);
          errorCount++;
        }
      }
      
      if (errorCount === 0) {
        toast({
          title: "All URLs Fixed!",
          description: `✅ Successfully updated ${successCount} sources with AI-discovered URLs`
        });
      } else {
        toast({
          title: "Partially Fixed",
          description: `Fixed ${successCount} sources, but ${errorCount} failed. Check console for details.`
        });
      }
    } catch (error) {
      console.error('Error fixing sources:', error);
      toast({
        title: "Error",
        description: "Failed to update source URLs. Check the console for details.",
        variant: "destructive"
      });
    } finally {
      setFindingUrls(null);
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
            Select financial influencers and experts, then choose which platforms to monitor. AI will automatically find their URLs.
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
                const mergedIdentifiers = source.platform_identifiers || {};
                const isEditing = editingInfluencer === source.influencer_id;
                const isProcessing = findingUrls === source.influencer_id;
                
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
                        {isProcessing && (
                          <Badge variant="secondary" className="animate-pulse">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Finding URLs...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingInfluencer(isEditing ? null : source.influencer_id)}
                          disabled={isProcessing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleRemoveInfluencer(source.influencer_name)}
                          disabled={isProcessing}
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
                                disabled={!isEditing || isProcessing}
                                onCheckedChange={() => {
                                  if (isEditing && !isProcessing) {
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
                                  !isEditing || isProcessing ? 'opacity-50' : ''
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
              Browse and add influential voices. AI will automatically find their platform URLs.
            </div>
            <div className="flex gap-2 mb-4">
              <Button
                onClick={handleSelectAllInfluencers}
                variant="outline"
                disabled={findingUrls !== null}
              >
                {findingUrls === 'all' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finding URLs...
                  </>
                ) : (
                  'Select All People'
                )}
              </Button>
              <Button
                onClick={fixExistingSourceURLs}
                variant="outline"
                className="flex items-center gap-2"
                disabled={findingUrls !== null || influencerSources.length === 0}
              >
                {findingUrls === 'fixing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fixing URLs...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Fix Source URLs
                  </>
                )}
              </Button>
              <Button
                onClick={testPodcastIngestion}
                disabled={testingAggregator || findingUrls !== null}
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
                const isProcessing = findingUrls === influencer.id;
                
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
                        {isProcessing && (
                          <Badge variant="secondary" className="animate-pulse">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Finding URLs...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleSelectAllPlatforms(
                              influencer.id,
                              influencer.name,
                              {}
                            )
                          }
                          disabled={findingUrls !== null}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Select All'
                          )}
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
                      <div className="text-sm font-medium text-muted-foreground">
                        Select Content Platforms (AI will find URLs):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availablePlatforms.map((platform) => {
                          const Icon = getPlatformIcon(platform);
                          const isSelected = selectedPlatforms.includes(platform);
                          
                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${influencer.id}-${platform}`}
                                checked={isSelected}
                                disabled={findingUrls !== null}
                                onCheckedChange={() =>
                                  handlePlatformToggle(
                                    influencer.id,
                                    influencer.name,
                                    platform,
                                    {}
                                  )
                                }
                              />
                              <Label 
                                htmlFor={`${influencer.id}-${platform}`}
                                className={`flex items-center gap-1 cursor-pointer capitalize ${
                                  findingUrls !== null ? 'opacity-50' : ''
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
