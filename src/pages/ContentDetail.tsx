import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;

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
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask AI
            </Button>
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
    </div>
  );
};

export default ContentDetail;