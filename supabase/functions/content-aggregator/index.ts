import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the user from the request first
    const authHeader = req.headers.get('Authorization');
    console.log(`Auth header received: ${authHeader ? 'present' : 'missing'}`);
    
    if (!authHeader) {
      console.log('No authorization header found');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    console.log(`User authentication result: ${user ? `success for user ${user.id}` : 'failed'}`);
    if (userError) {
      console.log(`User error: ${userError.message}`);
    }

    if (userError || !user) {
      console.log('Authentication failed, returning 401');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting content aggregation for user: ${user.id}`);

    // Fetch user's influencer sources
    const { data: influencerSources, error: sourcesError } = await supabaseClient
      .from('influencer_sources')
      .select('*')
      .eq('user_id', user.id);

    if (sourcesError) {
      throw sourcesError;
    }

    console.log(`Found ${influencerSources?.length || 0} influencer sources`);

    let processedCount = 0;
    const results: any[] = [];

    // Process each influencer source
    for (const source of influencerSources || []) {
      console.log(`Processing source: ${source.influencer_name}`);
      
      try {
        // Process YouTube content
        if (source.selected_platforms.includes('youtube')) {
          const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
          if (YOUTUBE_API_KEY) {
            console.log(`Fetching YouTube content for ${source.influencer_name}`);
            
            // Extract channel ID - assume influencer_id is the channel ID or URL
            let channelId = source.influencer_id;
            if (source.influencer_id.includes('youtube.com') || source.influencer_id.includes('youtu.be')) {
              const channelMatch = source.influencer_id.match(/channel\/([^\/\?]+)/);
              const userMatch = source.influencer_id.match(/user\/([^\/\?]+)/);
              if (channelMatch) {
                channelId = channelMatch[1];
              } else if (userMatch) {
                // For user URLs, we'd need to convert to channel ID via API
                channelId = userMatch[1];
              }
            }
            
            const searchResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=3`
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              
              for (const item of searchData.items || []) {
                const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                
                // Check if we already have this video
                const { data: existing } = await supabaseClient
                  .from('content_items')
                  .select('id')
                  .eq('original_url', videoUrl)
                  .eq('user_id', user.id)
                  .single();

                if (!existing) {
                  console.log(`Processing new YouTube video: ${item.snippet.title}`);
                  
                  // Process video through video-summarizer
                  const videoResponse = await supabaseClient.functions.invoke('video-summarizer', {
                    body: {
                      videoUrl: videoUrl,
                      summaryLength: 'standard'
                    }
                  });

                  if (videoResponse.data?.success) {
                    processedCount++;
                    results.push({
                      type: 'youtube',
                      title: item.snippet.title,
                      author: item.snippet.channelTitle,
                      url: videoUrl,
                      status: 'processed'
                    });
                  }
                }
              }
            }
          }
        }

        // Process Podcast content
        if (source.selected_platforms.includes('podcasts')) {
          console.log(`Fetching podcast content for ${source.influencer_name}`);
          
          // Construct podcast RSS feed URL
          let feedUrl = source.influencer_id;
          
          try {
            const feedResponse = await fetch(feedUrl);
            if (feedResponse.ok) {
              const feedText = await feedResponse.text();
              
              // Parse podcast RSS feed
              const itemMatches = feedText.match(/<item[^>]*>(.*?)<\/item>/gs) || [];
              
              for (const itemMatch of itemMatches.slice(0, 2)) { // Process latest 2 episodes due to processing time
                const titleMatch = itemMatch.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
                const linkMatch = itemMatch.match(/<link[^>]*>(.*?)<\/link>/s);
                const descMatch = itemMatch.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
                const pubDateMatch = itemMatch.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s);
                const durationMatch = itemMatch.match(/<itunes:duration[^>]*>(.*?)<\/itunes:duration>/s);
                const audioMatch = itemMatch.match(/<enclosure[^>]*url="([^"]*\.mp3[^"]*)"[^>]*>/s);
                
                if (titleMatch && linkMatch && audioMatch) {
                  const title = titleMatch[1]?.trim().replace(/<[^>]*>/g, '') || 'Untitled';
                  const episodeUrl = linkMatch[1]?.trim();
                  const description = descMatch ? descMatch[1]?.trim().replace(/<[^>]*>/g, '') : '';
                  const audioUrl = audioMatch[1]?.trim();
                  const pubDateStr = pubDateMatch ? pubDateMatch[1]?.trim() : '';
                  const durationStr = durationMatch ? durationMatch[1]?.trim() : '';
                  
                  // Parse duration to seconds
                  let duration = 0;
                  if (durationStr) {
                    const parts = durationStr.split(':').map(p => parseInt(p) || 0);
                    if (parts.length === 3) { // HH:MM:SS
                      duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) { // MM:SS
                      duration = parts[0] * 60 + parts[1];
                    } else if (parts.length === 1) { // SS
                      duration = parts[0];
                    }
                  }
                  
                  // Parse publication date
                  let publishedDate = null;
                  if (pubDateStr) {
                    try {
                      publishedDate = new Date(pubDateStr).toISOString();
                    } catch (e) {
                      console.warn(`Could not parse date: ${pubDateStr}`);
                    }
                  }
                  
                  // Check if we already have this episode
                  const { data: existing } = await supabaseClient
                    .from('podcast_episodes')
                    .select('id')
                    .eq('episode_url', episodeUrl)
                    .eq('user_id', user.id)
                    .single();

                  if (!existing) {
                    console.log(`Processing new podcast episode: ${title}`);
                    
                    try {
                      // Download and transcribe audio
                      console.log(`Downloading audio from: ${audioUrl}`);
                      
                      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
                      if (!OPENAI_API_KEY) {
                        throw new Error('OpenAI API key not configured');
                      }
                      
                      const audioResponse = await fetch(audioUrl);
                      if (!audioResponse.ok) {
                        throw new Error(`Failed to download audio: ${audioResponse.status}`);
                      }
                      
                      const audioBuffer = await audioResponse.arrayBuffer();
                      
                      // Create FormData for Whisper API
                      const formData = new FormData();
                      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
                      formData.append('file', blob, `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`);
                      formData.append('model', 'whisper-1');
                      formData.append('response_format', 'text');
                      
                      console.log(`Transcribing audio with Whisper API`);
                      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        },
                        body: formData,
                      });
                      
                      if (!transcriptionResponse.ok) {
                        const errorText = await transcriptionResponse.text();
                        throw new Error(`Transcription failed: ${transcriptionResponse.status} - ${errorText}`);
                      }
                      
                      const transcript = await transcriptionResponse.text();
                      console.log(`Transcript length: ${transcript.length} characters`);
                      
                      // Process transcript through content-processor for summarization
                      const contentResponse = await supabaseClient.functions.invoke('content-processor', {
                        body: {
                          title: title,
                          content: transcript,
                          author: source.influencer_name,
                          platform: 'podcast',
                          originalUrl: episodeUrl,
                          summaryLength: 'standard'
                        }
                      });

                      if (contentResponse.data?.success) {
                        const processedData = contentResponse.data.data;
                        
                        // Extract guests from transcript (simple pattern matching)
                        const guests: string[] = [];
                        const guestPatterns = [
                          /(?:with|featuring|guest|joined by)\s+([A-Z][a-zA-Z\s]+)/gi,
                          /([A-Z][a-zA-Z\s]+)(?:\s+joins?\s+us|\s+is\s+here)/gi
                        ];
                        
                        for (const pattern of guestPatterns) {
                          const matches = transcript.match(pattern);
                          if (matches) {
                            guests.push(...matches.map(m => m.replace(/^(with|featuring|guest|joined by)\s+/i, '').trim()));
                          }
                        }
                        
                        // Remove duplicates and clean up
                        const uniqueGuests = [...new Set(guests)]
                          .filter(g => g.length > 2 && g.length < 50)
                          .slice(0, 5); // Limit to 5 guests
                        
                        // Store in podcast_episodes table
                        const { error: insertError } = await supabaseClient
                          .from('podcast_episodes')
                          .insert({
                            user_id: user.id,
                            podcast_name: source.influencer_name,
                            episode_title: title,
                            episode_url: episodeUrl,
                            audio_url: audioUrl,
                            published_date: publishedDate,
                            duration: duration || null,
                            description: description,
                            transcript: transcript,
                            summary: processedData.summary,
                            guests: uniqueGuests,
                            tags: processedData.tags || [],
                            sentiment: processedData.sentiment
                          });
                        
                        if (insertError) {
                          throw insertError;
                        }
                        
                        processedCount++;
                        results.push({
                          type: 'podcast',
                          title: title,
                          author: source.influencer_name,
                          url: episodeUrl,
                          status: 'processed',
                          transcript_length: transcript.length,
                          guests: uniqueGuests
                        });
                      }
                    } catch (episodeError) {
                      console.error(`Error processing podcast episode ${title}:`, episodeError);
                      const errorMessage = episodeError instanceof Error ? episodeError.message : String(episodeError);
                      results.push({
                        type: 'podcast',
                        title: title,
                        author: source.influencer_name,
                        url: episodeUrl,
                        status: 'error',
                        error: errorMessage
                      });
                    }
                  }
                }
              }
            }
          } catch (feedError) {
            console.error(`Error processing podcast RSS feed for ${source.influencer_name}:`, feedError);
          }
        }

        // Process Substack/Newsletter content
        if (source.selected_platforms.includes('substack') || source.selected_platforms.includes('newsletters')) {
          console.log(`Fetching newsletter content for ${source.influencer_name}`);
          
          // Construct RSS feed URL
          let feedUrl = source.influencer_id;
          if (source.influencer_id.includes('substack.com') && !source.influencer_id.includes('/feed')) {
            feedUrl = source.influencer_id.replace(/\/$/, '') + '/feed';
          }
          
          try {
            const feedResponse = await fetch(feedUrl);
            if (feedResponse.ok) {
              const feedText = await feedResponse.text();
              
              // Simple RSS parsing
              const itemMatches = feedText.match(/<item[^>]*>(.*?)<\/item>/gs) || [];
              
              for (const itemMatch of itemMatches.slice(0, 3)) {
                const titleMatch = itemMatch.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
                const linkMatch = itemMatch.match(/<link[^>]*>(.*?)<\/link>/s);
                const descMatch = itemMatch.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
                
                if (titleMatch && linkMatch) {
                  const title = titleMatch[1]?.trim() || 'Untitled';
                  const link = linkMatch[1]?.trim();
                  const description = descMatch ? descMatch[1]?.trim() : '';
                  
                  // Check if we already have this content
                  const { data: existing } = await supabaseClient
                    .from('content_items')
                    .select('id')
                    .eq('original_url', link)
                    .eq('user_id', user.id)
                    .single();

                  if (!existing) {
                    console.log(`Processing new newsletter article: ${title}`);
                    
                    // Process through content-processor
                    const contentResponse = await supabaseClient.functions.invoke('content-processor', {
                      body: {
                        title: title,
                        content: description,
                        author: source.influencer_name,
                        platform: 'substack',
                        originalUrl: link,
                        summaryLength: 'standard'
                      }
                    });

                    if (contentResponse.data?.success) {
                      processedCount++;
                      results.push({
                        type: 'newsletter',
                        title: title,
                        author: source.influencer_name,
                        url: link,
                        status: 'processed'
                      });
                    }
                  }
                }
              }
            }
          } catch (feedError) {
            console.error(`Error processing RSS feed for ${source.influencer_name}:`, feedError);
          }
        }
      } catch (sourceError) {
        console.error(`Error processing source ${source.influencer_name}:`, sourceError);
      }
    }

    console.log(`Content aggregation completed. Processed ${processedCount} new items.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${processedCount} new content items`,
      processedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content aggregator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});