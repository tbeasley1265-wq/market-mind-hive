import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Calendar, Tag, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmailFilterProps {
  emails: any[];
  onFilteredEmailsChange: (emails: any[]) => void;
}

const EmailContentFilter = ({ emails, onFilteredEmailsChange }: EmailFilterProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract unique tags from all emails
  const allTags = [...new Set(emails.flatMap(email => email.tags || []))];
  
  // Get sentiment counts
  const sentimentCounts = {
    bullish: emails.filter(e => e.sentiment === 'bullish').length,
    bearish: emails.filter(e => e.sentiment === 'bearish').length,
    neutral: emails.filter(e => e.sentiment === 'neutral').length,
  };

  const filterEmails = () => {
    let filtered = [...emails];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(email => 
        email.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.author?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sentiment filter
    if (selectedSentiment !== "all") {
      filtered = filtered.filter(email => email.sentiment === selectedSentiment);
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(email => 
        selectedTags.some(tag => email.tags?.includes(tag))
      );
    }

    // Timeframe filter (simplified - you might want to implement proper date filtering)
    if (selectedTimeframe !== "all") {
      // This would need proper date implementation based on your timestamp format
      // For now, just showing the structure
    }

    onFilteredEmailsChange(filtered);
  };

  // Apply filters whenever any filter changes
  useEffect(() => {
    filterEmails();
  }, [searchQuery, selectedSentiment, selectedTimeframe, selectedTags, emails]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Email Content Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails by title, content, or sender..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sentiment Filter */}
        <div>
          <h4 className="text-sm font-medium mb-2">Sentiment</h4>
          <Tabs value={selectedSentiment} onValueChange={setSelectedSentiment}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({emails.length})</TabsTrigger>
              <TabsTrigger value="bullish" className="text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                Bullish ({sentimentCounts.bullish})
              </TabsTrigger>
              <TabsTrigger value="bearish" className="text-destructive">
                <TrendingDown className="h-4 w-4 mr-1" />
                Bearish ({sentimentCounts.bearish})
              </TabsTrigger>
              <TabsTrigger value="neutral">
                Neutral ({sentimentCounts.neutral})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags ({allTags.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="mt-2"
              >
                Clear tags
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {emails.length} total emails from your inbox
          </span>
          {(searchQuery || selectedSentiment !== "all" || selectedTags.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedSentiment("all");
                setSelectedTags([]);
                setSelectedTimeframe("all");
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailContentFilter;