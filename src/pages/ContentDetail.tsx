import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  ExternalLink, 
  Clock, 
  User,
  TrendingUp,
  TrendingDown,
  Play,
  MessageCircle,
  FileText,
  Send,
  Bot,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ContentItem = Database['public']['Tables']['content_items']['Row'] & {
  source?: string;
  tags?: string[];
  sentiment?: "bullish" | "bearish" | "neutral";
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const platformIcons = {
  youtube: Play,
  substack: FileText,
  twitter: MessageCircle,
  email: FileText,
  reddit: FileText,
};

const ContentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleAskAI = async (question: string) => {
    if (!question.trim() || !content) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput("");
    setIsAILoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to use AI chat');
      }

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: question,
          context: `Content: ${content.title}\n\nSummary: ${content.summary}\n\nFull Content: ${content.full_content}`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('AI chat error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'Sorry, I couldn\'t process your request right now.',
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskAI(chatInput);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;

      // Check if this is mock content
      if (id.startsWith('mock-')) {
        // Handle mock content locally
        const mockContent = [
          {
            id: "mock-1",
            title: "Bitcoin ETF Approval: What This Means for Crypto Markets",
            source: "Real Vision",
            platform: "youtube",
            author: "Raoul Pal",
            created_at: new Date().toISOString(),
            summary: "Deep dive into the recent Bitcoin ETF approval and its implications for institutional adoption. Raoul discusses the potential for $100B+ inflows and what this means for BTC price action in the coming quarters.",
            tags: ["Bitcoin", "ETF", "Institutional", "Regulation"],
            sentiment: "bullish" as const,
            original_url: "https://youtube.com/watch?v=example",
            full_content: "This comprehensive analysis explores the groundbreaking Bitcoin ETF approval and its far-reaching implications for cryptocurrency markets. The approval represents a watershed moment for institutional adoption, potentially opening the floodgates for traditional financial institutions to gain exposure to Bitcoin.\n\nKey points covered:\n\n1. **Regulatory Breakthrough**: The ETF approval signals a significant shift in regulatory sentiment toward cryptocurrencies, providing legitimacy and regulatory clarity that institutional investors have long sought.\n\n2. **Institutional Inflows**: Conservative estimates suggest $100B+ in potential inflows over the next 2-3 years as pension funds, endowments, and other institutional players gain easy access to Bitcoin exposure.\n\n3. **Market Structure Impact**: The ETF will likely reduce Bitcoin's volatility over time as institutional money tends to be less reactive and more strategic in nature.\n\n4. **Price Implications**: Historical analysis of commodity and equity ETF launches suggests significant price appreciation in the underlying asset, with Bitcoin potentially reaching new all-time highs.\n\n5. **Ecosystem Effects**: The approval will likely accelerate development across the entire crypto ecosystem, from infrastructure to DeFi protocols.\n\nThis represents just the beginning of crypto's institutional adoption phase, with more products and services likely to follow. The long-term implications extend beyond just price appreciation to include broader mainstream acceptance and integration of digital assets into traditional financial systems."
          },
          {
            id: "mock-2",
            title: "Federal Reserve Policy Update - Interest Rate Decision Analysis",
            source: "Macro Musings",
            platform: "substack",
            author: "David Beckworth",
            created_at: new Date().toISOString(),
            summary: "Analysis of the latest Fed decision and its impact on markets. Key insights on inflation targeting, employment data, and the path forward for monetary policy in 2024.",
            tags: ["Fed", "Interest Rates", "Monetary Policy", "Inflation"],
            sentiment: "neutral" as const,
            original_url: "https://substack.com/example",
            full_content: "The Federal Reserve's latest policy announcement provides crucial insights into the central bank's thinking as it navigates complex economic conditions in 2024.\n\n**Key Takeaways:**\n\n1. **Interest Rate Decision**: The Fed maintained the federal funds rate at current levels, citing mixed economic signals and the need for more data before making significant policy changes.\n\n2. **Inflation Outlook**: While core inflation has shown signs of cooling, the Fed remains cautious about declaring victory, particularly given recent upticks in services inflation.\n\n3. **Employment Considerations**: The labor market continues to show resilience, but there are emerging signs of cooling that suggest a more balanced supply-demand dynamic.\n\n4. **Market Implications**: The decision to hold rates steady was largely expected by markets, but the accompanying statement and press conference provided important forward guidance.\n\n5. **2024 Outlook**: The Fed signaled a data-dependent approach for the remainder of 2024, with potential rate cuts contingent on continued progress on inflation and labor market normalization.\n\nThis balanced approach reflects the Fed's commitment to its dual mandate while acknowledging the complexity of current economic conditions."
          }
        ];

        const mockItem = mockContent.find(item => item.id === id);
        if (mockItem) {
          const enrichedContent: ContentItem = {
            ...mockItem,
            user_id: '',
            content_type: mockItem.platform,
            is_bookmarked: false,
            metadata: {
              tags: mockItem.tags,
              sentiment: mockItem.sentiment,
              source: mockItem.source
            },
            source_id: null,
            updated_at: mockItem.created_at
          };
          setContent(enrichedContent);
        } else {
          toast.error('Content not found');
          navigate('/dashboard');
        }
        setLoading(false);
        return;
      }

      // Handle real database content
      try {
        const { data, error } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Parse metadata to extract additional fields
        const metadata = data.metadata as any || {};
        const enrichedContent: ContentItem = {
          ...data,
          source: metadata.source || data.platform,
          tags: metadata.tags || [],
          sentiment: metadata.sentiment || "neutral"
        };
        
        setContent(enrichedContent);
      } catch (error) {
        console.error('Error fetching content:', error);
        toast.error('Failed to load content');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Content not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const PlatformIcon = platformIcons[content.platform as keyof typeof platformIcons] || FileText;

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-green-600 bg-green-50";
      case "bearish":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-3 w-3" />;
      case "bearish":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <div className="px-8 py-6 border-b border-border/40">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold text-foreground mb-3 leading-tight">
            {content.title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <PlatformIcon className="h-4 w-4" />
              <span>{content.source || content.platform}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{content.author || "Unknown Author"}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatDate(content.created_at)}</span>
            </div>
            {content.original_url && (
              <>
                <span>•</span>
                <a 
                  href={content.original_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Source
                </a>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-4">
            {content.sentiment && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(content.sentiment)}`}>
                {getSentimentIcon(content.sentiment)}
                <span className="capitalize">{content.sentiment}</span>
              </div>
            )}
            
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.tags.slice(0, 4).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4">Summary</h2>
          <div className="text-muted-foreground leading-relaxed">
            {content.summary}
          </div>
        </div>

        {/* Full Content */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4">Content</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {content.full_content}
            </div>
          </div>
        </div>

        {/* AI Chat Messages */}
        {chatMessages.length > 0 && (
          <div className="space-y-6 mb-8">
            <h2 className="text-lg font-medium text-foreground">AI Insights</h2>
            {chatMessages.map((message, index) => (
              <div key={message.id} className="space-y-4">
                {message.role === 'user' && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs text-primary-foreground font-medium">Q</span>
                    </div>
                    <div className="text-foreground font-medium">
                      {message.content}
                    </div>
                  </div>
                )}
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="text-muted-foreground leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isAILoading && (
              <div className="flex items-start gap-3">
                <Bot className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing content...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Chat Input - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/40 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder="Ask AI about this content..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAILoading}
                className="pr-12 border-border/60 focus:border-primary/50 bg-background"
              />
              <Button
                onClick={() => handleAskAI(chatInput)}
                disabled={!chatInput.trim() || isAILoading}
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding to account for fixed chat input */}
      <div className="h-20"></div>
    </div>
  );
};

export default ContentDetail;