import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, CheckCircle, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmailIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailsProcessed?: (emails: any[]) => void;
}

const EmailIntegrationModal = ({ isOpen, onClose, onEmailsProcessed }: EmailIntegrationModalProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      checkConnectedAccounts();
      // Check for OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code && !sessionStorage.getItem('oauth_handled')) {
        sessionStorage.setItem('oauth_handled', 'true');
        handleOAuthCallback(code);
      }
    }
  }, [isOpen]);

  const checkConnectedAccounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: sources } = await supabase
        .from('content_sources')
        .select('source_type')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (sources) {
        setConnectedAccounts(sources.map(s => s.source_type));
      }
    } catch (error) {
      console.error('Error checking connected accounts:', error);
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { 
          action: 'exchange_code',
          code: code,
          userId: user.id
        }
      });

      if (error) throw error;

      setConnectedAccounts(prev => [...prev.filter(a => a !== 'gmail'), 'gmail']);
      toast({
        title: "Success",
        description: "Gmail account connected successfully! Fetching your research emails...",
      });

      // Automatically fetch emails after connection
      fetchEmails();

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect Gmail account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleGmailConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to connect your Gmail account.",
          variant: "destructive",
        });
        return;
      }

      // Clear any previous OAuth handling
      sessionStorage.removeItem('oauth_handled');

      // Get OAuth URL from edge function
      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { 
          action: 'get_oauth_url',
          redirectUri: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to initiate Gmail connection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchEmails = async () => {
    setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { 
          action: 'fetch_emails',
          userId: user.id
        }
      });

      if (error) throw error;

      if (data?.emails?.length > 0) {
        onEmailsProcessed?.(data.emails);
        toast({
          title: "Success",
          description: `Processed ${data.emails.length} research emails from your Gmail.`,
        });
        onClose();
      } else {
        toast({
          title: "No New Emails",
          description: "No new research emails found in your Gmail inbox.",
        });
      }
    } catch (error: any) {
      console.error('Email fetch error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch emails. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleOutlookConnect = async () => {
    toast({
      title: "Coming Soon",
      description: "Outlook integration is not yet implemented. Please use Gmail for now.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Connect Email Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Connect your email accounts to automatically extract and summarize research newsletters, 
            reports, and financial analysis from your inbox.
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Gmail</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Gmail account
                  </p>
                </div>
              </div>
              {connectedAccounts.includes('gmail') ? (
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                  <Button 
                    onClick={fetchEmails}
                    disabled={isFetching}
                    variant="outline"
                    size="sm"
                  >
                    {isFetching ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isFetching ? 'Fetching...' : 'Sync'}
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleGmailConnect}
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Connect
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Outlook</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect your Outlook account
                  </p>
                </div>
              </div>
              {connectedAccounts.includes('outlook') ? (
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Button 
                  onClick={handleOutlookConnect}
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Connect
                </Button>
              )}
            </div>
          </div>

          {connectedAccounts.length > 0 && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Auto-Processing Features:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic detection of financial newsletters and research reports</li>
                <li>• AI-powered summarization of email content</li>
                <li>• Smart tagging and sentiment analysis</li>
                <li>• Real-time notifications for important insights</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailIntegrationModal;