import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Function to get YouTube transcript using YouTube Transcript API
async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Using youtube-transcript-api (you might need to implement this differently)
    // For now, we'll simulate getting transcript from video description or use a mock
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract title and description from the HTML
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/);
    const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
    
    const title = titleMatch ? titleMatch[1] : 'Unknown Title';
    const description = descMatch ? descMatch[1] : '';
    
    // In a real implementation, you'd use the YouTube API or a transcript service
    return `Title: ${title}\nDescription: ${description}`;
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    throw new Error('Failed to fetch video content');
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

    let videoContent = '';
    let author = '';
    let title = '';
    
    // Handle YouTube videos
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      // Get video transcript/content
      videoContent = await getYouTubeTranscript(videoId);
      
      // Extract author from content (you might want to use YouTube API for better data)
      const channelMatch = videoContent.match(/Channel: ([^\\n]+)/);
      author = channelMatch ? channelMatch[1] : 'Unknown';
      
      const titleMatch = videoContent.match(/Title: ([^\\n]+)/);
      title = titleMatch ? titleMatch[1] : 'YouTube Video';
    } else {
      throw new Error('Currently only YouTube videos are supported');
    }

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

    Analyze this video content and provide:
    1. A summary of the main points discussed
    2. Key financial insights and takeaways
    3. Mentioned assets, companies, or important figures
    4. Investment implications or market outlook
    5. Overall sentiment (bullish/bearish/neutral)
    6. Notable quotes or key statements

    Video Content: ${videoContent}
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
        full_content: videoContent,
        metadata: {
          tags,
          sentiment,
          processed_at: new Date().toISOString(),
          summary_length: summaryLength,
          video_id: extractVideoId(videoUrl)
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});