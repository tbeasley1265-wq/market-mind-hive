import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Plus,
  TrendingUp,
  BarChart3,
  FileText,
  Mail,
  MessageSquare,
  Filter,
  Calendar,
  Bookmark,
  Clock,
  ArrowUpRight,
  Settings,
  Upload,
  Play,
  Send,
  Loader2,
  User
} from "lucide-react";
import ContentCard from "@/components/content/ContentCard";
import DocumentUpload from "@/components/content/DocumentUpload";
import EmailIntegrationModal from "@/components/email/EmailIntegrationModal";
import VideoProcessor from "@/components/content/VideoProcessor";
import UploadSourcesModal from "@/components/content/UploadSourcesModal";
import Header from "@/components/layout/Header";
import MarketMindsLogo from "@/components/ui/MarketMindsLogo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showVideoProcessor, setShowVideoProcessor] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showUploadSourcesModal, setShowUploadSourcesModal] = useState(false);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Fetch content items from database
  useEffect(() => {
    const fetchContentItems = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setContentItems(data || []);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContentItems();
  }, [user]);

  const handleContentClick = (contentId: string) => {
    navigate(`/content/${contentId}`);
  };

  const handleAskAI = async (query: string): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to use AI chat');
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: query,
          context: 'dashboard', // General dashboard context
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('AI chat error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      return data.message || 'Sorry, I couldn\'t process your request right now.';
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw new Error(errorMessage);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    
    try {
      const response = await handleAskAI(userMessage.content);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = async (title: string, content: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content_items')
        .insert({
          user_id: user.id,
          title: content.title,
          content_type: content.platform || 'article',
          platform: content.source || 'unknown',
          author: content.author,
          summary: content.summary,
          metadata: {
            tags: content.tags,
            sentiment: content.sentiment,
            originalUrl: content.originalUrl
          },
          original_url: content.originalUrl,
          is_bookmarked: true
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: `"${title}" has been saved to your bookmarks.`,
      });

      // Refresh content items
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setContentItems(data || []);
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Mock data for demonstration
  const mockContent = [
    {
      id: "mock-1",
      title: "Bitcoin ETF Approval: What This Means for Crypto Markets",
      source: "Real Vision",
      platform: "youtube" as const,
      author: "Raoul Pal",
      timestamp: "2 hours ago",
      summary: "Deep dive into the recent Bitcoin ETF approval and its implications for institutional adoption. Raoul discusses the potential for $100B+ inflows and what this means for BTC price action in the coming quarters.",
      tags: ["Bitcoin", "ETF", "Institutional", "Regulation"],
      
      originalUrl: "https://youtube.com/watch?v=example",
      isBookmarked: false
    },
    {
      id: "mock-2",
      title: "Federal Reserve Policy Update - Interest Rate Decision Analysis",
      source: "Macro Musings",
      platform: "substack" as const,
      author: "David Beckworth",
      timestamp: "4 hours ago",
      summary: "Analysis of the latest Fed decision and its impact on markets. Key insights on inflation targeting, employment data, and the path forward for monetary policy in 2024.",
      tags: ["Fed", "Interest Rates", "Monetary Policy", "Inflation"],
      
      originalUrl: "https://substack.com/example",
      isBookmarked: false
    },
    {
      id: "mock-3",
      title: "AI Bubble or Sustainable Growth? Tech Earnings Deep Dive",
      source: "The Acquirer's Multiple",
      platform: "substack" as const,
      author: "Tobias Carlisle",
      timestamp: "6 hours ago",
      summary: "Comprehensive analysis of recent tech earnings with focus on AI companies. Examines valuation multiples, revenue growth sustainability, and potential market corrections.",
      tags: ["AI", "Tech Stocks", "Valuations", "Earnings"],
      
      originalUrl: "https://substack.com/example2",
      isBookmarked: false
    }
  ];

  // Combine content items and mock content
  const allContent = [
    ...contentItems.map(item => ({
      id: item.id,
      title: item.title,
      source: item.platform,
      platform: item.content_type as 'youtube' | 'substack' | 'email',
      author: item.author || 'Unknown',
      timestamp: new Date(item.created_at).toLocaleString(),
      summary: item.summary || '',
      tags: item.metadata?.tags || [],
      
      originalUrl: item.original_url,
      isBookmarked: item.is_bookmarked
    })),
    ...mockContent
  ];

  const filteredContent = allContent.filter(content => {
    const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         content.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (activeFilter === "all") return matchesSearch;
    
    const filterMap: Record<string, string[]> = {
      crypto: ["Bitcoin", "Crypto", "DeFi", "Solana", "ETF"],
      macro: ["Fed", "Interest Rates", "Monetary Policy", "Inflation"],
      tech: ["AI", "Tech Stocks", "Valuations", "Earnings"],
      bookmarked: []
    };
    
    if (activeFilter === "bookmarked") {
      return matchesSearch && content.isBookmarked;
    }
    
    return matchesSearch && content.tags.some((tag: string) => 
      filterMap[activeFilter]?.includes(tag)
    );
  });

  const quickStats = [
    { 
      label: "Total Content", 
      value: allContent.length.toString(), 
      icon: FileText,
      change: "",
      trend: "up"
    },
    { 
      label: "This Week", 
      value: "24", 
      icon: Calendar,
      change: "",
      trend: "up"
    },
    { 
      label: "Bookmarked", 
      value: allContent.filter(c => c.isBookmarked).length.toString(), 
      icon: Bookmark,
      change: "",
      trend: "up"
    }
  ];

  const filters = [
    { key: "all", label: "All Content", count: allContent.length },
    { key: "crypto", label: "Crypto", count: allContent.filter(c => c.tags.some((t: string) => ["Bitcoin", "Crypto", "DeFi", "Solana", "ETF"].includes(t))).length },
    { key: "macro", label: "Macro", count: allContent.filter(c => c.tags.some((t: string) => ["Fed", "Interest Rates", "Monetary Policy", "Inflation"].includes(t))).length },
    { key: "tech", label: "Tech", count: allContent.filter(c => c.tags.some((t: string) => ["AI", "Tech Stocks", "Valuations", "Earnings"].includes(t))).length },
    { key: "bookmarked", label: "Saved", count: allContent.filter(c => c.isBookmarked).length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-48 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Research Hub</h1>
                <p className="text-muted-foreground">
                  Your curated financial intelligence dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowUploadSourcesModal(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Sources
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickStats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <Card key={stat.label} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-accent" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search and Filters */}
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search research, authors, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.key}
                    variant={activeFilter === filter.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(filter.key)}
                    className="whitespace-nowrap"
                  >
                    {filter.label}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="space-y-6">
              {filteredContent.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="text-muted-foreground">
                    {searchQuery ? (
                      <>
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No results found</p>
                        <p>Try adjusting your search terms or filters</p>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg mb-2">No content yet</p>
                        <p>Upload documents, connect email, or add sources to get started</p>
                      </>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
                  {filteredContent.map((content, index) => (
                    <ContentCard 
                      key={content.id || index} 
                      id={content.id}
                      {...content} 
                      onAskAI={(title) => {
                        const aiMessage = `Tell me more about: ${title}`;
                        setMessage(aiMessage);
                        handleSendMessage();
                      }}
                      onSave={() => handleSave(content.title, content)}
                      onClick={() => content.id && handleContentClick(content.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Chat Sidebar */}
          <div className="xl:col-span-1">
            <Card className="border-card-border shadow-card h-[calc(100vh-8rem)] flex flex-col sticky top-8">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <MarketMindsLogo size={24} />
                  <div>
                    <CardTitle className="text-lg">Market Minds AI</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ask about your research
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm mb-4">Welcome to Market Minds AI!</p>
                      <div className="space-y-2 text-xs">
                        <p>Try asking:</p>
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-2 text-xs text-left justify-start"
                            onClick={() => {
                              setMessage("What are the key themes in my research?");
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                          >
                            "What are the key themes in my research?"
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-2 text-xs text-left justify-start"
                            onClick={() => {
                              setMessage("Summarize recent market developments");
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                          >
                            "Summarize recent market developments"
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-2 text-xs text-left justify-start"
                            onClick={() => {
                              setMessage("What should I research next?");
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                          >
                            "What should I research next?"
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="flex-shrink-0 mt-1">
                          <MarketMindsLogo size={28} />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                        <div
                          className={`rounded-lg px-3 py-2 ${
                            msg.role === 'user'
                              ? 'bg-primary text-primary-foreground ml-auto'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                      
                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1 order-1">
                          <User className="h-4 w-4 text-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0 mt-1">
                        <MarketMindsLogo size={28} />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask about your research..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading}
                    size="sm"
                    className="px-3"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UploadSourcesModal
        isOpen={showUploadSourcesModal}
        onClose={() => setShowUploadSourcesModal(false)}
        onShowDocumentUpload={() => setShowDocumentUpload(true)}
        onShowEmailModal={() => setShowEmailModal(true)}
        onShowVideoProcessor={() => setShowVideoProcessor(true)}
      />

      {showEmailModal && (
        <EmailIntegrationModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onEmailsProcessed={() => {
            toast({
              title: "Success",
              description: "Email integration completed successfully.",
            });
            setShowEmailModal(false);
          }}
        />
      )}

      {showVideoProcessor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <VideoProcessor 
              onContentProcessed={(result) => {
                if (result.success) {
                  toast({
                    title: "Video Processed",
                    description: "Video has been analyzed and added to your content.",
                  });
                }
                setShowVideoProcessor(false);
              }}
            />
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowVideoProcessor(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDocumentUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <DocumentUpload 
              onDocumentProcessed={(result) => {
                if (result.success) {
                  toast({
                    title: "Document Processed", 
                    description: "Document has been analyzed and added to your content.",
                  });
                }
                setShowDocumentUpload(false);
              }}
            />
            <div className="p-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowDocumentUpload(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;