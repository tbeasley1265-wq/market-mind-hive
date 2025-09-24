import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// YouTube API helper
async function fetchYouTubeChannelVideos(channelId: string, maxResults = 10) {
  const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  console.log(`Fetching videos for channel: ${channelId}`);
  
  // Get recent videos from channel
  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${maxResults}`
  );
  
  if (!searchResponse.ok) {
    throw new Error(`YouTube API error: ${await searchResponse.text()}`);
  }
  
  const searchData = await searchResponse.json();
  return searchData.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    channelTitle: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`
  }));
}

// RSS Feed helper for Substack and other newsletters
async function fetchRSSFeed(feedUrl: string, maxItems = 10) {
  console.log(`Fetching RSS feed: ${feedUrl}`);
  
  try {
    const response = await fetch(feedUrl);
    if (!response.ok) {
      throw new Error(`RSS feed error: ${response.status}`);
    }
    
    const feedText = await response.text();
    
    // Parse RSS XML (basic parsing)
    const items: any[] = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    let match;
    let count = 0;
    
    while ((match = itemRegex.exec(feedText)) !== null && count < maxItems) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      const descriptionMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
      const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1] || titleMatch[2] || 'Untitled',
          link: linkMatch[1],
          description: descriptionMatch ? (descriptionMatch[1] || descriptionMatch[2]) : '',
          pubDate: pubDateMatch ? pubDateMatch[1] : new Date().toISOString(),
        });
        count++;
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed ${feedUrl}:`, error);
    return [];
  }
}

// Twitter/X API helper (requires Bearer Token)
async function fetchTwitterUserTweets(username: string, maxResults = 10) {
  const TWITTER_BEARER_TOKEN = Deno.env.get('TWITTER_BEARER_TOKEN');
  if (!TWITTER_BEARER_TOKEN) {
    console.log('Twitter Bearer Token not configured, skipping Twitter content');
    return [];
  }

  try {
    console.log(`Fetching tweets for user: ${username}`);
    
    // Get user ID first
    const userResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );
    
    if (!userResponse.ok) {
      throw new Error(`Twitter API error: ${await userResponse.text()}`);
    }
    
    const userData = await userResponse.json();
    const userId = userData.data.id;
    
    // Get recent tweets
    const tweetsResponse = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        },
      }
    );
    
    if (!tweetsResponse.ok) {
      throw new Error(`Twitter API error: ${await tweetsResponse.text()}`);
    }
    
    const tweetsData = await tweetsResponse.json();
    return (tweetsData.data || []).map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      metrics: tweet.public_metrics,
      url: `https://twitter.com/${username}/status/${tweet.id}`
    }));
  } catch (error) {
    console.error(`Error fetching Twitter content for ${username}:`, error);
    return [];
  }
}

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

    const newContentItems: any[] = [];

    // Process each influencer source
    for (const source of influencerSources || []) {
      console.log(`Processing source: ${source.influencer_name}`);
      
      try {
        // YouTube content
        if (source.selected_platforms.includes('youtube')) {
          console.log(`Fetching YouTube content for ${source.influencer_name}`);
          
          // Try to extract channel ID from influencer_id or use it directly
          let channelId = source.influencer_id;
          if (source.influencer_id.includes('youtube.com') || source.influencer_id.includes('youtu.be')) {
            // Extract channel ID from URL if provided
            const channelMatch = source.influencer_id.match(/channel\/([^\/\?]+)/);
            if (channelMatch) {
              channelId = channelMatch[1];
            }
          }
          
          const videos = await fetchYouTubeChannelVideos(channelId, 5);
          
          for (const video of videos) {
            // Check if we already have this video
            const { data: existing } = await supabaseClient
              .from('content_items')
              .select('id')
              .eq('original_url', video.url)
              .eq('user_id', user.id)
              .single();

            if (!existing) {
              console.log(`Processing new YouTube video: ${video.title}`);
              
              // Process video through video-summarizer
              const videoResponse = await supabaseClient.functions.invoke('video-summarizer', {
                body: {
                  videoUrl: video.url,
                  summaryLength: 'standard'
                }
              });

              if (videoResponse.data?.success) {
                newContentItems.push({
                  title: video.title,
                  platform: 'youtube',
                  author: video.channelTitle,
                  url: video.url
                });
              }
            }
          }
        }

        // Substack/Newsletter content
        if (source.selected_platforms.includes('substack') || source.selected_platforms.includes('newsletters')) {
          console.log(`Fetching newsletter content for ${source.influencer_name}`);
          
          // Construct RSS feed URL
          let feedUrl = source.influencer_id;
          if (source.influencer_id.includes('substack.com') && !source.influencer_id.includes('/feed')) {
            feedUrl = source.influencer_id.replace(/\/$/, '') + '/feed';
          }
          
          const feedItems = await fetchRSSFeed(feedUrl, 5);
          
          for (const item of feedItems) {
            // Check if we already have this content
            const { data: existing } = await supabaseClient
              .from('content_items')
              .select('id')
              .eq('original_url', item.link)
              .eq('user_id', user.id)
              .single();

            if (!existing) {
              console.log(`Processing new newsletter article: ${item.title}`);
              
              // Process through content-processor
              const contentResponse = await supabaseClient.functions.invoke('content-processor', {
                body: {
                  title: item.title,
                  content: item.description,
                  author: source.influencer_name,
                  platform: 'substack',
                  originalUrl: item.link,
                  summaryLength: 'standard'
                }
              });

              if (contentResponse.data?.success) {
                newContentItems.push({
                  title: item.title,
                  platform: 'substack',
                  author: source.influencer_name,
                  url: item.link
                });
              }
            }
          }
        }

        // Twitter content
        if (source.selected_platforms.includes('twitter')) {
          console.log(`Fetching Twitter content for ${source.influencer_name}`);
          
          let username = source.influencer_id;
          if (source.influencer_id.includes('twitter.com') || source.influencer_id.includes('x.com')) {
            const usernameMatch = source.influencer_id.match(/(?:twitter|x)\.com\/([^\/\?]+)/);
            if (usernameMatch) {
              username = usernameMatch[1];
            }
          }
          
          const tweets = await fetchTwitterUserTweets(username, 5);
          
          for (const tweet of tweets) {
            // Only process substantial tweets (not just retweets or short ones)
            if (tweet.text.length > 50 && !tweet.text.startsWith('RT @')) {
              // Check if we already have this tweet
              const { data: existing } = await supabaseClient
                .from('content_items')
                .select('id')
                .eq('original_url', tweet.url)
                .eq('user_id', user.id)
                .single();

              if (!existing) {
                console.log(`Processing new tweet: ${tweet.text.substring(0, 50)}...`);
                
                // Process through content-processor
                const contentResponse = await supabaseClient.functions.invoke('content-processor', {
                  body: {
                    title: `Tweet by ${source.influencer_name}`,
                    content: tweet.text,
                    author: source.influencer_name,
                    platform: 'twitter',
                    originalUrl: tweet.url,
                    summaryLength: 'brief'
                  }
                });

                if (contentResponse.data?.success) {
                  newContentItems.push({
                    title: `Tweet by ${source.influencer_name}`,
                    platform: 'twitter',
                    author: source.influencer_name,
                    url: tweet.url
                  });
                }
              }
            }
          }
        }
      } catch (sourceError) {
        console.error(`Error processing source ${source.influencer_name}:`, sourceError);
      }
    }

    console.log(`Content aggregation completed. Processed ${newContentItems.length} new items.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${newContentItems.length} new content items`,
      newItems: newContentItems
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content aggregator:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});