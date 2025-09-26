import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { useFolders } from "@/hooks/useFolders";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { toast } = useToast();
  const { folders, createFolder, updateFolder, deleteFolder, moveContentToFolder } = useFolders();
  const isMountedRef = useRef(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchContentItems = useCallback(async (options?: { showSyncIndicator?: boolean }) => {
    if (!user) return;

    if (options?.showSyncIndicator && isMountedRef.current) {
      setIsSyncing(true);
    }

    try {
      const { data, error } = await supabase
        .from('content_items')
        .select('*, folders(name, color)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (isMountedRef.current) {
        setContentItems(data || []);
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (options?.showSyncIndicator) {
          setIsSyncing(false);
        }
      }
    }
  }, [user]);

  // Fetch content items from database and subscribe for updates
  useEffect(() => {
    if (!user) return;

    fetchContentItems();

    const channel = supabase
      .channel(`content-items-dashboard-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'content_items',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchContentItems({ showSyncIndicator: true });
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      fetchContentItems({ showSyncIndicator: true });
    }, 120000);

    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [user, fetchContentItems]);

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

  const handleSaveFolder = async (name: string) => {
    if (editingFolder) {
      await updateFolder(editingFolder.id, { name });
    } else {
      await createFolder(name);
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
    await fetchContentItems();
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

      await fetchContentItems();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "Error",
        description: "Failed to save content. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Use only real content from database
  const allContent = contentItems.map(item => ({
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
  }));

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
                onClick={() => fetchContentItems({ showSyncIndicator: true })}
                disabled={isSyncing}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {isSyncing ? 'Syncing...' : 'Sync Content'}
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isSyncing ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500/80'}`} />
              <span>
                {isSyncing
                  ? 'Syncing latest research...'
                  : lastSyncTime
                    ? `Last synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
                    : 'Waiting for first sync...'}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground/80">
              Background sync runs every 2 minutes.
            </span>
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
                  <ContentCard 
                    key={content.id || index}
                    id={content.id}
                    {...content} 
                    onClick={() => content.id && handleContentClick(content.id)}
                    folders={folders}
                    onMoveToFolder={handleMoveToFolder}
                    folderName={content.folderName}
                  />
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