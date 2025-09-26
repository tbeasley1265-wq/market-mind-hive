import React, { useEffect, useState } from 'react';
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
import { useAuth } from "@/contexts/AuthContext";

type PlatformIdentifierMap = Partial<Record<string, string>>;

type InfluencerCatalogEntry = {
  id: string;
  name: string;
  platform: string;
  followers: string;
  category: string;
  defaultPlatformIdentifiers: PlatformIdentifierMap;
};

const influencerCatalog: InfluencerCatalogEntry[] = [
  {
    id: "raoul-pal",
    name: "Raoul Pal",
    platform: "Real Vision",
    followers: "1.2M",
    category: "Macro",
    defaultPlatformIdentifiers: {
      youtube: "UCNy7z9fzU1etjg5vQ8Ea4rg",
      podcasts: "https://feeds.megaphone.fm/ADV7482240834",
      twitter: "RaoulGMI",
    },
  },
  {
    id: "anthony-pompliano",
    name: "Anthony Pompliano",
    platform: "YouTube",
    followers: "1.8M",
    category: "Crypto",
    defaultPlatformIdentifiers: {
      youtube: "UCevXpeL8cny5j1YXQe1R0QQ",
      podcasts: "https://feeds.simplecast.com/TDxu8BcA",
      substack: "https://thepompletter.substack.com/feed",
      twitter: "APompliano",
    },
  },
  {
    id: "michael-saylor",
    name: "Michael Saylor",
    platform: "Twitter",
    followers: "3.1M",
    category: "Bitcoin",
    defaultPlatformIdentifiers: {
      youtube: "UCgK6O1apC-b8jo8YH6f6T_g",
      podcasts: "https://feeds.buzzsprout.com/2104958.rss",
      twitter: "saylor",
    },
  },
  {
    id: "balaji-srinivasan",
    name: "Balaji Srinivasan",
    platform: "Twitter",
    followers: "920K",
    category: "Tech",
    defaultPlatformIdentifiers: {
      substack: "https://balajis.com/feed",
      twitter: "balajis",
    },
  },
  {
    id: "coin-bureau",
    name: "Coin Bureau (Guy)",
    platform: "YouTube",
    followers: "2.1M",
    category: "Crypto",
    defaultPlatformIdentifiers: {
      youtube: "UCqK_GSMbpiV8spgD3ZGloSw",
      podcasts: "https://feeds.buzzsprout.com/1716409.rss",
      twitter: "coinbureau",
    },
  },
  {
    id: "benjamin-cowen",
    name: "Benjamin Cowen",
    platform: "YouTube",
    followers: "1.8M",
    category: "Crypto",
    defaultPlatformIdentifiers: {
      youtube: "UC8bI0uL-D87WKM2QX0ZNpLg",
      podcasts: "https://feeds.buzzsprout.com/1821952.rss",
      substack: "https://intocryptoverse.substack.com/feed",
      twitter: "intocryptoverse",
    },
  },
  {
    id: "cathie-wood",
    name: "Cathie Wood",
    platform: "ARK Invest",
    followers: "2.1M",
    category: "Innovation",
    defaultPlatformIdentifiers: {
      youtube: "UCwFEQHvcAf6R5m4kY4FJzYw",
      podcasts: "https://feeds.buzzsprout.com/815124.rss",
      twitter: "CathieDWood",
      newsletters: "https://www.ark-invest.com/newsletters/feed/",
    },
  },
  {
    id: "lyn-alden",
    name: "Lyn Alden",
    platform: "Substack",
    followers: "450K",
    category: "Finance",
    defaultPlatformIdentifiers: {
      substack: "https://newsletter.lynalden.com/feed/",
      twitter: "LynAldenContact",
      newsletters: "https://www.lynalden.com/feed/",
    },
  },
  {
    id: "ray-dalio",
    name: "Ray Dalio",
    platform: "LinkedIn",
    followers: "3.2M",
    category: "Macro",
    defaultPlatformIdentifiers: {
      youtube: "UCqY79sEJvXhqJx8zEo82T9A",
      twitter: "RayDalio",
      newsletters: "https://www.principles.com/blog/rss/",
    },
  },
  {
    id: "howard-marks",
    name: "Howard Marks",
    platform: "Oaktree Capital",
    followers: "890K",
    category: "Investing",
    defaultPlatformIdentifiers: {
      podcasts: "https://feeds.buzzsprout.com/1972703.rss",
      newsletters: "https://www.oaktreecapital.com/insights/memo?format=rss",
    },
  },
  {
    id: "warren-buffett",
    name: "Warren Buffett",
    platform: "Berkshire Hathaway",
    followers: "4.2M",
    category: "Investing",
    defaultPlatformIdentifiers: {
      newsletters: "https://www.berkshirehathaway.com/rss/news.rss",
    },
  },
  {
    id: "bill-ackman",
    name: "Bill Ackman",
    platform: "Twitter",
    followers: "1.2M",
    category: "Investing",
    defaultPlatformIdentifiers: {
      twitter: "BillAckman",
    },
  },
  {
    id: "elon-musk",
    name: "Elon Musk",
    platform: "Twitter",
    followers: "150M",
    category: "Tech",
    defaultPlatformIdentifiers: {
      twitter: "elonmusk",
      podcasts: "https://feeds.megaphone.fm/WSB5633927465",
    },
  },
  {
    id: "sam-altman",
    name: "Sam Altman",
    platform: "OpenAI",
    followers: "2.1M",
    category: "AI",
    defaultPlatformIdentifiers: {
      twitter: "sama",
      newsletters: "https://blog.samaltman.com/posts.rss",
    },
  },
  {
    id: "jensen-huang",
    name: "Jensen Huang",
    platform: "NVIDIA",
    followers: "680K",
    category: "AI",
    defaultPlatformIdentifiers: {
      twitter: "jensenhuang",
    },
  },
  {
    id: "lex-fridman",
    name: "Lex Fridman",
    platform: "MIT/Podcast",
    followers: "2.8M",
    category: "AI",
    defaultPlatformIdentifiers: {
      youtube: "UCSHZKyawb77ixDdsGog4iWA",
      podcasts: "https://lexfridman.com/feed/podcast/",
      twitter: "lexfridman",
    },
  },
  {
    id: "marc-andreessen",
    name: "Marc Andreessen",
    platform: "a16z",
    followers: "1.8M",
    category: "VC",
    defaultPlatformIdentifiers: {
      twitter: "pmarca",
      podcasts: "https://feeds.simplecast.com/JGE3yC0V",
    },
  },
  {
    id: "naval-ravikant",
    name: "Naval Ravikant",
    platform: "AngelList",
    followers: "2.1M",
    category: "VC",
    defaultPlatformIdentifiers: {
      twitter: "naval",
      podcasts: "https://rss.art19.com/naval",
      newsletters: "https://nav.al/feed",
    },
  },
  {
    id: "chamath-palihapitiya",
    name: "Chamath Palihapitiya",
    platform: "Social Capital",
    followers: "1.6M",
    category: "VC",
    defaultPlatformIdentifiers: {
      twitter: "chamath",
      podcasts: "https://feeds.megaphone.fm/WSB5633927465",
    },
  },
  {
    id: "peter-thiel",
    name: "Peter Thiel",
    platform: "Founders Fund",
    followers: "1.1M",
    category: "VC",
    defaultPlatformIdentifiers: {
      newsletters: "https://foundersfund.com/feed/",
    },
  },
  {
    id: "paul-krugman",
    name: "Paul Krugman",
    platform: "New York Times",
    followers: "5.2M",
    category: "Economics",
    defaultPlatformIdentifiers: {
      twitter: "paulkrugman",
      substack: "https://paulkrugman.substack.com/feed",
    },
  },
  {
    id: "janet-yellen",
    name: "Janet Yellen",
    platform: "US Treasury",
    followers: "1.8M",
    category: "Policy",
    defaultPlatformIdentifiers: {
      newsletters: "https://home.treasury.gov/news/press-releases/rss",
    },
  },
  {
    id: "jerome-powell",
    name: "Jerome Powell",
    platform: "Federal Reserve",
    followers: "2.1M",
    category: "Policy",
    defaultPlatformIdentifiers: {
      newsletters: "https://www.federalreserve.gov/feeds/press_all.xml",
      podcasts: "https://www.federalreserve.gov/feeds/podcast.xml",
    },
  },
  {
    id: "brian-armstrong",
    name: "Brian Armstrong",
    platform: "Coinbase",
    followers: "1.8M",
    category: "Fintech",
    defaultPlatformIdentifiers: {
      twitter: "brian_armstrong",
      podcasts: "https://feeds.simplecast.com/jg0aE7NV",
    },
  },
  {
    id: "jack-dorsey",
    name: "Jack Dorsey",
    platform: "Block (Square)",
    followers: "5.8M",
    category: "Fintech",
    defaultPlatformIdentifiers: {
      twitter: "jack",
      substack: "https://blockxyz.substack.com/feed",
    },
  },
  {
    id: "patrick-collison",
    name: "Patrick Collison",
    platform: "Stripe",
    followers: "680K",
    category: "Fintech",
    defaultPlatformIdentifiers: {
      twitter: "patrickc",
      newsletters: "https://patrickcollison.com/atom.xml",
    },
  },
];

const Sources = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingInfluencer, setEditingInfluencer] = useState<string | null>(null);
  const [testingAggregator, setTestingAggregator] = useState(false);
 codex/add-sync-processing-after-influencer-source-update
  const [syncingInfluencers, setSyncingInfluencers] = useState<Record<string, boolean>>({});

  const [platformIdentifierInputs, setPlatformIdentifierInputs] = useState<Record<string, Record<string, string>>>({});
 main
  const { toast } = useToast();
  const { user } = useAuth();

  const {
    influencerSources,
    loading,
    availablePlatforms,
    addOrUpdateInfluencerSource,
    removeInfluencerSource,
    getInfluencerPlatforms,
    isInfluencerAdded
  } = useInfluencerSources();

 codex/add-sync-processing-after-influencer-source-update
  const isSyncingAnything = Object.values(syncingInfluencers).some(Boolean);

  const triggerContentAggregation = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const { data, error } = await supabase.functions.invoke('content-aggregator', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Content aggregation failed');
    }

    return data;
  };

  const broadcastDashboardRefresh = async () => {
    if (!user) return;

    const channel = supabase.channel('dashboard-content-updates');

    try {
      const status = await channel.subscribe();
      if (status !== 'SUBSCRIBED') {
        console.warn('Dashboard refresh channel subscription failed with status:', status);
        return;
      }
      const sendStatus = await channel.send({
        type: 'broadcast',
        event: 'content_updated',
        payload: {
          userId: user.id,
          triggeredAt: new Date().toISOString()
        }
      });
      if (sendStatus !== 'ok') {
        console.warn('Dashboard refresh broadcast returned status:', sendStatus);
      }
    } catch (error) {
      console.error('Error broadcasting dashboard refresh:', error);
    } finally {
      supabase.removeChannel(channel);
    }
  };

  const runSyncForInfluencer = async (
    influencerId: string,
    influencerName: string,
    selectedPlatforms: string[],
    options: { showToast?: boolean } = {}
  ) => {
    const { showToast = true } = options;

    setSyncingInfluencers(prev => ({ ...prev, [influencerId]: true }));

    try {
      await addOrUpdateInfluencerSource(influencerId, influencerName, selectedPlatforms);
      const aggregationResult = await triggerContentAggregation();
      await broadcastDashboardRefresh();

      if (showToast) {
        const processedCount = aggregationResult?.processedCount ?? 0;
        toast({
          title: processedCount > 0 ? "Sync complete" : "Sync started",
          description: processedCount > 0
            ? `Processed ${processedCount} new content item${processedCount === 1 ? '' : 's'} for your dashboard.`
            : "We'll refresh your dashboard as soon as new content is available."
        });
      }
    } catch (error) {
      console.error('Error syncing influencer content:', error);
      toast({
        title: "Sync failed",
        description: "We couldn't process the selected platforms. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSyncingInfluencers(prev => {
        const updated = { ...prev };
        delete updated[influencerId];
        return updated;
      });
    }
  };

 codex/extend-influencer-catalog-with-platform-identifiers
  const getInfluencerDefaults = (influencerId: string): PlatformIdentifierMap => {
    return influencerCatalog.find(influencer => influencer.id === influencerId)?.defaultPlatformIdentifiers || {};
  };

  const buildDefaultIdentifiers = (influencerId: string, platforms: string[]): Record<string, string> => {
    const defaults = getInfluencerDefaults(influencerId);
    const existing = platformIdentifierInputs[influencerId] || {};

    return platforms.reduce((acc, platform) => {
      const defaultValue = existing[platform] ?? defaults[platform] ?? '';
      acc[platform] = defaultValue.trim();
      return acc;
    }, {} as Record<string, string>);
  };

  useEffect(() => {
    setPlatformIdentifierInputs(() => {
      const next: Record<string, Record<string, string>> = {};

      influencerSources.forEach(source => {
        const defaults = getInfluencerDefaults(source.influencer_id);
        const currentIdentifiers = source.platform_identifiers || {};
        const combined: Record<string, string> = { ...currentIdentifiers };

        source.selected_platforms.forEach(platform => {
          if (combined[platform] === undefined) {
            combined[platform] = defaults[platform] ?? '';
          }
        });

        next[source.influencer_id] = combined;
      });

      return next;
    });
  }, [influencerSources]);

  const filteredInfluencers = influencerCatalog.filter(influencer =>
 main

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
 main
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

 codex/extend-influencer-catalog-with-platform-identifiers
  const getPlatformPlaceholder = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'YouTube channel ID or URL';
      case 'twitter':
        return 'Twitter/X handle';
      case 'podcasts':
        return 'Podcast RSS feed URL';
      case 'substack':
        return 'Substack feed URL';
      case 'newsletters':
        return 'Newsletter RSS feed URL';
      default:
        return 'Platform identifier';
    }
  };

  const handlePlatformToggle = async (influencerId: string, influencerName: string, platform: string) => {
    const currentPlatforms = getInfluencerPlatforms(influencerId);
    const isAdding = !currentPlatforms.includes(platform);
    const newPlatforms = isAdding
      ? [...currentPlatforms, platform]
      : currentPlatforms.filter(p => p !== platform);

    const updatedIdentifiers = buildDefaultIdentifiers(influencerId, newPlatforms);
    setPlatformIdentifierInputs(prev => ({
      ...prev,
      [influencerId]: updatedIdentifiers,
    }));

    try {
      await addOrUpdateInfluencerSource(influencerId, influencerName, newPlatforms, updatedIdentifiers);

  const handlePlatformToggle = async (influencer: any, platform: string) => {
    const currentPlatforms = getInfluencerPlatforms(influencer.name);
    const newPlatforms = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform];

    try {
 codex/add-sync-processing-after-influencer-source-update
      await runSyncForInfluencer(influencerId, influencerName, newPlatforms);

      await addOrUpdateInfluencerSource(influencer.urls || {}, influencer.name, newPlatforms);
 main
 main
    } catch (error) {
      console.error('Error updating platforms:', error);
    }
  };

 codex/extend-influencer-catalog-with-platform-identifiers
  const handleIdentifierChange = (influencerId: string, platform: string, value: string) => {
    setPlatformIdentifierInputs(prev => ({
      ...prev,
      [influencerId]: {
        ...(prev[influencerId] || {}),
        [platform]: value,
      },
    }));
  };

  const handleIdentifierBlur = async (
    influencerId: string,
    influencerName: string,
    selectedPlatforms: string[]
  ) => {
    const identifiers = buildDefaultIdentifiers(influencerId, selectedPlatforms);

    try {
      await addOrUpdateInfluencerSource(influencerId, influencerName, selectedPlatforms, identifiers);
    } catch (error) {
      console.error('Error saving platform identifier:', error);
    }
  };

  const handleRemoveInfluencer = async (influencerId: string) => {

  const handleRemoveInfluencer = async (influencerName: string) => {
 main
    try {
      await removeInfluencerSource(influencerName);
      setEditingInfluencer(null);
      setPlatformIdentifierInputs(prev => {
        const { [influencerId]: _removed, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error removing influencer:', error);
    }
  };

  const handleSelectAllPlatforms = async (influencerId: string, influencerName: string) => {
    try {
 codex/add-sync-processing-after-influencer-source-update
      await runSyncForInfluencer(influencerId, influencerName, [...availablePlatforms]);

      const identifiers = buildDefaultIdentifiers(influencerId, [...availablePlatforms]);
      setPlatformIdentifierInputs(prev => ({
        ...prev,
        [influencerId]: identifiers,
      }));
      await addOrUpdateInfluencerSource(influencerId, influencerName, [...availablePlatforms], identifiers);
 main
    } catch (error) {
      console.error('Error selecting all platforms:', error);
    }
  };

  const handleSelectAllInfluencers = async () => {
    try {
 codex/add-sync-processing-after-influencer-source-update
      let processedAny = false;
      for (const influencer of influencers) {
        if (!isInfluencerAdded(influencer.id)) {
          processedAny = true;
          await runSyncForInfluencer(influencer.id, influencer.name, [...availablePlatforms], { showToast: false });

      for (const influencer of influencerCatalog) {
        if (!isInfluencerAdded(influencer.id)) {
          const defaultIdentifiers = buildDefaultIdentifiers(influencer.id, availablePlatforms);
          setPlatformIdentifierInputs(prev => ({
            ...prev,
            [influencer.id]: defaultIdentifiers,
          }));
          await addOrUpdateInfluencerSource(influencer.id, influencer.name, [...availablePlatforms], defaultIdentifiers);
 main
        }
      }

      if (processedAny) {
        toast({
          title: "Bulk sync complete",
          description: "All selected influencers are now syncing and your dashboard will update automatically."
        });
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
                const influencer = influencerCatalog.find(inf => inf.id === source.influencer_id);
                const isEditing = editingInfluencer === source.influencer_id;
                const isSyncing = syncingInfluencers[source.influencer_id];

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
                        {isSyncing && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Syncing
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingInfluencer(isEditing ? null : source.influencer_id)}
                          disabled={isSyncing}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
 codex/add-sync-processing-after-influencer-source-update
                          onClick={() => handleRemoveInfluencer(source.influencer_id)}
                          disabled={isSyncing}

                          onClick={() => handleRemoveInfluencer(source.influencer_name)}
 main
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
 codex/add-sync-processing-after-influencer-source-update
                                disabled={!isEditing || !!isSyncing}
                                onCheckedChange={() =>
                                  isEditing && handlePlatformToggle(source.influencer_id, source.influencer_name, platform)
                                }

                                disabled={!isEditing}
                                 onCheckedChange={() => {
                                   if (isEditing) {
                                     // Create influencer object from source data
                                     const influencer = {
                                       name: source.influencer_name,
                                       urls: JSON.parse(source.influencer_id)
                                     };
                                     handlePlatformToggle(influencer, platform);
                                   }
                                 }}
 main
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

                    {source.selected_platforms.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">Platform identifiers</div>
                        <div className="grid gap-3">
                          {source.selected_platforms.map((platform) => {
                            const identifiers = platformIdentifierInputs[source.influencer_id] || {};
                            const value = identifiers[platform] ?? '';
                            const defaults = getInfluencerDefaults(source.influencer_id);
                            const defaultValue = (defaults[platform] ?? '').trim();
                            const trimmedValue = value.trim();
                            const helperText = trimmedValue
                              ? defaultValue && trimmedValue === defaultValue
                                ? `Using default identifier (${defaultValue}).`
                                : 'Using custom identifier.'
                              : defaultValue
                                ? `Default: ${defaultValue}`
                                : `Provide the ${platform} handle or feed URL to aggregate content.`;

                            return (
                              <div
                                key={`${source.influencer_id}-${platform}-identifier`}
                                className="grid gap-1"
                              >
                                <Label className="text-xs font-medium capitalize text-muted-foreground">
                                  {platform} identifier
                                </Label>
                                <Input
                                  value={value}
                                  onChange={(event) =>
                                    handleIdentifierChange(source.influencer_id, platform, event.target.value)
                                  }
                                  onBlur={() =>
                                    handleIdentifierBlur(
                                      source.influencer_id,
                                      source.influencer_name,
                                      source.selected_platforms
                                    )
                                  }
                                  disabled={!isEditing}
                                  placeholder={getPlatformPlaceholder(platform)}
                                />
                                <p className="text-xs text-muted-foreground">{helperText}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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
                disabled={isSyncingAnything}
                className="flex items-center gap-2"
              >
                {isSyncingAnything && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSyncingAnything ? 'Syncing...' : 'Select All People'}
              </Button>
              <Button
                onClick={testPodcastIngestion}
                disabled={testingAggregator || isSyncingAnything}
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
 codex/add-sync-processing-after-influencer-source-update
                const isAdded = isInfluencerAdded(influencer.id);
                const selectedPlatforms = getInfluencerPlatforms(influencer.id);
                const isSyncing = syncingInfluencers[influencer.id];


                const isAdded = isInfluencerAdded(influencer.name);
                const selectedPlatforms = getInfluencerPlatforms(influencer.name);
                
 main
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
                        {isSyncing && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Syncing
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectAllPlatforms(influencer.id, influencer.name)}
                          disabled={!!isSyncing}
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

                    {Object.entries(influencer.defaultPlatformIdentifiers).length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Default identifiers:</div>
                        <div className="space-y-1">
                          {Object.entries(influencer.defaultPlatformIdentifiers).map(([platform, identifier]) => (
                            <div key={platform} className="flex flex-wrap gap-1">
                              <span className="capitalize font-medium">{platform}:</span>
                              <span className="font-mono break-all">{identifier}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
 codex/add-sync-processing-after-influencer-source-update
                                disabled={!!isSyncing}
                                onCheckedChange={() =>
                                  handlePlatformToggle(influencer.id, influencer.name, platform)

                                onCheckedChange={() => 
                                  handlePlatformToggle(influencer, platform)
 main
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