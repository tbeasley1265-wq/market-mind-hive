import React, { useState } from 'react';
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  MessageCircle, 
  Mail, 
  FileText, 
  Plus, 
  Settings,
  Trash2,
  ExternalLink,
  Search,
  Users,
  CheckCircle2
} from "lucide-react";
import EmailIntegration from "@/components/email/EmailIntegration";

const Sources = () => {
  const [activeTab, setActiveTab] = useState('people');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [selectedYoutube, setSelectedYoutube] = useState<string[]>([]);
  const [selectedTwitter, setSelectedTwitter] = useState<string[]>([]);
  const [selectedSubstack, setSelectedSubstack] = useState<string[]>([]);
  const [selectedReddit, setSelectedReddit] = useState<string[]>([]);

  // Mock connected and available sources
  const mockSources = {
    youtube: {
      connected: [
        { id: "pomp-connected", name: "Anthony Pompliano", url: "https://youtube.com/@AnthonyPompliano", subscribers: "1.2M", active: true, category: "Crypto" },
        { id: "raoul-connected", name: "Raoul Pal", url: "https://youtube.com/@RaoulPal", subscribers: "890K", active: true, category: "Macro" },
        { id: "coinbureau-connected", name: "Coin Bureau", url: "https://youtube.com/@CoinBureau", subscribers: "2.1M", active: false, category: "Crypto" },
      ],
      available: [
        { id: "benjamin-cowen", name: "Benjamin Cowen", url: "https://youtube.com/@BenjaminCowen", subscribers: "1.8M", category: "Crypto" },
        { id: "altcoin-daily", name: "Altcoin Daily", url: "https://youtube.com/@AltcoinDaily", subscribers: "1.3M", category: "Crypto" },
        { id: "coin-desk", name: "CoinDesk", url: "https://youtube.com/@CoinDesk", subscribers: "420K", category: "News" },
        { id: "real-vision", name: "Real Vision", url: "https://youtube.com/@RealVision", subscribers: "680K", category: "Finance" },
        { id: "lex-fridman", name: "Lex Fridman", url: "https://youtube.com/@lexfridman", subscribers: "2.8M", category: "Tech" },
      ]
    },
    twitter: {
      connected: [
        { id: "pomp-twitter", name: "@APompliano", handle: "APompliano", followers: "1.8M", active: true, category: "Crypto" },
        { id: "raoul-twitter", name: "@RaoulGMI", handle: "RaoulGMI", followers: "1.2M", active: true, category: "Macro" },
      ],
      available: [
        { id: "saylor-twitter", name: "@saylor", handle: "saylor", followers: "3.1M", category: "Bitcoin" },
        { id: "elonmusk-twitter", name: "@elonmusk", handle: "elonmusk", followers: "150M", category: "Tech" },
        { id: "naval-twitter", name: "@naval", handle: "naval", followers: "2.1M", category: "Philosophy" },
        { id: "balaji-twitter", name: "@balajis", handle: "balajis", followers: "920K", category: "Tech" },
        { id: "cathie-twitter", name: "@CathieDWood", handle: "CathieDWood", followers: "2.1M", category: "Innovation" },
      ]
    },
    substack: {
      connected: [
        { id: "defiant-connected", name: "The Defiant", url: "thedefiant.substack.com", subscribers: "45K", active: true, category: "DeFi" },
        { id: "bankless-connected", name: "Bankless", url: "banklesshq.substack.com", subscribers: "125K", active: true, category: "Crypto" },
      ],
      available: [
        { id: "lyn-alden", name: "Lyn Alden Investment Strategy", url: "lynalden.substack.com", subscribers: "85K", category: "Finance" },
        { id: "morning-brew", name: "Morning Brew", url: "morningbrew.substack.com", subscribers: "200K", category: "Business" },
        { id: "stratechery", name: "Stratechery", url: "stratechery.substack.com", subscribers: "150K", category: "Tech" },
        { id: "macro-musings", name: "Macro Musings", url: "macromusings.substack.com", subscribers: "35K", category: "Economics" },
      ]
    },
    reddit: {
      connected: [
        { id: "bitcoin-connected", name: "r/Bitcoin", url: "/r/Bitcoin", members: "4.8M", active: true, category: "Bitcoin" },
        { id: "wsb-connected", name: "r/WallStreetBets", url: "/r/WallStreetBets", members: "15M", active: false, category: "Trading" },
      ],
      available: [
        { id: "ethereum-reddit", name: "r/ethereum", url: "/r/ethereum", members: "1.2M", category: "Ethereum" },
        { id: "investing-reddit", name: "r/investing", url: "/r/investing", members: "2.1M", category: "Investing" },
        { id: "cryptocurrency-reddit", name: "r/CryptoCurrency", url: "/r/CryptoCurrency", members: "6.8M", category: "Crypto" },
        { id: "defi-reddit", name: "r/defi", url: "/r/defi", members: "450K", category: "DeFi" },
        { id: "stocks-reddit", name: "r/stocks", url: "/r/stocks", members: "4.2M", category: "Stocks" },
      ]
    }
  };

  // Influencers list from onboarding (subset for demo)
  const influencers = [
    // Crypto & Bitcoin
    { id: "raoul-pal", name: "Raoul Pal", platform: "Real Vision", followers: "1.2M", category: "Macro" },
    { id: "anthony-pompliano", name: "Anthony Pompliano", platform: "YouTube", followers: "1.8M", category: "Crypto" },
    { id: "michael-saylor", name: "Michael Saylor", platform: "Twitter", followers: "3.1M", category: "Bitcoin" },
    { id: "balaji-srinivasan", name: "Balaji Srinivasan", platform: "Twitter", followers: "920K", category: "Tech" },
    { id: "coin-bureau", name: "Coin Bureau (Guy)", platform: "YouTube", followers: "2.1M", category: "Crypto" },
    { id: "benjamin-cowen", name: "Benjamin Cowen", platform: "YouTube", followers: "1.8M", category: "Crypto" },
    
    // Traditional Finance & Macro
    { id: "cathie-wood", name: "Cathie Wood", platform: "ARK Invest", followers: "2.1M", category: "Innovation" },
    { id: "lyn-alden", name: "Lyn Alden", platform: "Substack", followers: "450K", category: "Finance" },
    { id: "ray-dalio", name: "Ray Dalio", platform: "LinkedIn", followers: "3.2M", category: "Macro" },
    { id: "howard-marks", name: "Howard Marks", platform: "Oaktree Capital", followers: "890K", category: "Investing" },
    { id: "warren-buffett", name: "Warren Buffett", platform: "Berkshire Hathaway", followers: "4.2M", category: "Investing" },
    { id: "bill-ackman", name: "Bill Ackman", platform: "Twitter", followers: "1.2M", category: "Investing" },
    
    // Tech & Innovation
    { id: "elon-musk", name: "Elon Musk", platform: "Twitter", followers: "150M", category: "Tech" },
    { id: "sam-altman", name: "Sam Altman", platform: "OpenAI", followers: "2.1M", category: "AI" },
    { id: "jensen-huang", name: "Jensen Huang", platform: "NVIDIA", followers: "680K", category: "AI" },
    { id: "lex-fridman", name: "Lex Fridman", platform: "MIT/Podcast", followers: "2.8M", category: "AI" },
    
    // Venture Capital
    { id: "marc-andreessen", name: "Marc Andreessen", platform: "a16z", followers: "1.8M", category: "VC" },
    { id: "naval-ravikant", name: "Naval Ravikant", platform: "AngelList", followers: "2.1M", category: "VC" },
    { id: "chamath-palihapitiya", name: "Chamath Palihapitiya", platform: "Social Capital", followers: "1.6M", category: "VC" },
    { id: "peter-thiel", name: "Peter Thiel", platform: "Founders Fund", followers: "1.1M", category: "VC" },
    
    // Economics & Policy
    { id: "paul-krugman", name: "Paul Krugman", platform: "New York Times", followers: "5.2M", category: "Economics" },
    { id: "janet-yellen", name: "Janet Yellen", platform: "US Treasury", followers: "1.8M", category: "Policy" },
    { id: "jerome-powell", name: "Jerome Powell", platform: "Federal Reserve", followers: "2.1M", category: "Policy" },
    
    // Fintech
    { id: "brian-armstrong", name: "Brian Armstrong", platform: "Coinbase", followers: "1.8M", category: "Fintech" },
    { id: "jack-dorsey", name: "Jack Dorsey", platform: "Block (Square)", followers: "5.8M", category: "Fintech" },
    { id: "patrick-collison", name: "Patrick Collison", platform: "Stripe", followers: "680K", category: "Fintech" },
  ];

  const filteredInfluencers = influencers.filter(influencer => 
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInfluencerToggle = (influencerId: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(influencerId)
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const handleYoutubeToggle = (sourceId: string) => {
    setSelectedYoutube(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleTwitterToggle = (sourceId: string) => {
    setSelectedTwitter(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleSubstackToggle = (sourceId: string) => {
    setSelectedSubstack(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleRedditToggle = (sourceId: string) => {
    setSelectedReddit(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube': return Play;
      case 'twitter': return MessageCircle;
      case 'substack': return FileText;
      case 'reddit': return FileText;
      default: return FileText;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'youtube': return 'text-red-500';
      case 'twitter': return 'text-blue-500';
      case 'substack': return 'text-orange-500';
      case 'reddit': return 'text-orange-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Content Sources</h1>
          <p className="text-muted-foreground">
            Manage your content sources and configure automatic content ingestion from various platforms.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Twitter
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="substack" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Substack
            </TabsTrigger>
            <TabsTrigger value="reddit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reddit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="people" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Add Influencers & Experts
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Browse and add influential voices you might have missed during onboarding
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

                {/* Selected Count */}
                {selectedInfluencers.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-sm font-medium">
                      {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Add Selected
                    </Button>
                  </div>
                )}

                {/* Influencers Grid */}
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {filteredInfluencers.map((influencer) => (
                    <div key={influencer.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={influencer.id}
                        checked={selectedInfluencers.includes(influencer.id)}
                        onCheckedChange={() => handleInfluencerToggle(influencer.id)}
                      />
                      <Label htmlFor={influencer.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{influencer.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {influencer.platform} • {influencer.followers} followers
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {influencer.category}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>

                {filteredInfluencers.length === 0 && searchTerm && (
                  <div className="text-center py-8 text-muted-foreground">
                    No influencers found matching "{searchTerm}"
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="youtube" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-red-500" />
                  YouTube Channels
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage connected channels and discover new ones to follow
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search channels by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Connected Sources */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Connected Channels</h4>
                  <div className="grid gap-3">
                    {mockSources.youtube.connected.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Play className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {source.subscribers} subscribers
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Sources */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Discover New Channels</h4>
                    {selectedYoutube.length > 0 && (
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Add {selectedYoutube.length} Channel{selectedYoutube.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {mockSources.youtube.available
                      .filter(source => 
                        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        source.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((source) => (
                      <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={source.id}
                          checked={selectedYoutube.includes(source.id)}
                          onCheckedChange={() => handleYoutubeToggle(source.id)}
                        />
                        <Label htmlFor={source.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Play className="h-5 w-5 text-red-500" />
                              <div>
                                <div className="font-medium">{source.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {source.subscribers} subscribers
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {source.category}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="twitter" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  Twitter Accounts
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage connected accounts and discover new voices to follow
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Connected Sources */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Connected Accounts</h4>
                  <div className="grid gap-3">
                    {mockSources.twitter.connected.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {source.followers} followers
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Sources */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Discover New Accounts</h4>
                    {selectedTwitter.length > 0 && (
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Add {selectedTwitter.length} Account{selectedTwitter.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {mockSources.twitter.available
                      .filter(source => 
                        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        source.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((source) => (
                      <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={source.id}
                          checked={selectedTwitter.includes(source.id)}
                          onCheckedChange={() => handleTwitterToggle(source.id)}
                        />
                        <Label htmlFor={source.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="h-5 w-5 text-blue-500" />
                              <div>
                                <div className="font-medium">{source.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {source.followers} followers
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {source.category}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-500" />
                  Email Integration
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Connect your email to automatically process newsletters and financial content
                </div>
              </CardHeader>
              <CardContent>
                <EmailIntegration />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="substack" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Substack Publications
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage connected publications and discover new financial newsletters
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search publications by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Connected Sources */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Connected Publications</h4>
                  <div className="grid gap-3">
                    {mockSources.substack.connected.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {source.subscribers} subscribers
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Sources */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Discover New Publications</h4>
                    {selectedSubstack.length > 0 && (
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Add {selectedSubstack.length} Publication{selectedSubstack.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {mockSources.substack.available
                      .filter(source => 
                        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        source.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((source) => (
                      <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={source.id}
                          checked={selectedSubstack.includes(source.id)}
                          onCheckedChange={() => handleSubstackToggle(source.id)}
                        />
                        <Label htmlFor={source.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-orange-500" />
                              <div>
                                <div className="font-medium">{source.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {source.subscribers} subscribers
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {source.category}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reddit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Reddit Communities
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Manage connected subreddits and discover new financial communities
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search communities by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Connected Sources */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Connected Communities</h4>
                  <div className="grid gap-3">
                    {mockSources.reddit.connected.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {source.members} members
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={source.active ? "default" : "secondary"}>
                            {source.active ? "Active" : "Paused"}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available Sources */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Discover New Communities</h4>
                    {selectedReddit.length > 0 && (
                      <Button size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Add {selectedReddit.length} Community{selectedReddit.length !== 1 ? 'ies' : 'y'}
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 max-h-64 overflow-y-auto">
                    {mockSources.reddit.available
                      .filter(source => 
                        source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        source.category.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((source) => (
                      <div key={source.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                        <Checkbox
                          id={source.id}
                          checked={selectedReddit.includes(source.id)}
                          onCheckedChange={() => handleRedditToggle(source.id)}
                        />
                        <Label htmlFor={source.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-orange-600" />
                              <div>
                                <div className="font-medium">{source.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {source.members} members
                                </div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {source.category}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sources;