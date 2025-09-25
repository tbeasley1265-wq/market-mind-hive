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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
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