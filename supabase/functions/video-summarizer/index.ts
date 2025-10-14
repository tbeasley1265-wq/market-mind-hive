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

// Function to get YouTube video metadata using YouTube Data API
async function getYouTubeMetadata(videoId: string): Promise<{ title: string; author: string; publishedAt: string }> {
  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (YOUTUBE_API_KEY) {
      // Use official YouTube API if key is available
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${YOUTUBE_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const video = data.items?.[0];
        
        if (video) {
          return {
            title: video.snippet.title,
            author: video.snippet.channelTitle,
            publishedAt: new Date(video.snippet.publishedAt).toISOString()
          };
        }
      }
    }
    
    // Fallback to scraping if API key not available or fails
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    const titleMatch = html.match(/<meta name="title" content="([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : 'Unknown Title';
    
    let author = 'Unknown Creator';
    const channelMatch = html.match(/"author":"([^"]+)"/);
    if (channelMatch) {
      author = channelMatch[1];
    } else {
      const ownerMatch = html.match(/"ownerChannelName":"([^"]+)"/);
      if (ownerMatch) author = ownerMatch[1];
    }
    
    // Try to extract publish date from HTML
    const dateMatch = html.match(/"datePublished":"([^"]+)"/);
    const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString();
    
    return { title, author, publishedAt };
  } catch (error) {
    console.error('Error fetching YouTube metadata:', error);
    return { 
      title: 'Unknown Title', 
      author: 'Unknown Creator',
      publishedAt: new Date().toISOString()
    };
  }
}

// Function to get YouTube transcript from captions
async function getYouTubeTranscript(videoId: string): Promise<string> {
  try {
    // First, try to get caption track list from YouTube's API
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const videoPageHtml = await videoPageResponse.text();
    
    // Look for captionTracks in the page
    let captionUrl = null;
    
    // Try multiple patterns to find caption tracks
    const patterns = [
      /"captionTracks":(\[.*?\])/,
      /"captions":.*?"playerCaptionsTracklistRenderer".*?"captionTracks":(\[.*?\])/s
    ];
    
    let captionTracks = null;
    for (const pattern of patterns) {
      const match = videoPageHtml.match(pattern);
      if (match) {
        try {
          captionTracks = JSON.parse(match[1]);
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    if (!captionTracks || captionTracks.length === 0) {
      // Try alternative: use YouTube's timedtext API directly with video ID
      // This often works even when captionTracks aren't in the HTML
      captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
      console.log('Trying direct timedtext API');
    } else {
      // Find English captions (auto-generated or manual)
      const track = captionTracks.find((t: any) => 
        t.languageCode === 'en' || 
        t.languageCode === 'en-US' ||
        t.languageCode === 'en-GB'
      ) || captionTracks.find((t: any) => t.kind === 'asr') || captionTracks[0];
      
      captionUrl = track.baseUrl;
      console.log(`Found captions: ${track.languageCode} (${track.kind || 'manual'})`);
    }
    
    // Fetch the caption XML
    const captionResponse = await fetch(captionUrl);
    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
    }
    
    const captionXml = await captionResponse.text();
    
    // Parse XML - handle both srv3 and ttml formats
    const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/g) || 
                       captionXml.match(/<p[^>]*>(.*?)<\/p>/g) || [];
    
    if (textMatches.length === 0) {
      throw new Error('No text found in caption file');
    }
    
    const transcript = textMatches
      .map(match => {
        // Remove XML tags
        let text = match.replace(/<[^>]*>/g, '');
        // Decode HTML entities
        return text
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&apos;/g, "'");
      })
      .filter(text => text.trim().length > 0)
      .join(' ');
    
    if (!transcript || transcript.trim().length === 0) {
      throw new Error('Transcript is empty after parsing');
    }
    
    console.log(`✅ Transcript extracted: ${transcript.length} characters`);
    return transcript;
    
  } catch (error) {
    console.error('Transcript fetch failed:', error);
    throw new Error(`Could not fetch transcript: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl, summaryLength = 'standard', userId } = await req.json();
    
    if (!videoUrl) {
      throw new Error('Video URL is required');
    }

    // Create service role client if userId is provided (for cron jobs)
    let supabaseClient;
    let actualUserId;

    if (userId) {
      // Service role client for cron jobs
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      actualUserId = userId;
    } else {
      // Regular auth for user requests
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header provided');
      }

      supabaseClient = createClient(
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
      actualUserId = user.id;
    }

    let videoContent = '';
    let author = '';
    let title = '';
    let publishedAt = new Date().toISOString();
    
    // Handle YouTube videos
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }
      
      console.log(`Processing YouTube video: ${videoId}`);
      
      // Get video metadata (title, author, publishedAt)
      const metadata = await getYouTubeMetadata(videoId);
      title = metadata.title;
      author = metadata.author;
      publishedAt = metadata.publishedAt;
      
      console.log(`Video: ${title} by ${author}, published: ${publishedAt}`);
      
      // Get video transcript
      try {
        videoContent = await getYouTubeTranscript(videoId);
        console.log(`Successfully fetched transcript: ${videoContent.length} chars`);
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

    Video Content: ${videoContent.substring(0, 12000)}
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

    // Save to database with published_at
    const { data: savedContent, error } = await supabaseClient
      .from('content_items')
      .insert({
        user_id: actualUserId,
        title,
        content_type: 'video',
        original_url: videoUrl,
        author,
        platform: 'youtube',
        published_at: publishedAt,  // ← ADDED THIS!
        summary,
        full_content: videoContent.substring(0, 50000),
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

    console.log(`✅ Successfully saved video: ${title}`);

    return new Response(
      JSON.stringify({
        processed: true,
        data: {
          id: savedContent.id,
          title,
          author,
          summary,
          tags,
          sentiment,
          publishedAt
        }
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
