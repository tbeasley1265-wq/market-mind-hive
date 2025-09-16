import React, { useState } from 'react';
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Youtube, 
  Twitter, 
  Mail, 
  FileText, 
  Plus, 
  Settings,
  Trash2,
  ExternalLink
} from "lucide-react";
import VideoProcessor from "@/components/content/VideoProcessor";
import EmailIntegration from "@/components/email/EmailIntegration";

const Sources = () => {
  const [activeTab, setActiveTab] = useState('youtube');

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
          <TabsList className="grid w-full grid-cols-6">
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