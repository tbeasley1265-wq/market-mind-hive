import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Youtube, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

import type { VideoProcessingResponse } from "@/types/content";

interface VideoProcessorProps {
  onContentProcessed?: (content: VideoProcessingResponse) => void;
}

const VideoProcessor = ({ onContentProcessed }: VideoProcessorProps) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [summaryLength, setSummaryLength] = useState('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedContent, setProcessedContent] = useState<VideoProcessingResponse | null>(null);
  const { toast } = useToast();

  const handleProcessVideo = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }

    if (!(videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
      toast({
        title: "Error",
        description: "Currently only YouTube videos are supported",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke<VideoProcessingResponse>('video-summarizer', {
        body: {
          videoUrl,
          summaryLength
        }
      });

      if (error) throw error;

      if (data) {
        setProcessedContent(data);
        onContentProcessed?.(data);
      }
      
      toast({
        title: "Success",
        description: "Video has been processed and summarized!",
      });

      setVideoUrl('');

    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        title: "Error",
        description: "Failed to process video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Video Processor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Video URL</label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Summary Length</label>
            <Select value={summaryLength} onValueChange={setSummaryLength} disabled={isProcessing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief (2-3 sentences)</SelectItem>
                <SelectItem value="standard">Standard (2-3 paragraphs)</SelectItem>
                <SelectItem value="detailed">Detailed (4-6 paragraphs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleProcessVideo} 
            disabled={!videoUrl.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Video...
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4 mr-2" />
                Process Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {processedContent && (
        <Card className="border-success">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-success" />
              <h3 className="font-semibold text-success">Video Processed Successfully</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Title:</strong> {processedContent.title}</p>
              <p><strong>Author:</strong> {processedContent.author}</p>
              <p><strong>Tags:</strong> {processedContent.tags?.join(', ')}</p>
              <p><strong>Sentiment:</strong> <span className="capitalize">{processedContent.sentiment}</span></p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoProcessor;