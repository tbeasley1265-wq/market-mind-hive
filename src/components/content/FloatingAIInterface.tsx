import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Video, 
  Volume2, 
  MessageSquare,
  X,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingAIInterfaceProps {
  contentTitle: string;
  contentSummary: string;
  onAskAI?: (message: string) => void;
  onVideoOverview?: () => void;
  onAudioOverview?: () => void;
}

const FloatingAIInterface = ({
  contentTitle,
  contentSummary,
  onAskAI,
  onVideoOverview,
  onAudioOverview
}: FloatingAIInterfaceProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    await onAskAI?.(message);
    setMessage("");
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="mb-4 p-4 bg-background/95 backdrop-blur-md border shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">
                  AI Assistant
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant="outline"
                  className="h-12 flex items-center gap-2 hover:bg-accent/10 transition-colors"
                  onClick={onVideoOverview}
                >
                  <Video className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Video Overview</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-12 flex items-center gap-2 hover:bg-accent/10 transition-colors"
                  onClick={onAudioOverview}
                >
                  <Volume2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Audio Overview</span>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-background/95 backdrop-blur-md border shadow-lg">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-accent hover:text-accent/80"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              placeholder={`Ask about "${contentTitle.length > 30 ? contentTitle.substring(0, 30) + '...' : contentTitle}"`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-12 border-0 bg-muted/50 focus:bg-background transition-colors"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="absolute right-1 top-1 h-8 w-8 p-0 bg-accent hover:bg-accent/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FloatingAIInterface;