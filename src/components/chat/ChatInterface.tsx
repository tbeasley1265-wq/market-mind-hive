import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  contentId?: string;
  contentTitle?: string;
  onClose?: () => void;
}

const ChatInterface = ({ contentId, contentTitle, onClose }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 300; // Max height in pixels
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // Enable internal scrolling if content exceeds max height
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResizeTextarea();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    autoResizeTextarea();
  }, [input]);

  useEffect(() => {
    // Set initial height on mount
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '60px';
    }
  }, []);

  useEffect(() => {
    if (contentId && contentTitle) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm ready to help you analyze "${contentTitle}". What would you like to know about this content?`,
        timestamp: new Date()
      }]);
    } else {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm your AI research assistant. I can help you analyze content, answer questions about financial markets, and provide insights. How can I help you today?`,
        timestamp: new Date()
      }]);
    }
  }, [contentId, contentTitle]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height after clearing input
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }, 0);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: input,
          contentId,
          conversationId
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <Card className="h-[600px] flex flex-col shadow-lg border-2">
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI Research Assistant</h3>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="mt-4">
            <div className="max-w-3xl mx-auto px-4">
              <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about the content or financial markets..."
                  className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-6 placeholder:text-gray-500 dark:placeholder:text-gray-400 py-3 px-1 outline-none resize-none overflow-y-hidden whitespace-pre-wrap"
                  style={{
                    height: 'auto',
                    minHeight: '60px',
                    maxHeight: '300px'
                  }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="rounded-full h-10 w-10 p-0 shrink-0 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 mt-1"
                  variant="ghost"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;