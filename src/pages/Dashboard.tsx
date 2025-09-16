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
  MessageSquare,
  Mail
} from "lucide-react";
import ContentCard from "@/components/content/ContentCard";
import DocumentUpload from "@/components/content/DocumentUpload";
import EmailContentFilter from "@/components/content/EmailContentFilter";
import EmailIntegration from "@/components/email/EmailIntegration";
import ChatInterface from "@/components/chat/ChatInterface";
import Header from "@/components/layout/Header";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showChat, setShowChat] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{ title: string; url?: string } | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<any[]>([]);
  const [processedEmails, setProcessedEmails] = useState<any[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<any[]>([]);
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

  const handleDocumentProcessed = (result: any) => {
    if (result.success && result.data) {
      setProcessedDocuments(prev => [result.data, ...prev]);
      toast({
        title: "Document Added",
        description: `"${result.data.title}" has been processed and added to your content.`,
      });
    }
  };

  const handleEmailsProcessed = (emails: any[]) => {
    // Convert emails to the format expected by ContentCard
    const formattedEmails = emails.map(email => ({
      title: email.subject || email.title,
      source: "Gmail",
      platform: "email" as const,
      author: email.sender || email.author || "Email",
      timestamp: "just now",
      summary: email.summary || `Email from ${email.sender}`,
      tags: ["Email", "Research", ...(email.tags || [])],
      sentiment: "neutral" as const,
      originalUrl: email.originalUrl
    }));
    
    setProcessedEmails(prev => [...formattedEmails, ...prev]);
    setFilteredEmails(prev => [...formattedEmails, ...prev]);
    toast({
      title: "Emails Processed",
      description: `Added ${emails.length} research emails from your inbox.`,
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

  // Combine processed documents, emails, and mock content
  const allContent = [...processedDocuments, ...processedEmails, ...mockContent];

  const tabData = [
    { value: "all", label: "All Content", icon: FileText, count: allContent.length },
    { value: "crypto", label: "Crypto", icon: Bitcoin, count: allContent.filter(c => c.tags?.some((tag: string) => ['Bitcoin', 'Solana', 'DeFi', 'Crypto'].includes(tag))).length },
    { value: "macro", label: "Macro", icon: TrendingUp, count: allContent.filter(c => c.tags?.some((tag: string) => ['Fed', 'Interest Rates', 'Monetary Policy', 'Inflation', 'Economic Data'].includes(tag))).length },
    { value: "equities", label: "Equities", icon: DollarSign, count: allContent.filter(c => c.tags?.some((tag: string) => ['AI', 'Tech Stocks', 'Valuations', 'Earnings', 'Equities'].includes(tag))).length },
    { value: "emails", label: "Email Inbox", icon: Mail, count: processedEmails.length },
    { value: "newsletters", label: "Newsletters", icon: FileText, count: allContent.filter(c => c.tags?.some((tag: string) => ['Market Recap', 'Newsletter'].includes(tag))).length },
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
                  <div className="text-2xl font-bold text-foreground">{allContent.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="all" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
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
                  {allContent.map((content, index) => (
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
                  {allContent
                    .filter(content => content.tags?.some((tag: string) => 
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

              <TabsContent value="emails" className="space-y-6">
                {processedEmails.length === 0 ? (
                  <div className="text-center py-12">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Emails Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect your Gmail account to start extracting research content from your inbox.
                    </p>
                  </div>
                ) : (
                  <>
                    <EmailContentFilter 
                      emails={processedEmails} 
                      onFilteredEmailsChange={setFilteredEmails}
                    />
                    <div className="grid gap-6 lg:grid-cols-2">
                      {filteredEmails.map((email, index) => (
                        <ContentCard 
                          key={index} 
                          {...email} 
                          onAskAI={handleAskAI}
                          onSave={() => handleSave(email.title)}
                        />
                      ))}
                    </div>
                    {filteredEmails.length === 0 && processedEmails.length > 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          No emails match your current filters. Try adjusting your search criteria.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="equities" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {allContent
                    .filter(content => content.tags?.some((tag: string) => 
                      ['AI', 'Tech Stocks', 'Valuations', 'Earnings', 'Equities'].includes(tag)
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

              <TabsContent value="newsletters" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {allContent
                    .filter(content => content.tags?.some((tag: string) => 
                      ['Market Recap', 'Newsletter', 'Volatility', 'Economic Data'].includes(tag)
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
            {/* Email Integration Section */}
            <EmailIntegration onEmailsProcessed={handleEmailsProcessed} />
            
            {/* Document Upload Section */}
            <DocumentUpload onDocumentProcessed={handleDocumentProcessed} />
            
            {showChat ? (
              <ChatInterface 
                contentTitle={selectedContent?.title}
                onClose={() => setShowChat(false)}
              />
            ) : (
              <Card className="shadow-elevated border-accent/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-accent" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="hero" 
                      className="w-full justify-start h-12 text-left"
                      onClick={() => setShowChat(true)}
                    >
                      <MessageSquare className="h-5 w-5 mr-3" />
                      Ask AI Assistant
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 hover:border-accent/50 transition-colors">
                      <Plus className="h-5 w-5 mr-3" />
                      Process Video
                    </Button>
                    <Button variant="outline" className="w-full justify-start h-12 hover:border-accent/50 transition-colors">
                      <Settings className="h-5 w-5 mr-3" />
                      Manage Sources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
