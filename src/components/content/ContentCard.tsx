import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Clock, 
  User,
  Youtube,
  FileText,
  Twitter,
  Mail
} from "lucide-react";

interface ContentCardProps {
  id?: string;
  title: string;
  source: string;
  platform: "youtube" | "substack" | "twitter" | "email" | "reddit";
  author: string;
  timestamp: string;
  summary: string;
  tags: string[];
  originalUrl?: string;
  onClick?: () => void;
}

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

const ContentCard = ({
  id,
  title,
  source,
  platform,
  author,
  timestamp,
  summary,
  tags,
  originalUrl,
  onClick
}: ContentCardProps) => {
  const PlatformIcon = platformIcons[platform];
  const platformColor = platformColors[platform];


  return (
    <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer" onClick={onClick}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${platformColor} flex items-center justify-center`}>
              <PlatformIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground capitalize">{source}</span>
              </div>
              <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{author}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{timestamp}</span>
              </div>
            </div>
          </div>
          {originalUrl && (
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
        
        <CardTitle className="text-lg leading-tight group-hover:text-accent transition-colors duration-200">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">
          {summary}
        </CardDescription>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 4} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentCard;