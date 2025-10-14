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

// Function to get YouTube video metadata (title, channel)
async function getYouTubeMetadata(videoId: string): Promise<{ title: string; author: string }> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Unknown Title';
    
    // Extract channel name from various possible locations
    let author = 'Unknown Creator';
    const channelMatch = html.match(/"author":"([^"]+)"/);
    if (channelMatch) {
      author = channelMatch[1];
    } else {
      const ownerMatch = html.match(/"ownerChannelName":"([^"]+)"/);
      if (ownerMatch) author = ownerMatch[1];
    }
    
    return { title, author };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return { title: 'Unknown Title', author: 'Unknown Creator' };
  }
}

// Function to get YouTube transcript from captions
async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // Fetch video page
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const videoPageHtml = await videoPageResponse.text();
    
    // Find caption tracks in page source
    const captionTracksMatch = videoPageHtml.match(/"captionTracks":(\[.*?\])/);
    
    if (!captionTracksMatch) {
      throw new Error('No captions available for this video');
    }
    
    const captionTracks = JSON.parse(captionTracksMatch[1]);
    
    // Get English captions or first available
    const track = captionTracks.find((t: any) => 
      t.languageCode === 'en' || t.languageCode === 'en-US'
    ) || captionTracks[0];
    
    if (!track) {
      throw new Error('No caption tracks found');
    }
    
    console.log(`Found captions in language: ${track.languageCode}`);
    
    // Fetch caption XML
    const captionResponse = await fetch(track.baseUrl);
    const captionXml = await captionResponse.text();
    
    // Parse XML to extract text
    const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textMatches
      .map(match => {
        const text = match.replace(/<text[^>]*>|<\/text>/g, '');
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      })
      .join(' ');
    
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty');
    }
    
    console.log(`Transcript length: ${transcript.length} characters`);
    return transcript;
  } catch (error) {
    console.error('Transcript fetch failed:', error);
    throw error;
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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
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
      
      console.log(`Processing YouTube video: ${videoId}`);
      
      // Get video metadata (title, author)
      const metadata = await getYouTubeMetadata(videoId);
      title = metadata.title;
      author = metadata.author;
      
      // Get video transcript
      try {
        videoContent = await getYouTubeTranscript(videoId);
        console.log(`Successfully fetched transcript for: ${title}`);
      } catch (transcriptError) {
        console.error('Failed to fetch transcript:', transcriptError);
        throw new Error('This video does not have captions available. Please try a different video or enable captions on YouTube.');
      }
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

    // Check if OpenAI API key is available
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
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
        'Authorization': `Bearer ${openAIKey}`,
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
        'Authorization': `Bearer ${openAIKey}`,
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