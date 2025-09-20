import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ExternalLink, 
  Clock, 
  User,
  Play,
  FileText,
  MessageCircle,
  Mail,
  FolderPlus,
  Move
} from "lucide-react";

interface Folder {
  id: string;
  name: string;
  color: string;
}

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
  folders?: Folder[];
  onMoveToFolder?: (contentId: string, folderId: string | null) => void;
  folderName?: string;
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
  onClick,
  folders = [],
  onMoveToFolder,
  folderName
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
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${platformColor} flex items-center justify-center`}>
              <PlatformIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-foreground capitalize">{source}</span>
                {folderName && (
                  <Badge variant="outline" className="text-xs">
                    {folderName}
                  </Badge>
                )}
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
          
          <div className="flex items-center space-x-1">
            {id && onMoveToFolder && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg z-[9999]"
                  style={{ 
                    backgroundColor: '#ffffff',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {folderName && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (id?.startsWith('mock-')) {
                          alert('This is sample content and cannot be moved to folders.');
                          return;
                        }
                        if (window.confirm(`Remove this content from "${folderName}" folder?`)) {
                          onMoveToFolder(id, null);
                        }
                      }}
                      className="hover:bg-blue-50 hover:text-blue-600 cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Remove from {folderName}
                    </DropdownMenuItem>
                  )}
                  {folders.length > 0 ? (
                    folders.map((folder) => (
                      <DropdownMenuItem 
                        key={folder.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (id?.startsWith('mock-')) {
                            alert('This is sample content and cannot be moved to folders.');
                            return;
                          }
                          onMoveToFolder(id, folder.id);
                        }}
                        className="hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                      >
                        <Move className="h-4 w-4 mr-2" />
                        Move to {folder.name}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No folders available. Create a folder first.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {originalUrl && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={originalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
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