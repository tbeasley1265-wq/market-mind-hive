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
  Youtube, 
  Twitter, 
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
import VideoProcessor from "@/components/content/VideoProcessor";
import EmailIntegration from "@/components/email/EmailIntegration";

const Sources = () => {
  const [activeTab, setActiveTab] = useState('youtube');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);

  // Mock connected sources
  const mockSources = {
    youtube: [
      { name: "Anthony Pompliano", url: "https://youtube.com/@AnthonyPompliano", subscribers: "1.2M", active: true },
      { name: "Raoul Pal", url: "https://youtube.com/@RaoulPal", subscribers: "890K", active: true },
      { name: "Coin Bureau", url: "https://youtube.com/@CoinBureau", subscribers: "2.1M", active: false },
    ],
    twitter: [
      { name: "@APompliano", handle: "APompliano", followers: "1.8M", active: true },
      { name: "@RaoulGMI", handle: "RaoulGMI", followers: "1.2M", active: true },
    ],
    substack: [
      { name: "The Defiant", url: "thedefiant.substack.com", subscribers: "45K", active: true },
      { name: "Bankless", url: "banklesshq.substack.com", subscribers: "125K", active: true },
    ],
    reddit: [
      { name: "r/Bitcoin", url: "/r/Bitcoin", members: "4.8M", active: true },
      { name: "r/WallStreetBets", url: "/r/WallStreetBets", members: "15M", active: false },
    ]
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

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'youtube': return Youtube;
      case 'twitter': return Twitter;
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

  const renderSourceList = (sources: any[], type: string) => {
    const Icon = getSourceIcon(type);
    const colorClass = getSourceColor(type);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">{type} Sources</h3>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>

        <div className="grid gap-4">
          {sources.map((source, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <div>
                    <h4 className="font-medium">{source.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {source.subscribers || source.followers || source.members} 
                      {type === 'twitter' ? ' followers' : type === 'reddit' ? ' members' : ' subscribers'}
                    </p>
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
            </Card>
          ))}
        </div>
      </div>
    );
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube
            </TabsTrigger>
            <TabsTrigger value="twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
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
            <TabsTrigger value="processor" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Process
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
            {renderSourceList(mockSources.youtube, 'youtube')}
          </TabsContent>

          <TabsContent value="twitter" className="space-y-6">
            {renderSourceList(mockSources.twitter, 'twitter')}
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <EmailIntegration />
          </TabsContent>

          <TabsContent value="substack" className="space-y-6">
            {renderSourceList(mockSources.substack, 'substack')}
          </TabsContent>

          <TabsContent value="reddit" className="space-y-6">
            {renderSourceList(mockSources.reddit, 'reddit')}
          </TabsContent>

          <TabsContent value="processor" className="space-y-6">
            <div className="grid gap-6">
              <VideoProcessor />
              
              <Card>
                <CardHeader>
                  <CardTitle>Private Platform Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect to private research platforms like Real Vision, The Defiant Pro, etc. 
                    Your credentials are encrypted and stored securely.
                  </p>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Real Vision</h4>
                        <p className="text-sm text-muted-foreground">Premium financial research</p>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">The Defiant Pro</h4>
                        <p className="text-sm text-muted-foreground">DeFi and crypto analysis</p>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Sources;