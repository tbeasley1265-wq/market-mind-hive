import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus,
  TrendingUp,
  Upload,
  FolderPlus,
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Move
} from "lucide-react";
import ContentCard from "@/components/content/ContentCard";
import DocumentUpload from "@/components/content/DocumentUpload";
import EmailIntegrationModal from "@/components/email/EmailIntegrationModal";
import VideoProcessor from "@/components/content/VideoProcessor";
import UploadSourcesModal from "@/components/content/UploadSourcesModal";
import { FolderModal } from "@/components/content/FolderModal";
import { FolderSidebar } from "@/components/content/FolderSidebar";
import Header from "@/components/layout/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showVideoProcessor, setShowVideoProcessor] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showUploadSourcesModal, setShowUploadSourcesModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { folders, createFolder, updateFolder, deleteFolder, moveContentToFolder } = useFolders();

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
          .select('*, folders(name, color)')
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

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setShowFolderModal(true);
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder);
    setShowFolderModal(true);
  };

  const handleSaveFolder = async (name: string, color: string) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, { name, color });
    } else {
      await createFolder(name, color);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder? Content inside will be moved to "All Content".')) {
      await deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
      }
    }
  };

  const handleMoveToFolder = async (contentId: string, folderId: string | null) => {
    await moveContentToFolder(contentId, folderId);
    // Refresh content items to reflect the change
    const { data } = await supabase
      .from('content_items')
      .select('*, folders(name, color)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setContentItems(data || []);
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
    },
    {
      id: "mock-4",
      title: "Solana DeFi Ecosystem Update: TVL Hits All-Time High",
      source: "DeFi Pulse",
      platform: "twitter" as const,
      author: "DeFi Analyst",
      timestamp: "8 hours ago",
      summary: "Solana's DeFi ecosystem has reached a new milestone with $2.5B TVL. Key drivers include Jupiter's growth, new DEX launches, and improved network stability after recent upgrades.",
      tags: ["Solana", "DeFi", "TVL", "Crypto"],
      originalUrl: "https://twitter.com/example",
      isBookmarked: true
    },
    {
      id: "mock-5",
      title: "OpenAI GPT-5 Development Updates: What We Know So Far",
      source: "AI Research Weekly",
      platform: "email" as const,
      author: "Sarah Chen",
      timestamp: "12 hours ago",
      summary: "Latest insights into GPT-5 development timeline, expected capabilities, and potential market impact. Includes analysis of computational requirements and competitive landscape.",
      tags: ["AI", "OpenAI", "GPT-5", "Tech Stocks"],
      originalUrl: "https://example.com/newsletter",
      isBookmarked: false
    },
    {
      id: "mock-6",
      title: "Inflation Data Surprises Markets: What's Next for Bonds?",
      source: "Bond Vigilantes",
      platform: "substack" as const,
      author: "Michael Grant",
      timestamp: "1 day ago",
      summary: "Unexpected inflation reading sends shockwaves through bond markets. Analysis of yield curve implications, Fed response scenarios, and portfolio positioning strategies.",
      tags: ["Inflation", "Bonds", "Fed", "Monetary Policy"],
      originalUrl: "https://substack.com/bonds",
      isBookmarked: false
    },
    {
      id: "mock-7",
      title: "Tesla's FSD Beta Performance Analysis",
      source: "Autonomous World",
      platform: "youtube" as const,
      author: "Tech Reviewer Pro",
      timestamp: "1 day ago",
      summary: "Comprehensive testing of Tesla's latest FSD beta version across various scenarios. Data-driven analysis of improvements, limitations, and competitive positioning against Waymo.",
      tags: ["Tesla", "AI", "Autonomous", "Tech Stocks"],
      originalUrl: "https://youtube.com/tesla-fsd",
      isBookmarked: true
    },
    {
      id: "mock-8",
      title: "European Energy Crisis: Investment Opportunities in Renewables",
      source: "Energy Transition Weekly",
      platform: "email" as const,
      author: "Elena Rodriguez",
      timestamp: "2 days ago",
      summary: "Deep dive into European energy markets and the accelerated transition to renewables. Identifies key investment themes and companies positioned to benefit from policy changes.",
      tags: ["Energy", "Renewables", "Europe", "ESG"],
      originalUrl: "https://example.com/energy",
      isBookmarked: false
    },
    {
      id: "mock-9",
      title: "Nvidia's Data Center Revenue Projections",
      source: "Semiconductor Insights",
      platform: "substack" as const,
      author: "Chip Analysis Team",
      timestamp: "2 days ago",
      summary: "Analysis of Nvidia's data center segment growth trajectory. Examines AI chip demand, competitive threats, and margin sustainability in the enterprise market.",
      tags: ["Nvidia", "AI", "Semiconductors", "Tech Stocks"],
      originalUrl: "https://substack.com/nvidia",
      isBookmarked: false
    },
    {
      id: "mock-10",
      title: "China's Property Market Stabilization Efforts",
      source: "Asia Markets Today",
      platform: "twitter" as const,
      author: "Beijing Correspondent",
      timestamp: "3 days ago",
      summary: "Latest government interventions in China's property sector show signs of stabilization. Impact on commodities, global growth, and emerging market currencies analyzed.",
      tags: ["China", "Real Estate", "Emerging Markets", "Commodities"],
      originalUrl: "https://twitter.com/china-property",
      isBookmarked: false
    }
  ];

  // Combine content items and mock content
  const allContent = [
    ...contentItems.map(item => ({
      id: item.id,
      title: item.title,
      source: item.platform,
      platform: item.content_type as 'youtube' | 'substack' | 'email' | 'twitter' | 'reddit',
      author: item.author || 'Unknown',
      timestamp: new Date(item.created_at).toLocaleString(),
      summary: item.summary || '',
      tags: item.metadata?.tags || [],
      originalUrl: item.original_url,
      isBookmarked: item.is_bookmarked,
      folderId: item.folder_id,
      folderName: item.folders?.name,
      folderColor: item.folders?.color
    })),
    ...mockContent.map(item => ({
      ...item,
      folderId: null,
      folderName: null,
      folderColor: null
    }))
  ];

  // Filter by folder first, then by content type
  const folderFilteredContent = selectedFolderId 
    ? allContent.filter(content => content.folderId === selectedFolderId)
    : allContent;

  const filteredContent = folderFilteredContent.filter(content => {
    if (activeFilter === "all") return true;
    
    const filterMap: Record<string, string[]> = {
      crypto: ["Bitcoin", "Crypto", "DeFi", "Solana", "ETF"],
      macro: ["Fed", "Interest Rates", "Monetary Policy", "Inflation"],
      tech: ["AI", "Tech Stocks", "Valuations", "Earnings"],
      bookmarked: []
    };
    
    if (activeFilter === "bookmarked") {
      return content.isBookmarked;
    }
    
    return content.tags.some((tag: string) => 
      filterMap[activeFilter]?.includes(tag)
    );
  });

  // Create folder items with content counts
  const folderItems = folders.map(folder => ({
    id: folder.id,
    name: folder.name,
    color: folder.color,
    itemCount: allContent.filter(item => item.folderId === folder.id).length
  }));

  const filters = [
    { key: "all", label: "All Content", count: folderFilteredContent.length },
    { key: "crypto", label: "Crypto", count: folderFilteredContent.filter(c => c.tags.some((t: string) => ["Bitcoin", "Crypto", "DeFi", "Solana", "ETF"].includes(t))).length },
    { key: "macro", label: "Macro", count: folderFilteredContent.filter(c => c.tags.some((t: string) => ["Fed", "Interest Rates", "Monetary Policy", "Inflation"].includes(t))).length },
    { key: "tech", label: "Tech", count: folderFilteredContent.filter(c => c.tags.some((t: string) => ["AI", "Tech Stocks", "Valuations", "Earnings"].includes(t))).length },
    { key: "bookmarked", label: "Saved", count: folderFilteredContent.filter(c => c.isBookmarked).length }
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
      
      <div className="flex">
        {/* Folder Sidebar */}
        <FolderSidebar
          folders={folderItems}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={handleCreateFolder}
          onEditFolder={handleEditFolder}
          onDeleteFolder={handleDeleteFolder}
        />
        
        {/* Main Content */}
        <main className="flex-1 px-6 py-8 space-y-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {selectedFolderId 
                  ? folderItems.find(f => f.id === selectedFolderId)?.name || 'Folder' 
                  : 'Research Hub'
                }
              </h1>
              <p className="text-muted-foreground">
                {selectedFolderId 
                  ? `Organize and manage your research content`
                  : 'Your curated financial intelligence dashboard'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateFolder}
              >
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowUploadSourcesModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/sources')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sources
              </Button>
            </div>
          </div>

          {/* Filters and View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
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
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="space-y-6">
            {filteredContent.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">
                    {selectedFolderId ? 'No content in this folder' : 'No content yet'}
                  </p>
                  <p>
                    {selectedFolderId 
                      ? 'Drag content here or use the move button to organize your research'
                      : 'Upload documents, connect email, or add sources to get started'
                    }
                  </p>
                </div>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-6 lg:grid-cols-2' : 'space-y-4'}>
                {filteredContent.map((content, index) => (
                  <div key={content.id || index} className="group relative">
                    <ContentCard 
                      id={content.id}
                      {...content} 
                      onClick={() => content.id && handleContentClick(content.id)}
                    />
                    
                    {/* Move to Folder Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="secondary" className="h-7 w-7 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => content.id && handleMoveToFolder(content.id, null)}>
                            <Move className="h-4 w-4 mr-2" />
                            Move to All Content
                          </DropdownMenuItem>
                          {folders.map((folder) => (
                            <DropdownMenuItem 
                              key={folder.id}
                              onClick={() => content.id && handleMoveToFolder(content.id, folder.id)}
                            >
                              <Move className="h-4 w-4 mr-2" />
                              Move to {folder.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSave={handleSaveFolder}
        folder={editingFolder}
      />
      
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