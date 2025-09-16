import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Plus,
  TrendingUp,
  Bitcoin,
  DollarSign,
  Briefcase,
  FileText,
  Upload,
  Calendar,
  Settings,
  MessageSquare
} from "lucide-react";
import ContentCard from "@/components/content/ContentCard";
import ChatInterface from "@/components/chat/ChatInterface";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ title: string; url?: string } | null>(null);
  const { toast } = useToast();

  const handleAskAI = (title: string, url?: string) => {
    setSelectedContent({ title, url });
    setShowChat(true);
  };

  const handleSave = (title: string) => {
    toast({
      title: "Saved",
      description: `"${title}" has been saved to your bookmarks.`,
    });
  };

  // Mock data for demonstration
  const mockContent = [
    {
      title: "Bitcoin ETF Approval: What This Means for Crypto Markets",
      source: "Real Vision",
      platform: "youtube" as const,
      author: "Raoul Pal",
      timestamp: "2 hours ago",
      summary: "Deep dive into the recent Bitcoin ETF approval and its implications for institutional adoption. Raoul discusses the potential for $100B+ inflows and what this means for BTC price action in the coming quarters.",
      tags: ["Bitcoin", "ETF", "Institutional", "Regulation"],
      sentiment: "bullish" as const,
      originalUrl: "https://youtube.com/watch?v=example"
    },
    {
      title: "Federal Reserve Policy Update - Interest Rate Decision Analysis",
      source: "Macro Musings",
      platform: "substack" as const,
      author: "David Beckworth",
      timestamp: "4 hours ago",
      summary: "Analysis of the latest Fed decision and its impact on markets. Key insights on inflation targeting, employment data, and the path forward for monetary policy in 2024.",
      tags: ["Fed", "Interest Rates", "Monetary Policy", "Inflation"],
      sentiment: "neutral" as const,
      originalUrl: "https://substack.com/example"
    },
    {
      title: "AI Bubble or Sustainable Growth? Tech Earnings Deep Dive",
      source: "The Acquirer's Multiple",
      platform: "substack" as const,
      author: "Tobias Carlisle",
      timestamp: "6 hours ago",
      summary: "Comprehensive analysis of recent tech earnings with focus on AI companies. Examines valuation multiples, revenue growth sustainability, and potential market corrections.",
      tags: ["AI", "Tech Stocks", "Valuations", "Earnings"],
      sentiment: "bearish" as const,
      originalUrl: "https://substack.com/example2"
    },
    {
      title: "Solana Ecosystem Update: DeFi TVL Reaches New Highs",
      source: "Bankless",
      platform: "youtube" as const,
      author: "Ryan Sean Adams",
      timestamp: "1 day ago",
      summary: "Overview of Solana's recent ecosystem growth, including DeFi protocols, NFT marketplaces, and developer activity. Analysis of SOL token performance and network metrics.",
      tags: ["Solana", "DeFi", "TVL", "Ecosystem"],
      sentiment: "bullish" as const,
      originalUrl: "https://youtube.com/watch?v=example2"
    },
    {
      title: "Weekly Market Recap: Volatility Returns to Equity Markets",
      source: "Newsletter",
      platform: "email" as const,
      author: "The Kobeissi Letter",
      timestamp: "1 day ago",
      summary: "Weekly roundup of market movements, key economic data releases, and sector performance. Focus on increased volatility patterns and potential catalysts for next week.",
      tags: ["Market Recap", "Volatility", "Equities", "Economic Data"],
      sentiment: "neutral" as const,
    }
  ];

  const tabData = [
    { value: "all", label: "All Content", icon: FileText, count: 47 },
    { value: "crypto", label: "Crypto", icon: Bitcoin, count: 18 },
    { value: "macro", label: "Macro", icon: TrendingUp, count: 12 },
    { value: "equities", label: "Equities", icon: DollarSign, count: 15 },
    { value: "newsletters", label: "Newsletters", icon: FileText, count: 8 },
    { value: "uploaded", label: "Uploaded", icon: Upload, count: 3 },
    { value: "weekly", label: "Weekly Recap", icon: Calendar, count: 1 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Research Dashboard</h1>
                <p className="text-muted-foreground">
                  Stay updated with the latest insights from your connected sources
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Sources
                </Button>
                <Button variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </div>

            {/* Search and Quick Stats */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search across all content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">47</div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">12</div>
                  <div className="text-xs text-muted-foreground">Bullish</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">8</div>
                  <div className="text-xs text-muted-foreground">Bearish</div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
                {tabData.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.value} 
                      value={tab.value}
                      className="flex items-center gap-2 text-xs lg:text-sm"
                    >
                      <IconComponent className="h-4 w-4" />
                      <span className="hidden lg:inline">{tab.label}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {tab.count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Content Grid */}
              <TabsContent value="all" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {mockContent.map((content, index) => (
                    <ContentCard 
                      key={index} 
                      {...content} 
                      onAskAI={handleAskAI}
                      onSave={() => handleSave(content.title)}
                    />
                  ))}
                </div>
                
                <div className="text-center py-8">
                  <Button variant="outline">
                    Load More Content
                  </Button>
                </div>
              </TabsContent>

              {/* Other tab contents would be similar with filtered data */}
              <TabsContent value="crypto" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {mockContent
                    .filter(content => content.tags.some(tag => 
                      ['Bitcoin', 'Solana', 'DeFi', 'Crypto'].includes(tag)
                    ))
                    .map((content, index) => (
                      <ContentCard 
                        key={index} 
                        {...content} 
                        onAskAI={handleAskAI}
                        onSave={() => handleSave(content.title)}
                      />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="macro" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {mockContent
                    .filter(content => content.tags.some(tag => 
                      ['Fed', 'Interest Rates', 'Monetary Policy', 'Inflation', 'Economic Data'].includes(tag)
                    ))
                    .map((content, index) => (
                      <ContentCard 
                        key={index} 
                        {...content} 
                        onAskAI={handleAskAI}
                        onSave={() => handleSave(content.title)}
                      />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {showChat ? (
              <ChatInterface 
                contentTitle={selectedContent?.title}
                onClose={() => setShowChat(false)}
              />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Trending Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {["Bitcoin ETF", "AI Regulation", "Fed Policy", "DeFi Innovation"].map((topic) => (
                        <div key={topic} className="flex items-center justify-between">
                          <span className="text-sm">{topic}</span>
                          <Badge variant="secondary">↑ 12%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setShowChat(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ask AI Assistant
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Process Video
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Sources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
