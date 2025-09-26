import type { Database } from "@/integrations/supabase/types";

export type ContentItemRow = Database["public"]["Tables"]["content_items"]["Row"];
export type FolderRow = Database["public"]["Tables"]["folders"]["Row"];

export interface DocumentProcessingData {
  title: string;
  summary: string;
  tags: string[];
  sentiment: string;
  source: string;
  platform: string;
  author: string;
  timestamp: string;
  originalFileName: string;
}

export interface DocumentProcessingResponse {
  success: boolean;
  data: DocumentProcessingData;
}

export interface VideoProcessingResponse {
  id: string;
  title: string;
  author: string;
  summary: string;
  tags: string[];
  sentiment: string;
  videoUrl: string;
  processed: boolean;
  success?: boolean;
}

export interface ProcessedEmailSummary {
  subject: string;
  sender: string;
  processed: boolean;
  tags: string[];
}

export type EmailContent = {
  id?: string;
  title?: string | null;
  summary?: string | null;
  author?: string | null;
  tags?: string[] | null;
  sentiment?: "bullish" | "bearish" | "neutral" | string | null;
  timestamp?: string | null;
  platform?: string | null;
};
