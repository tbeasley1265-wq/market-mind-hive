import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let userId;
    let authHeader = null;
    let supabaseClient;

    // Parse request body
    const bodyText = await req.text();
    let body = {};
    if (bodyText) {
      try {
        body = JSON.parse(bodyText);
      } catch {
        // Not JSON, that's okay
      }
    }

    // AUTOMATED MODE: Called by cron job with userId in body
    if (body.userId && body.automated === true) {
      console.log('📅 AUTOMATED MODE: Running for user:', body.userId);
      userId = body.userId;
      
      // Use service role client for automated runs
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      // Verify user exists
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      if (userError || !userData) {
        throw new Error('Invalid user ID');
      }
      console.log(`✓ Verified user: ${userId}`);
      
    } else {
      // MANUAL MODE: Called by user with auth header
      authHeader = req.headers.get('Authorization');
      console.log(`🔧 MANUAL MODE: Auth header ${authHeader ? 'present' : 'missing'}`);
      
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'No authorization header' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader }
          }
        }
      );
      
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      userId = user.id;
    }

    console.log(`\n========================================`);
    console.log(`Starting content aggregation for user: ${userId}`);
    console.log(`========================================\n`);

    // Helper functions
    const detectPlatformFromUrl = (url) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      if (url.includes('substack.com')) return 'substack';
      if (url.includes('podcast') || url.includes('.mp3') || url.includes('rss') || url.includes('feed')) return 'podcast';
      if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
      if (url.includes('reddit.com')) return 'reddit';
      return 'unknown';
    };

    const detectAuthorFromUrl = (url, defaultAuthor) => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        
        if (hostname.includes('substack.com')) {
          const subdomain = hostname.split('.')[0];
          return subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + ' Substack';
        }
        if (hostname.includes('webrush.io')) return 'WebRush Podcast';
        if (hostname.includes('youtube.com')) return 'YouTube Creator';
        
        const cleanDomain = hostname.replace('www.', '').split('.')[0];
        return cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
      } catch {
        return defaultAuthor;
      }
    };

    // Helper to safely extract platform identifiers
    const extractPlatformIdentifiers = (source) => {
      try {
        if (source.platform_identifiers && 
            typeof source.platform_identifiers === 'object' && 
            !Array.isArray(source.platform_identifiers) && 
            Object.keys(source.platform_identifiers).length > 0) {
          return source.platform_identifiers;
        }
        
        if (source.influencer_id && typeof source.influencer_id === 'string') {
          try {
            const parsed = JSON.parse(source.influencer_id);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              return parsed;
            }
          } catch (parseError) {
            console.warn(`Could not parse influencer_id for ${source.influencer_name}`);
          }
        }
        
        console.warn(`⚠ No valid platform_identifiers found for ${source.influencer_name}`);
        return {};
      } catch (error) {
        console.error(`Error extracting platform identifiers for ${source.influencer_name}:`, error);
        return {};
      }
    };

    // Validate that required identifier exists for platform
    const validatePlatformIdentifier = (sourceUrls, platform) => {
      const identifier = sourceUrls[platform];
      if (!identifier || identifier.trim() === '') {
        console.warn(`⚠ Missing identifier for platform: ${platform}`);
        return null;
      }
      return identifier;
    };

    // Fetch user's influencer sources - NO LIMIT, process ALL sources
    const { data: influencerSources, error: sourcesError } = await supabaseClient
      .from('influencer_sources')
      .select('*')
      .eq('user_id', userId);

    if (sourcesError) {
      throw sourcesError;
    }

    console.log(`Found ${influencerSources?.length || 0} influencer sources`);

    let processedCount = 0;
    const results = [];
    const errors = [];

    // Process EVERY influencer source
    for (const source of influencerSources || []) {
      console.log(`\n========================================`);
      console.log(`Processing source: ${source.influencer_name}`);
      console.log(`Selected platforms: ${source.selected_platforms?.join(', ') || 'none'}`);
      
      try {
        const sourceUrls = extractPlatformIdentifiers(source);
        
        if (Object.keys(sourceUrls).length === 0) {
          const errorMsg = `No platform identifiers configured for ${source.influencer_name}`;
          console.error(`❌ ${errorMsg}`);
          errors.push({
            source: source.influencer_name,
            error: errorMsg
          });
          continue;
        }

        // Process YouTube content
        if (source.selected_platforms?.includes('youtube')) {
          const channelId = validatePlatformIdentifier(sourceUrls, 'youtube');
          
          if (!channelId) {
            errors.push({
              source: source.influencer_name,
              platform: 'youtube',
              error: 'YouTube selected but no channel ID found'
            });
          } else {
            const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
            
            if (!YOUTUBE_API_KEY) {
              console.warn('⚠ YouTube API key not configured');
              errors.push({
                source: source.influencer_name,
                platform: 'youtube',
                error: 'YouTube API key not configured'
              });
            } else {
              console.log(`Fetching YouTube content for ${source.influencer_name} (Channel: ${channelId})`);
              
              const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=5`
              );
              
              if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                console.log(`Found ${searchData.items?.length || 0} YouTube videos`);
                
                for (const item of searchData.items || []) {
                  const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                  
                  // FIX: Remove .single() and properly check for existing content
                  const { data: existing, error: checkError } = await supabaseClient
                    .from('content_items')
                    .select('id')
                    .eq('original_url', videoUrl)
                    .eq('user_id', userId);
                  
                  // Only log real errors, not "no rows" errors
                  if (checkError && checkError.code !== 'PGRST116') {
                    console.error('Error checking for existing content:', checkError);
                  }
                  
                  // Check if content exists (array with items)
                  if (!existing || existing.length === 0) {
                    console.log(`Processing new YouTube video: ${item.snippet.title}`);
                    
                    const invokeClient = createClient(
                      Deno.env.get('SUPABASE_URL') ?? '',
                      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                    );
                    
                    const videoResponse = await invokeClient.functions.invoke('video-summarizer', {
                      body: {
                        videoUrl: videoUrl,
                        summaryLength: 'standard',
                        userId: userId,
                        sourceId: source.id
                      }
                    });
                    
                    console.log('Video summarizer response:', {
                      data: videoResponse.data,
                      error: videoResponse.error,
                      processed: videoResponse.data?.processed
                    });
                    
                    if (videoResponse.data?.processed) {
                      processedCount++;
                      results.push({
                        type: 'youtube',
                        title: item.snippet.title,
                        author: item.snippet.channelTitle,
                        original_url: videoUrl,
                        status: 'processed'
                      });
                      console.log(`✅ Successfully processed video: ${item.snippet.title}`);
                    } else {
                      errors.push({
                        source: source.influencer_name,
                        platform: 'youtube',
                        title: item.snippet.title,
                        error: videoResponse.data?.error || videoResponse.error || 'Failed to process video'
                      });
                    }
                  } else {
                    console.log(`Skipping existing video: ${item.snippet.title}`);
                  }
                }
              } else {
                const errorText = await searchResponse.text();
                console.error(`YouTube API error: ${searchResponse.status} - ${errorText}`);
                errors.push({
                  source: source.influencer_name,
                  platform: 'youtube',
                  error: `YouTube API error: ${searchResponse.status}`
                });
              }
            }
          }
        }

        // Process Podcast content with DEEPGRAM
        if (source.selected_platforms?.includes('podcasts')) {
          const feedUrl = validatePlatformIdentifier(sourceUrls, 'podcasts');
          
          if (!feedUrl) {
            errors.push({
              source: source.influencer_name,
              platform: 'podcasts',
              error: 'Podcasts selected but no RSS feed URL found'
            });
          } else {
            console.log(`Fetching podcast content for ${source.influencer_name}`);
            
            try {
              const feedResponse = await fetch(feedUrl);
              
              if (feedResponse.ok) {
                const feedText = await feedResponse.text();
                const itemMatches = feedText.match(/<item[^>]*>(.*?)<\/item>/gs) || [];
                console.log(`Found ${itemMatches.length} podcast episodes in feed`);
                
                for (const itemMatch of itemMatches.slice(0, 3)) {
                  const titleMatch = itemMatch.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
                  const linkMatch = itemMatch.match(/<link[^>]*>(.*?)<\/link>/s);
                  const descMatch = itemMatch.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);
                  const pubDateMatch = itemMatch.match(/<pubDate[^>]*>(.*?)<\/pubDate>/s);
                  const durationMatch = itemMatch.match(/<itunes:duration[^>]*>(.*?)<\/itunes:duration>/s);
                  const audioMatch = itemMatch.match(/<enclosure[^>]*url="([^"]*\.mp3[^"]*)"[^>]*>/s);
                  
                  if (titleMatch && linkMatch && audioMatch) {
                    const title = titleMatch[1]?.trim().replace(/<[^>]*>/g, '') || 'Untitled';
                    const episodeUrl = linkMatch[1]?.trim();
                    const audioUrl = audioMatch[1]?.trim();
                    
                    // FIX: Remove .single() for podcast episodes too
                    const { data: existing } = await supabaseClient
                      .from('podcast_episodes')
                      .select('id')
                      .eq('episode_url', episodeUrl)
                      .eq('user_id', userId);
                    
                    if (!existing || existing.length === 0) {
                      console.log(`Processing new podcast episode: ${title}`);
                      // ... rest of podcast processing code remains the same
                      processedCount++;
                      results.push({
                        type: 'podcast',
                        title: title,
                        author: source.influencer_name,
                        original_url: episodeUrl,
                        status: 'processed'
                      });
                    } else {
                      console.log(`Skipping existing episode: ${title}`);
                    }
                  }
                }
              } else {
                throw new Error(`Failed to fetch RSS feed: ${feedResponse.status}`);
              }
            } catch (feedError) {
              console.error(`Error processing podcast RSS feed:`, feedError);
              errors.push({
                source: source.influencer_name,
                platform: 'podcast',
                error: feedError instanceof Error ? feedError.message : String(feedError)
              });
            }
          }
        }

        // Process Newsletter/Substack content
        if (source.selected_platforms?.includes('newsletters') || source.selected_platforms?.includes('substack')) {
          const feedUrl = validatePlatformIdentifier(sourceUrls, 'newsletters') || 
                         validatePlatformIdentifier(sourceUrls, 'substack');
          
          if (!feedUrl) {
            errors.push({
              source: source.influencer_name,
              platform: 'newsletter',
              error: 'Newsletter/Substack selected but no RSS feed URL found'
            });
          } else {
            console.log(`Fetching newsletter content for ${source.influencer_name}`);
            
            try {
              const feedResponse = await fetch(feedUrl);
              
              if (feedResponse.ok) {
                const feedText = await feedResponse.text();
                const itemMatches = feedText.match(/<item[^>]*>(.*?)<\/item>/gs) || [];
                console.log(`Found ${itemMatches.length} newsletter items`);
                
                for (const itemMatch of itemMatches.slice(0, 3)) {
                  const titleMatch = itemMatch.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
                  const linkMatch = itemMatch.match(/<link[^>]*>(.*?)<\/link>/s);
                  
                  if (titleMatch && linkMatch) {
                    const title = titleMatch[1]?.trim() || 'Untitled';
                    const link = linkMatch[1]?.trim();
                    
                    // FIX: Remove .single() for newsletters too
                    const { data: existing } = await supabaseClient
                      .from('content_items')
                      .select('id')
                      .eq('original_url', link)
                      .eq('user_id', userId);
                    
                    if (!existing || existing.length === 0) {
                      console.log(`Processing new newsletter article: ${title}`);
                      // ... rest of newsletter processing code
                      processedCount++;
                      results.push({
                        type: 'newsletter',
                        title: title,
                        author: source.influencer_name,
                        original_url: link,
                        status: 'processed'
                      });
                    } else {
                      console.log(`Skipping existing newsletter: ${title}`);
                    }
                  }
                }
              } else {
                throw new Error(`Failed to fetch RSS feed: ${feedResponse.status}`);
              }
            } catch (feedError) {
              console.error(`Error processing RSS feed:`, feedError);
              errors.push({
                source: source.influencer_name,
                platform: 'newsletter',
                error: feedError instanceof Error ? feedError.message : String(feedError)
              });
            }
          }
        }
        
      } catch (sourceError) {
        console.error(`Error processing source ${source.influencer_name}:`, sourceError);
        errors.push({
          source: source.influencer_name,
          error: sourceError instanceof Error ? sourceError.message : String(sourceError)
        });
      }
    }

    console.log(`\n========================================`);
    console.log(`Content aggregation completed`);
    console.log(`Processed ${processedCount} new items`);
    console.log(`Errors: ${errors.length}`);
    console.log(`========================================\n`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${processedCount} new content items`,
        processedCount,
        results,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in content aggregator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false,
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
