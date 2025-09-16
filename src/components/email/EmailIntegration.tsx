import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface EmailIntegrationProps {
  onEmailsProcessed?: (emails: any[]) => void;
}

const EmailIntegration = ({ onEmailsProcessed }: EmailIntegrationProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGmailConnect = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would use Google OAuth
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectedAccounts(prev => [...prev, 'gmail']);
      
      toast({
        title: "Success",
        description: "Gmail account connected successfully! Your research emails will be automatically processed.",
      });

      // Simulate processing some emails
      const mockEmails = [
        {
          subject: "Weekly Crypto Research - Bitcoin ETF Updates",
          sender: "research@defiant.io",
          processed: true,
          tags: ["crypto", "bitcoin", "ETF"]
        },
        {
          subject: "Market Analysis: Fed Policy Impact",
          sender: "insights@realvision.com",
          processed: true,
          tags: ["macro", "fed", "policy"]
        }
      ];

      onEmailsProcessed?.(mockEmails);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Gmail account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOutlookConnect = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would use Microsoft OAuth
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setConnectedAccounts(prev => [...prev, 'outlook']);
      
      toast({
        title: "Success",
        description: "Outlook account connected successfully!",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Outlook account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Connect your email accounts to automatically extract and summarize research newsletters, 
            reports, and financial analysis from your inbox.
          </div>

          <div className="grid gap-4">
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
                <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailIntegration;