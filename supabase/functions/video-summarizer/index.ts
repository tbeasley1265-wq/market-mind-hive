import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname === 'youtu.be') {
      const pathId = parsedUrl.pathname.replace(/^\//, '').split('/')[0];
      return pathId && pathId.length === 11 ? pathId : null;
    }

    if (hostname.endsWith('youtube.com')) {
      const directId = parsedUrl.searchParams.get('v');
      if (directId && directId.length === 11) {
        return directId;
      }

      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      const candidate = pathSegments.find((segment) => segment.length === 11);
      return candidate ?? null;
    }
  } catch {
    return null;
  }

  return null;
}

type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
};

type TranscriptResult = {
  title: string;
  author: string;
  transcriptText: string;
  segments: TranscriptSegment[];
};

// Utility to decode a subset of HTML entities that appear in YouTube transcripts
function decodeHtmlEntities(text: string): string {
  return text
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&nbsp;', ' ');
}

// Function to get YouTube transcript using a public transcript service
async function getYouTubeTranscript(videoId: string): Promise<TranscriptResult> {
  try {
    const transcriptResponse = await fetch(`https://youtubetranscript.com/?server_vid2=${videoId}`);

    if (!transcriptResponse.ok) {
      throw new Error(`Transcript service responded with ${transcriptResponse.status}`);
    }

    const transcriptJson = await transcriptResponse.json() as Array<{ text: string; start?: number | string; duration?: number | string }>;

    if (!Array.isArray(transcriptJson) || transcriptJson.length === 0) {
      throw new Error('Transcript not available for this video.');
    }

    const segments: TranscriptSegment[] = transcriptJson.map((segment) => ({
      text: decodeHtmlEntities(segment.text || ''),
      start: Number(segment.start ?? 0),
      duration: Number(segment.duration ?? 0),
    }));

    const transcriptText = segments
      .map((segment) => segment.text.trim())
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const metadataResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);

    if (!metadataResponse.ok) {
      throw new Error(`Metadata request failed with ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json() as { title?: string; author_name?: string };

    return {
      title: metadata.title ?? 'YouTube Video',
      author: metadata.author_name ?? 'Unknown',
      transcriptText,
      segments,
    };
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw new Error('Failed to fetch video transcript');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, summaryLength = 'standard' } = await req.json();
    
    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(authHeader);
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    let transcriptText = '';
    let author = '';
    let title = '';
    let transcriptSegments: TranscriptSegment[] = [];

    // Handle YouTube videos
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      const transcriptResult = await getYouTubeTranscript(videoId);
      transcriptText = transcriptResult.transcriptText;
      author = transcriptResult.author;
      title = transcriptResult.title;
      transcriptSegments = transcriptResult.segments;
    } else {
      throw new Error('Currently only YouTube videos are supported');
    }

    if (!transcriptText) {
      throw new Error('Transcript is empty or unavailable for this video');
    }

    const truncatedTranscriptForPrompt = transcriptText.length > 12000
      ? `${transcriptText.slice(0, 12000)}...`
      : transcriptText;

    // Determine summary length instructions
    let lengthInstruction = '';
    switch (summaryLength) {
      case 'brief':
        lengthInstruction = 'Keep the summary very brief (2-3 sentences).';
        break;
      case 'detailed':
        lengthInstruction = 'Provide a detailed summary with key insights, quotes, and timestamps if available (4-6 paragraphs).';
        break;
      default:
        lengthInstruction = 'Provide a comprehensive but concise summary (2-3 paragraphs).';
        break;
    }

    // Generate AI summary
    const summaryPrompt = `
    ${lengthInstruction}

      Analyze this video transcript and provide:
      1. A summary of the main points discussed
      2. Key financial insights and takeaways
      3. Mentioned assets, companies, or important figures
      4. Investment implications or market outlook
      5. Overall sentiment (bullish/bearish/neutral)
      6. Notable quotes or key statements

      Transcript: ${truncatedTranscriptForPrompt}
      `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst specializing in video content analysis. Focus on extracting actionable market insights and investment implications from video content.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    // Generate tags and sentiment
    const tagPrompt = `Based on this video summary, extract relevant tags (max 6) and determine sentiment:
    
    ${summary}
    
    Return a JSON object with:
    - tags: array of relevant financial/market tags
    - sentiment: "bullish", "bearish", or "neutral"
    `;

    const tagResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial content tagger. Return only valid JSON.'
          },
          {
            role: 'user',
            content: tagPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    let tags = ['video'];
    let sentiment = 'neutral';

    if (tagResponse.ok) {
      try {
        const tagData = await tagResponse.json();
        const extracted = JSON.parse(tagData.choices[0].message.content);
        tags = [...tags, ...(extracted.tags || [])];
        sentiment = extracted.sentiment || 'neutral';
      } catch (e) {
        console.error('Error parsing tags:', e);
      }
    }

    // Save to database
    const { data: savedContent, error } = await supabaseClient
      .from('content_items')
      .insert({
        user_id: user.id,
        title,
        content_type: 'video',
        original_url: videoUrl,
        author,
        platform: 'youtube',
        summary,
        full_content: transcriptText,
        metadata: {
          tags,
          sentiment,
          processed_at: new Date().toISOString(),
          summary_length: summaryLength,
          video_id: extractVideoId(videoUrl),
          transcript_source: 'youtubetranscript.com',
          transcript_segments_preview: transcriptSegments.slice(0, 50)
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        id: savedContent.id,
        title,
        author,
        summary,
        tags,
        sentiment,
        videoUrl,
        processed: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in video-summarizer function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});