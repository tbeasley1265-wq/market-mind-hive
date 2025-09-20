import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  MessageSquare, 
  Mail, 
  Play, 
  Settings,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowDocumentUpload: () => void;
  onShowEmailModal: () => void;
  onShowVideoProcessor: () => void;
}

const UploadSourcesModal = ({ 
  isOpen, 
  onClose, 
  onShowDocumentUpload, 
  onShowEmailModal, 
  onShowVideoProcessor 
}: UploadSourcesModalProps) => {
  const { toast } = useToast();

  const handleUploadClick = () => {
    onClose();
    onShowDocumentUpload();
  };

  const handleEmailClick = () => {
    onClose();
    onShowEmailModal();
  };

  const handleVideoClick = () => {
    onClose();
    onShowVideoProcessor();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Add sources
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sources let Research Hub base its responses on the information that matters most to you.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Examples: research reports, earnings calls, market analysis, newsletters, etc.)
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="text-accent border-accent/20 hover:bg-accent/10"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Discover sources
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Main Upload Area */}
          <div 
            className="border-2 border-dashed border-border/30 rounded-lg p-8 text-center cursor-pointer hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
            onClick={handleUploadClick}
          >
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-accent" />
            </div>
            <p className="text-base font-medium text-foreground mb-2">Upload sources</p>
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop or <span className="text-accent font-medium">choose file</span> to upload
            </p>
            <p className="text-xs text-muted-foreground">
              Supported file types: PDF, txt, Markdown, Audio (e.g. mp3)
            </p>
          </div>

          {/* Source Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover:bg-accent/5 hover:border-accent/30"
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Website link integration is in development.",
                });
              }}
            >
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-sm">Link</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover:bg-accent/5 hover:border-accent/30"
              onClick={handleVideoClick}
            >
              <Play className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">YouTube</span>
            </Button>
          </div>

          {/* Source Limit Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Source limit</span>
            </div>
            <span>0 / 50</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadSourcesModal;