import React, { useMemo, useState } from 'react';
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

interface PlatformConnectorDetails {
  channelId?: string;
  handle?: string;
  feedUrl?: string;
  rssUrl?: string;
  url?: string;
}

interface InfluencerDefinition {
  id: string;
  name: string;
  platform: string;
  followers: string;
  category: string;
  connectors: Record<string, PlatformConnectorDetails>;
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  podcasts: 'Podcast',
  substack: 'Substack',
  newsletters: 'Newsletter'
};

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

  // Influencers list - financial experts and thought leaders with connector metadata
  const influencers = useMemo<InfluencerDefinition[]>(() => [
    {
      id: "raoul-pal",
      name: "Raoul Pal",
      platform: "Real Vision",
      followers: "1.2M",
      category: "Macro",
      connectors: {
        youtube: { channelId: "UC23-WdQqMghRyJk3fUsBuuA" },
        podcasts: { rssUrl: "https://feeds.simplecast.com/k8C0CzeT" },
        substack: { feedUrl: "https://www.raoulpaljourney.com/feed/" },
        twitter: { handle: "RaoulGMI" }
      }
    },
    {
      id: "anthony-pompliano",
      name: "Anthony Pompliano",
      platform: "The Pomp Podcast",
      followers: "1.8M",
      category: "Crypto",
      connectors: {
        youtube: { channelId: "UCevXpeL8cNyAnww-NqJ4m2g" },
        podcasts: { rssUrl: "https://rss.art19.com/pomp-podcast" },
        substack: { feedUrl: "https://pomp.substack.com/feed" },
        twitter: { handle: "APompliano" }
      }
    },
    {
      id: "michael-saylor",
      name: "Michael Saylor",
      platform: "MicroStrategy",
      followers: "3.1M",
      category: "Bitcoin",
      connectors: {
        youtube: { channelId: "UC3G0-k4NoQ_lCBLJ2m0Me7w" },
        twitter: { handle: "saylor" }
      }
    },
    {
      id: "balaji-srinivasan",
      name: "Balaji Srinivasan",
      platform: "The Network State",
      followers: "920K",
      category: "Tech",
      connectors: {
        podcasts: { rssUrl: "https://feeds.simplecast.com/68j0E3PY" },
        substack: { feedUrl: "https://balajis.com/feed/" },
        twitter: { handle: "balajis" }
      }
    },
    {
      id: "coin-bureau",
      name: "Coin Bureau (Guy)",
      platform: "Coin Bureau",
      followers: "2.1M",
      category: "Crypto",
      connectors: {
        youtube: { channelId: "UCqK_GSMbpiV8spgD3ZGloSw" },
        podcasts: { rssUrl: "https://feeds.simplecast.com/Bq8KS7I5" },
        newsletters: { feedUrl: "https://coinbureau.substack.com/feed" },
        twitter: { handle: "coinbureau" }
      }
    },
    {
      id: "benjamin-cowen",
      name: "Benjamin Cowen",
      platform: "Into The Cryptoverse",
      followers: "1.8M",
      category: "Crypto",
      connectors: {
        youtube: { channelId: "UC7PvPan7ku_l9Xo0J4bH_ZQ" },
        substack: { feedUrl: "https://newsletter.intothecryptoverse.com/feed" },
        twitter: { handle: "intocryptoverse" }
      }
    },
    {
      id: "cathie-wood",
      name: "Cathie Wood",
      platform: "ARK Invest",
      followers: "2.1M",
      category: "Innovation",
      connectors: {
        youtube: { channelId: "UCtYzVCmf-3rs2w4KPGK1vdw" },
        podcasts: { rssUrl: "https://feeds.simplecast.com/bFnZ4dJd" },
        newsletters: { feedUrl: "https://ark-invest.com/feed/" },
        twitter: { handle: "CathieDWood" }
      }
    },
    {
      id: "lyn-alden",
      name: "Lyn Alden",
      platform: "Lyn Alden Investment Strategy",
      followers: "450K",
      category: "Finance",
      connectors: {
        substack: { feedUrl: "https://www.lynalden.com/feed/" },
        twitter: { handle: "LynAldenContact" }
      }
    },
    {
      id: "ray-dalio",
      name: "Ray Dalio",
      platform: "Principles",
      followers: "3.2M",
      category: "Macro",
      connectors: {
        youtube: { channelId: "UCqvaXJ1K3HheTPNjH-KpwXQ" },
        newsletters: { feedUrl: "https://www.principles.com/feed/" },
        twitter: { handle: "RayDalio" }
      }
    },
    {
      id: "howard-marks",
      name: "Howard Marks",
      platform: "Oaktree Capital",
      followers: "890K",
      category: "Investing",
      connectors: {
        newsletters: { feedUrl: "https://www.oaktreecapital.com/insights?format=feed&type=rss" }
      }
    },
    {
      id: "warren-buffett",
      name: "Warren Buffett",
      platform: "Berkshire Hathaway",
      followers: "4.2M",
      category: "Investing",
      connectors: {
        newsletters: { feedUrl: "https://www.berkshirehathaway.com/rss/news.xml" }
      }
    },
    {
      id: "bill-ackman",
      name: "Bill Ackman",
      platform: "Pershing Square",
      followers: "1.2M",
      category: "Investing",
      connectors: {
        newsletters: { feedUrl: "https://pershingsquare.com/feed/" },
        twitter: { handle: "BillAckman" }
      }
    },
    {
      id: "elon-musk",
      name: "Elon Musk",
      platform: "Tesla / SpaceX",
      followers: "150M",
      category: "Tech",
      connectors: {
        twitter: { handle: "elonmusk" }
      }
    },
    {
      id: "sam-altman",
      name: "Sam Altman",
      platform: "OpenAI",
      followers: "2.1M",
      category: "AI",
      connectors: {
        twitter: { handle: "sama" }
      }
    },
    {
      id: "jensen-huang",
      name: "Jensen Huang",
      platform: "NVIDIA",
      followers: "680K",
      category: "AI",
      connectors: {
        youtube: { channelId: "UC0rZoXAD5lxgBHMsjrGwWWQ" },
        twitter: { handle: "nvidia" }
      }
    },
    {
      id: "lex-fridman",
      name: "Lex Fridman",
      platform: "Lex Fridman Podcast",
      followers: "2.8M",
      category: "AI",
      connectors: {
        youtube: { channelId: "UCSHZKyawb77ixDdsGog4iWA" },
        podcasts: { rssUrl: "https://lexfridman.com/feed/podcast/" },
        substack: { feedUrl: "https://lexfridman.substack.com/feed" },
        twitter: { handle: "lexfridman" }
      }
    },
    {
      id: "marc-andreessen",
      name: "Marc Andreessen",
      platform: "Andreessen Horowitz",
      followers: "1.8M",
      category: "VC",
      connectors: {
        podcasts: { rssUrl: "https://feeds.simplecast.com/4MvgQ73R" },
        newsletters: { feedUrl: "https://future.a16z.com/feed/" },
        twitter: { handle: "pmarca" }
      }
    },
    {
      id: "naval-ravikant",
      name: "Naval Ravikant",
      platform: "AngelList",
      followers: "2.1M",
      category: "VC",
      connectors: {
        podcasts: { rssUrl: "https://nav.al/feed" },
        twitter: { handle: "naval" }
      }
    },
    {
      id: "chamath-palihapitiya",
      name: "Chamath Palihapitiya",
      platform: "Social Capital",
      followers: "1.6M",
      category: "VC",
      connectors: {
        podcasts: { rssUrl: "https://feeds.megaphone.fm/allin" },
        twitter: { handle: "chamath" }
      }
    },
    {
      id: "peter-thiel",
      name: "Peter Thiel",
      platform: "Founders Fund",
      followers: "1.1M",
      category: "VC",
      connectors: {
        newsletters: { feedUrl: "https://foundersfund.com/feed/" }
      }
    },
    {
      id: "paul-krugman",
      name: "Paul Krugman",
      platform: "New York Times",
      followers: "5.2M",
      category: "Economics",
      connectors: {
        newsletters: { feedUrl: "https://rss.nytimes.com/services/xml/rss/nyt/PaulKrugman.xml" },
        twitter: { handle: "paulkrugman" }
      }
    },
    {
      id: "janet-yellen",
      name: "Janet Yellen",
      platform: "US Treasury",
      followers: "1.8M",
      category: "Policy",
      connectors: {
        newsletters: { feedUrl: "https://home.treasury.gov/news/press-releases/rss" }
      }
    },
    {
      id: "jerome-powell",
      name: "Jerome Powell",
      platform: "Federal Reserve",
      followers: "2.1M",
      category: "Policy",
      connectors: {
        newsletters: { feedUrl: "https://www.federalreserve.gov/feeds/press_all.xml" }
      }
    },
    {
      id: "brian-armstrong",
      name: "Brian Armstrong",
      platform: "Coinbase",
      followers: "1.8M",
      category: "Fintech",
      connectors: {
        podcasts: { rssUrl: "https://feeds.buzzsprout.com/222503.rss" },
        twitter: { handle: "brian_armstrong" }
      }
    },
    {
      id: "jack-dorsey",
      name: "Jack Dorsey",
      platform: "Block (Square)",
      followers: "5.8M",
      category: "Fintech",
      connectors: {
        twitter: { handle: "jack" }
      }
    },
    {
      id: "patrick-collison",
      name: "Patrick Collison",
      platform: "Stripe",
      followers: "680K",
      category: "Fintech",
      connectors: {
        newsletters: { feedUrl: "https://stripe.com/blog/feed" },
        twitter: { handle: "patrickc" }
      }
    }
  ], []);

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

  const handlePlatformToggle = async (influencerId: string, influencerName: string, platform: string) => {
    const influencer = influencers.find(inf => inf.id === influencerId);
    const connectorMap = influencer?.connectors || {};

    if (!connectorMap[platform]) {
      toast({
        title: "Connector unavailable",
        description: `${influencerName} does not have a configured ${PLATFORM_LABELS[platform] || platform} connector yet.`
      });
      return;
    }

    const currentPlatforms = getInfluencerPlatforms(influencerId);
    const toggledPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];
    const sanitizedPlatforms = toggledPlatforms.filter(p => Boolean(connectorMap[p]));

    try {
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        sanitizedPlatforms,
        connectorMap
      );
    } catch (error) {
      console.error('Error updating platforms:', error);
    }
  };

  const handleRemoveInfluencer = async (influencerId: string) => {
    try {
      await removeInfluencerSource(influencerId);
      setEditingInfluencer(null);
    } catch (error) {
      console.error('Error removing influencer:', error);
    }
  };

  const handleSelectAllPlatforms = async (influencerId: string, influencerName: string) => {
    const influencer = influencers.find(inf => inf.id === influencerId);
    const connectorMap = influencer?.connectors || {};
    const supportedPlatforms = availablePlatforms.filter(platform => Boolean(connectorMap[platform]));

    if (supportedPlatforms.length === 0) {
      toast({
        title: "No connectors available",
        description: `${influencerName} does not have any content connectors configured yet.`
      });
      return;
    }

    try {
      await addOrUpdateInfluencerSource(
        influencerId,
        influencerName,
        supportedPlatforms,
        connectorMap
      );
    } catch (error) {
      console.error('Error selecting all platforms:', error);
    }
  };

  const handleSelectAllInfluencers = async () => {
    try {
      for (const influencer of influencers) {
        const connectorMap = influencer.connectors || {};
        const supportedPlatforms = availablePlatforms.filter(platform => Boolean(connectorMap[platform]));

        if (supportedPlatforms.length === 0) {
          continue;
        }

        if (!isInfluencerAdded(influencer.id)) {
          await addOrUpdateInfluencerSource(
            influencer.id,
            influencer.name,
            supportedPlatforms,
            connectorMap
          );
        }
      }
    } catch (error) {
      console.error('Error selecting all influencers:', error);
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
                          onClick={() => handleRemoveInfluencer(source.influencer_id)}
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
                          const connectorMap = influencer?.connectors || {};
                          const hasConnector = Boolean(connectorMap[platform]);
                          const isSelected = source.selected_platforms.includes(platform);

                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${source.influencer_id}-${platform}`}
                                checked={isSelected}
                                disabled={!isEditing || !hasConnector}
                                onCheckedChange={() =>
                                  isEditing && hasConnector && handlePlatformToggle(source.influencer_id, source.influencer_name, platform)
                                }
                              />
                              <Label
                                htmlFor={`${source.influencer_id}-${platform}`}
                                className={`flex items-center gap-1 cursor-pointer capitalize ${
                                  !isEditing || !hasConnector ? 'opacity-50' : ''
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${getPlatformColor(platform)}`} />
                                {PLATFORM_LABELS[platform] || platform}
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
                const isAdded = isInfluencerAdded(influencer.id);
                const selectedPlatforms = getInfluencerPlatforms(influencer.id);
                const connectorMap = influencer.connectors || {};
                const availableConnectorPlatforms = availablePlatforms.filter(platform => Boolean(connectorMap[platform]));

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
                          onClick={() => handleSelectAllPlatforms(influencer.id, influencer.name)}
                          disabled={availableConnectorPlatforms.length === 0}
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
                          const hasConnector = Boolean(connectorMap[platform]);
                          const isSelected = selectedPlatforms.includes(platform) && hasConnector;

                          return (
                            <div key={platform} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${influencer.id}-${platform}`}
                                checked={isSelected}
                                disabled={!hasConnector}
                                onCheckedChange={() =>
                                  hasConnector && handlePlatformToggle(influencer.id, influencer.name, platform)
                                }
                              />
                              <Label
                                htmlFor={`${influencer.id}-${platform}`}
                                className={`flex items-center gap-1 cursor-pointer capitalize ${
                                  !hasConnector ? 'opacity-50' : ''
                                }`}
                              >
                                <Icon className={`h-4 w-4 ${getPlatformColor(platform)}`} />
                                {PLATFORM_LABELS[platform] || platform}
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