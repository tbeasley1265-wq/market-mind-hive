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
  Move,
  Mail,
  Search
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
  const [isSyncingGmail, setIsSyncingGmail] = useState(false);

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
      // Fetch content items - REMOVE the influencer_sources join that's breaking old content
      const { data: contentData, error: contentError } = await supabase
        .from('content_items')
        .select('*, folders(name, color)')  // REMOVED influencer_sources join
        .eq('user_id', user.id)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (contentError) throw contentError;

      // Fetch email items
      const { data: emailData, error: emailError } = await supabase
        .from('email_items' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('received_at', { ascending: false })
        .limit(50);

      if (emailError) throw emailError;

      // Transform email items to match content item structure
      const transformedEmails = (emailData || []).map((email: any) => ({
        id: email.id,
        user_id: email.user_id,
        title: email.subject,
        content_type: 'email',
        platform: 'gmail',
        author: email.from_address,
        summary: email.snippet || email.full_content?.substring(0, 200),
        metadata: {
          category: email.category,
          emailId: email.email_id
        },
        original_url: null,
        is_bookmarked: false,
        created_at: email.received_at,
        published_at: email.received_at,
        folder_id: null,
        folders: null
      }));

      // Combine and sort by date
      const combinedContent = [...(contentData || []), ...transformedEmails].sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return dateB - dateA;
      });

      if (isMountedRef.current) {
        setContentItems(combinedContent);
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

  // New function to trigger content aggregation
  const triggerContentSync = async () => {
    if (!user) return;
    
    setIsSyncing(true);
    
    try {
      console.log('Starting content aggregation...');
      
      // Call the content-aggregator Edge Function
      const { data, error } = await supabase.functions.invoke('content-aggregator', {
        body: {}
      });
      
      if (error) {
        console.error('Content aggregation error:', error);
        toast({
          title: "Sync Error",
          description: error.message || "Failed to sync content",
          variant: "destructive"
        });
      } else {
        console.log('Content aggregation results:', data);
        
        if (data?.processedCount > 0) {
          console.log(`✅ Synced ${data.processedCount} new items`);
          toast({
            title: "Sync Complete",
            description: `Successfully synced ${data.processedCount} new items`,
          });
        } else {
          console.log('No new content found');
          toast({
            title: "Sync Complete",
            description: "No new content found",
          });
        }
        
        if (data?.errors && data.errors.length > 0) {
          console.warn('Some sources had errors:', data.errors);
        }
        
        // Wait a moment for the database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now fetch the updated content to display it
        await fetchContentItems({ showSyncIndicator: false });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch content items from database and subscribe for updates
  useEffect(() => {
    if (!user) return;

    fetchContentItems();

    // Check if we're returning from Gmail OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail_sync') === 'true') {
      // Remove the query param
      window.history.replaceState({}, '', '/dashboard');
      
      // Auto-trigger Gmail sync after OAuth approval
      setTimeout(async () => {
        console.log('Auto-syncing Gmail after OAuth approval...');
        setIsSyncingGmail(true);
        try {
          // Get the current session token
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.access_token) {
            throw new Error('No session token found');
          }

          const { data, error } = await supabase.functions.invoke('fetch-gmail-emails', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            }
          });

          if (error) throw error;

          if (data?.success) {
            toast({
              title: "Gmail Sync Complete",
              description: `Successfully synced ${data.count} emails`,
            });
            await fetchContentItems();
          }
        } catch (error: any) {
          console.error('Gmail sync error:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to sync Gmail",
            variant: "destructive"
          });
        } finally {
          setIsSyncingGmail(false);
        }
      }, 1000);
    }

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

  // Google icon component
  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  // Sync Gmail emails
  const handleSyncGmail = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in to sync Gmail",
        variant: "destructive"
      });
      return;
    }
    
    setIsSyncingGmail(true);
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No session token found');
      }

      // First, try to fetch emails with the session token
      const { data, error } = await supabase.functions.invoke('fetch-gmail-emails', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      // If we get a token error, trigger OAuth with Gmail scope
      if (error || (data?.error && data.error.includes('access token'))) {
        console.log('Gmail permissions needed, triggering OAuth...');
        
        // Trigger Google OAuth with Gmail scope
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'email profile https://www.googleapis.com/auth/gmail.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            },
            redirectTo: `${window.location.origin}/dashboard?gmail_sync=true`
          }
        });

        if (oauthError) {
          throw oauthError;
        }
        
        // OAuth will redirect, so we don't need to do anything else here
        toast({
          title: "Gmail Permissions Required",
          description: "Please approve Gmail access in the popup window",
        });
        setIsSyncingGmail(false);
        return;
      }

      if (data?.success) {
        toast({
          title: "Gmail Search Complete",
          description: `Found ${data.count} financial emails`,
        });

        // Refresh content list
        await fetchContentItems();
      }
    } catch (error: any) {
      console.error('Error syncing Gmail:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to search Gmail. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSyncingGmail(false);
    }
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
    platform: item.content_type as 'youtube' | 'substack' | 'email' | 'twitter' | 'reddit' | 'gmail',
    author: item.author || 'Unknown',
    timestamp: new Date(item.created_at).toLocaleString(),
    summary: item.summary || '',
    tags: item.metadata?.tags || [],
    originalUrl: item.original_url,
    isBookmarked: item.is_bookmarked,
    folderId: item.folder_id,
    folderName: item.folders?.name,
    folderColor: item.folders?.color,
    emailCategory: item.metadata?.category // For Gmail emails
  }));

  // Filter by folder first, then by content type
  const folderFilteredContent = selectedFolderId 
    ? allContent.filter(content => content.folderId === selectedFolderId)
    : allContent;

  const filteredContent = folderFilteredContent.filter(content => {
    if (activeFilter === "all") return true;
    
    if (activeFilter === "gmail") {
      return content.platform === 'gmail';
    }
    
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
    { key: "gmail", label: "Gmail", count: folderFilteredContent.filter(c => c.platform === 'gmail').length },
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
                onClick={handleSyncGmail}
                disabled={isSyncingGmail}
              >
                <GoogleIcon />
                <span className="ml-2">{isSyncingGmail ? 'Searching...' : 'Gmail Search'}</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={triggerContentSync}
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
