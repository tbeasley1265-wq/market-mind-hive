import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Clock, 
  User,
  Play,
  FileText,
  MessageCircle,
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
  youtube: Play,
  substack: FileText,
  twitter: MessageCircle,
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
  // Ensure platform is valid
  const validPlatform = platform || 'substack';
  const PlatformIcon = platformIcons[validPlatform] || FileText;
  const platformColor = platformColors[validPlatform] || "bg-gray-500";

  // Additional safety check
  if (!PlatformIcon) {
    console.error('PlatformIcon is undefined for platform:', validPlatform);
    return <div>Error loading content card</div>;
  }


  return (
    <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300 group cursor-pointer" onClick={onClick}>
      <CardContent className="space-y-4">
        
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