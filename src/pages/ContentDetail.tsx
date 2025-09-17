import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import FloatingAIInterface from "@/components/content/FloatingAIInterface";
import { 
  ArrowLeft,
  ExternalLink, 
  Clock, 
  User,
  TrendingUp,
  TrendingDown,
  Youtube,
  FileText,
  Twitter,
  Mail,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ContentItem = Database['public']['Tables']['content_items']['Row'] & {
  source?: string;
  tags?: string[];
  sentiment?: "bullish" | "bearish" | "neutral";
};

const platformIcons = {
  youtube: Youtube,
  substack: FileText,
  twitter: Twitter,
  email: Mail,
  reddit: FileText,
};

const platformColors = {
  youtube: "bg-red-500",
  substack: "bg-orange-500",
  twitter: "bg-blue-500",
  email: "bg-green-500",
  reddit: "bg-orange-600",
};

const ContentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAskAI = async (message: string): Promise<string> => {
    // Simulate AI response for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`Here's my analysis of "${content?.title}": ${message} - This is a great question about the content. Based on the summary, I can provide insights about the key themes and implications discussed in this piece.`);
      }, 1500);
    });
  };

  const handleVideoOverview = () => {
    toast.success("Generating video overview...");
    // TODO: Implement video overview generation
  };

  const handleAudioOverview = () => {
    toast.success("Generating audio overview...");
    // TODO: Implement audio overview (text-to-speech)
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
            full_content: "This comprehensive analysis explores the groundbreaking Bitcoin ETF approval and its far-reaching implications for cryptocurrency markets. The approval represents a watershed moment for institutional adoption, potentially opening the floodgates for traditional financial institutions to gain exposure to Bitcoin.\n\nKey points covered:\n\n1. Regulatory Breakthrough: The ETF approval signals a significant shift in regulatory sentiment toward cryptocurrencies, providing legitimacy and regulatory clarity that institutional investors have long sought.\n\n2. Institutional Inflows: Conservative estimates suggest $100B+ in potential inflows over the next 2-3 years as pension funds, endowments, and other institutional players gain easy access to Bitcoin exposure.\n\n3. Market Structure Impact: The ETF will likely reduce Bitcoin's volatility over time as institutional money tends to be less reactive and more strategic in nature.\n\n4. Price Implications: Historical analysis of commodity and equity ETF launches suggests significant price appreciation in the underlying asset, with Bitcoin potentially reaching new all-time highs.\n\n5. Ecosystem Effects: The approval will likely accelerate development across the entire crypto ecosystem, from infrastructure to DeFi protocols.\n\nThis represents just the beginning of crypto's institutional adoption phase, with more products and services likely to follow."
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
            full_content: "The Federal Reserve's latest policy announcement provides crucial insights into the central bank's thinking as it navigates complex economic conditions in 2024.\n\nKey Takeaways:\n\n1. Interest Rate Decision: The Fed maintained the federal funds rate at current levels, citing mixed economic signals and the need for more data before making significant policy changes.\n\n2. Inflation Outlook: While core inflation has shown signs of cooling, the Fed remains cautious about declaring victory, particularly given recent upticks in services inflation.\n\n3. Employment Considerations: The labor market continues to show resilience, but there are emerging signs of cooling that suggest a more balanced supply-demand dynamic.\n\n4. Market Implications: The decision to hold rates steady was largely expected by markets, but the accompanying statement and press conference provided important forward guidance.\n\n5. 2024 Outlook: The Fed signaled a data-dependent approach for the remainder of 2024, with potential rate cuts contingent on continued progress on inflation and labor market normalization.\n\nThis balanced approach reflects the Fed's commitment to its dual mandate while acknowledging the complexity of current economic conditions."
          },
          {
            id: "mock-3",
            title: "AI Bubble or Sustainable Growth? Tech Earnings Deep Dive",
            source: "The Acquirer's Multiple",
            platform: "substack",
            author: "Tobias Carlisle",
            created_at: new Date().toISOString(),
            summary: "Comprehensive analysis of recent tech earnings with focus on AI companies. Examines valuation multiples, revenue growth sustainability, and potential market corrections.",
            tags: ["AI", "Tech Stocks", "Valuations", "Earnings"],
            sentiment: "bearish" as const,
            original_url: "https://substack.com/example2",
            full_content: "Recent tech earnings have raised important questions about whether we're witnessing sustainable growth or an AI-driven bubble reminiscent of the dot-com era.\n\nAnalysis Framework:\n\n1. Valuation Metrics: Current P/E ratios for AI-focused companies are averaging 45x forward earnings, significantly above historical tech sector averages of 25x.\n\n2. Revenue Quality: While top-line growth appears impressive at 40%+ for leading AI companies, much of this is driven by one-time implementation contracts rather than recurring revenue.\n\n3. Competitive Moats: The sustainability of current AI leaders' advantages is questionable given the rapid pace of technological development and increasing competition.\n\n4. Capital Requirements: AI companies require massive ongoing investment in compute infrastructure, creating significant cash flow pressure despite revenue growth.\n\n5. Market Correction Risks: Historical analysis suggests that when tech valuations reach current levels, corrections of 30-50% typically follow within 18-24 months.\n\nConclusion: While AI represents a genuine technological breakthrough, current valuations appear to discount overly optimistic scenarios. Investors should prepare for potential volatility and focus on companies with sustainable competitive advantages and reasonable valuations."
          },
          {
            id: "mock-4",
            title: "Solana Ecosystem Update: DeFi TVL Reaches New Highs",
            source: "Bankless",
            platform: "youtube",
            author: "Ryan Sean Adams",
            created_at: new Date().toISOString(),
            summary: "Overview of Solana's recent ecosystem growth, including DeFi protocols, NFT marketplaces, and developer activity. Analysis of SOL token performance and network metrics.",
            tags: ["Solana", "DeFi", "TVL", "Ecosystem"],
            sentiment: "bullish" as const,
            original_url: "https://youtube.com/watch?v=example2",
            full_content: "Solana's ecosystem has reached several significant milestones, establishing itself as a major player in the DeFi landscape.\n\nEcosystem Highlights:\n\n1. TVL Growth: Total Value Locked across Solana DeFi protocols has surpassed $2B, representing 300% growth year-over-year.\n\n2. Protocol Development: Key protocols like Jupiter (DEX aggregator), Drift (perpetuals), and Marinade (liquid staking) are driving innovation and user adoption.\n\n3. Network Performance: Solana continues to process 2,000+ TPS with sub-second finality, maintaining its performance advantage over competitors.\n\n4. Developer Activity: GitHub commits and new project launches indicate healthy ecosystem development, with 500+ active projects.\n\n5. NFT Marketplace: Solana-based NFT trading volume has recovered significantly, with platforms like Magic Eden showing strong user engagement.\n\n6. Mobile Integration: The Solana Mobile Stack and Saga phone represent innovative approaches to crypto adoption.\n\nChallenges and Opportunities: While network stability has improved significantly, continued focus on validator decentralization and ecosystem sustainability will be crucial for long-term success.\n\nThe combination of technical capabilities, developer-friendly environment, and growing DeFi ecosystem positions Solana well for continued growth in the multi-chain future."
          },
          {
            id: "mock-5",
            title: "Weekly Market Recap: Volatility Returns to Equity Markets",
            source: "Newsletter",
            platform: "email",
            author: "The Kobeissi Letter",
            created_at: new Date().toISOString(),
            summary: "Weekly roundup of market movements, key economic data releases, and sector performance. Focus on increased volatility patterns and potential catalysts for next week.",
            tags: ["Market Recap", "Volatility", "Equities", "Economic Data"],
            sentiment: "neutral" as const,
            original_url: "https://newsletter.com/example",
            full_content: "This week marked a return of volatility to equity markets as investors grappled with mixed economic signals and geopolitical uncertainties.\n\nWeek in Review:\n\n1. Market Performance: The S&P 500 experienced a 3.2% intraday range, its highest single-week volatility in two months. Technology stocks led the decline with a 4.1% drop.\n\n2. Economic Data: Key releases included:\n   - CPI: 3.2% year-over-year (vs. 3.1% expected)\n   - Initial Jobless Claims: 240K (vs. 230K expected)\n   - Retail Sales: +0.6% month-over-month (vs. +0.4% expected)\n\n3. Sector Rotation: Notable outperformance in defensive sectors (utilities +2.1%, consumer staples +1.8%) while growth sectors underperformed.\n\n4. Bond Market: The 10-year Treasury yield touched 4.35%, its highest level in three weeks, reflecting concerns about inflation persistence.\n\n5. Currency Movements: The dollar index strengthened 1.2% as higher yields and economic resilience supported the greenback.\n\nLooking Ahead: Next week's focus will be on:\n- Fed speakers' commentary on recent data\n- Q4 earnings season kickoff\n- Geopolitical developments\n\nThe return of volatility suggests markets are entering a more uncertain phase, requiring careful risk management and tactical positioning."
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
  const platformColor = platformColors[content.platform as keyof typeof platformColors] || "bg-gray-500";

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "text-success border-success/20 bg-success/10";
      case "bearish":
        return "text-destructive border-destructive/20 bg-destructive/10";
      default:
        return "text-muted-foreground border-border bg-muted/50";
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-4 w-4" />;
      case "bearish":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-2">
            {content.original_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={content.original_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </a>
              </Button>
            )}
          </div>
        </div>

        <Card className="border-card-border shadow-card">
          <CardHeader className="space-y-4">
            {/* Platform and metadata */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg ${platformColor} flex items-center justify-center`}>
                  <PlatformIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-semibold text-foreground capitalize">{content.source || content.platform}</span>
                    {content.sentiment && (
                      <Badge variant="outline" className={getSentimentColor(content.sentiment)}>
                        {getSentimentIcon(content.sentiment)}
                        <span className="ml-1 capitalize">{content.sentiment}</span>
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{content.author || "Unknown Author"}</span>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(content.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <CardTitle className="text-2xl leading-tight">
              {content.title}
            </CardTitle>

            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <Separator />
            
            {/* Summary */}
            {content.summary && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <CardDescription className="text-base leading-relaxed">
                  {content.summary}
                </CardDescription>
              </div>
            )}

            {/* Full Content */}
            {content.full_content && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Full Content</h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {content.full_content}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Floating AI Interface */}
      <FloatingAIInterface
        contentTitle={content.title}
        contentSummary={content.summary || ""}
        onAskAI={handleAskAI}
        onVideoOverview={handleVideoOverview}
        onAudioOverview={handleAudioOverview}
      />
    </div>
  );
};

export default ContentDetail;