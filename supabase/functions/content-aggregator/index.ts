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
    let userId: string;
    let authHeader: string | null = null;
    let supabaseClient: any;

    // Parse request body
    const bodyText = await req.text();
    let body: any = {};
    
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
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      userId = user.id;
    }

    console.log(`\n========================================`);
    console.log(`Starting content aggregation for user: ${userId}`);
    console.log(`========================================\n`);

    // Enhanced platform detection functions
    const detectPlatformFromUrl = (url: string) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      if (url.includes('substack.com')) return 'substack';
      if (url.includes('podcast') || url.includes('.mp3') || url.includes('rss') || url.includes('feed')) return 'podcast';
      if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
      if (url.includes('reddit.com')) return 'reddit';
      return 'unknown';
    };

    const detectAuthorFromUrl = (url: string, defaultAuthor: string) => {
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
    const extractPlatformIdentifiers = (source: any): Record<string, string> => {
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
    const validatePlatformIdentifier = (sourceUrls: Record<string, string>, platform: string): string | null => {
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
    const results: any[] = [];
    const errors: any[] = [];

    // Process EVERY influencer source (removed the .slice(0, 2) limit)
    for (const source of (influencerSources || [])) {
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
                  
                  const { data: existing } = await supabaseClient
                    .from('content_items')
                    .select('id')
                    .eq('original_url', videoUrl)
                    .eq('user_id', userId)
                    .single();

                  if (!existing) {
                    console.log(`Processing new YouTube video: ${item.snippet.title}`);
                    
                    // Use service role for invoking other functions
                    const invokeClient = createClient(
                      Deno.env.get('SUPABASE_URL') ?? '',
                      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                    );

                    const videoResponse = await invokeClient.functions.invoke('video-summarizer', {
                      body: {
                        videoUrl: videoUrl,
                        summaryLength: 'standard',
                        userId: userId // Pass userId explicitly
                      }
                    });

                    if (videoResponse.data?.processed) {
                      processedCount++;
                      results.push({
                        type: 'youtube',
                        title: item.snippet.title,
                        author: item.snippet.channelTitle,
                        url: videoUrl,
                        status: 'processed'
                      });
                    } else {
                      errors.push({
                        source: source.influencer_name,
                        platform: 'youtube',
                        title: item.snippet.title,
                        error: videoResponse.error || 'Failed to process video'
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

        // Process Podcast content
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
                    const description = descMatch ? descMatch[1]?.trim().replace(/<[^>]*>/g, '') : '';
                    const audioUrl = audioMatch[1]?.trim();
                    const pubDateStr = pubDateMatch ? pubDateMatch[1]?.trim() : '';
                    const durationStr = durationMatch ? durationMatch[1]?.trim() : '';

                    // Parse duration
                    let duration = 0;
                    if (durationStr) {
                      const parts = durationStr.split(':').map(p => parseInt(p) || 0);
                      if (parts.length === 3) {
                        duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
                      } else if (parts.length === 2) {
                        duration = parts[0] * 60 + parts[1];
                      } else if (parts.length === 1) {
                        duration = parts[0];
                      }
                    }

                    // Parse date
                    let publishedDate = null;
                    if (pubDateStr) {
                      try {
                        publishedDate = new Date(pubDateStr).toISOString();
                      } catch (e) {
                        console.warn(`Could not parse date: ${pubDateStr}`);
                      }
                    }

                    const { data: existing } = await supabaseClient
                      .from('podcast_episodes')
                      .select('id')
                      .eq('episode_url', episodeUrl)
                      .eq('user_id', userId)
                      .single();

                    if (!existing) {
                      console.log(`Processing new podcast episode: ${title}`);
                      
                      try {
                        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
                        if (!OPENAI_API_KEY) {
                          throw new Error('OpenAI API key not configured');
                        }

                        console.log(`Downloading audio from: ${audioUrl}`);
                        const audioResponse = await fetch(audioUrl);
                        if (!audioResponse.ok) {
                          throw new Error(`Failed to download audio: ${audioResponse.status}`);
                        }

                        const audioBuffer = await audioResponse.arrayBuffer();
                        
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
                          body: formData
                        });

                        if (!transcriptionResponse.ok) {
                          const errorText = await transcriptionResponse.text();
                          throw new Error(`Transcription failed: ${transcriptionResponse.status} - ${errorText}`);
                        }

                        const transcript = await transcriptionResponse.text();
                        console.log(`Transcript length: ${transcript.length} characters`);

                        const detectedPlatform = detectPlatformFromUrl(episodeUrl);
                        const detectedAuthor = detectAuthorFromUrl(episodeUrl, source.influencer_name);

                        // Use service role for invoking other functions
                        const invokeClient = createClient(
                          Deno.env.get('SUPABASE_URL') ?? '',
                          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                        );

                        const contentResponse = await invokeClient.functions.invoke('content-processor', {
                          body: {
                            title: title,
                            content: transcript,
                            author: detectedAuthor,
                            platform: detectedPlatform === 'unknown' ? 'podcast' : detectedPlatform,
                            originalUrl: episodeUrl,
                            summaryLength: 'standard',
                            userId: userId
                          }
                        });

                        if (contentResponse.data?.processed) {
                          const processedData = contentResponse.data.data;

                          // Extract guests
                          const guests: string[] = [];
                          const guestPatterns = [
                            /(?:with|featuring|guest|joined by)\s+([A-Z][a-zA-Z\s]+)/gi,
                            /([A-Z][a-zA-Z\s]+)(?:\s+joins?\s+us|\s+is\s+here)/gi
                          ];

                          for (const pattern of guestPatterns) {
                            const matches = transcript.match(pattern);
                            if (matches) {
                              guests.push(...matches.map(m => 
                                m.replace(/^(with|featuring|guest|joined by)\s+/i, '').trim()
                              ));
                            }
                          }

                          const uniqueGuests = [...new Set(guests)]
                            .filter(g => g.length > 2 && g.length < 50)
                            .slice(0, 5);

                          const { error: insertError } = await supabaseClient
                            .from('podcast_episodes')
                            .insert({
                              user_id: userId,
                              podcast_name: detectedAuthor,
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
                            author: detectedAuthor,
                            url: episodeUrl,
                            status: 'processed'
                          });
                        }
                      } catch (episodeError) {
                        console.error(`Error processing podcast episode ${title}:`, episodeError);
                        errors.push({
                          source: source.influencer_name,
                          platform: 'podcast',
                          title: title,
                          error: episodeError instanceof Error ? episodeError.message : String(episodeError)
                        });
                      }
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
                  const descMatch = itemMatch.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s);

                  if (titleMatch && linkMatch) {
                    const title = titleMatch[1]?.trim() || 'Untitled';
                    const link = linkMatch[1]?.trim();
                    const description = descMatch ? descMatch[1]?.trim() : '';

                    const { data: existing } = await supabaseClient
                      .from('content_items')
                      .select('id')
                      .eq('original_url', link)
                      .eq('user_id', userId)
                      .single();

                    if (!existing) {
                      console.log(`Processing new newsletter article: ${title}`);
                      
                      // Use service role for invoking
                      const invokeClient = createClient(
                        Deno.env.get('SUPABASE_URL') ?? '',
                        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
                      );

                      const contentResponse = await invokeClient.functions.invoke('content-processor', {
                        body: {
                          title: title,
                          content: description,
                          author: source.influencer_name,
                          platform: 'substack',
                          originalUrl: link,
                          summaryLength: 'standard',
                          userId: userId
                        }
                      });

                      if (contentResponse.data?.processed) {
                        processedCount++;
                        results.push({
                          type: 'newsletter',
                          title: title,
                          author: source.influencer_name,
                          url: link,
                          status: 'processed'
                        });
                      } else {
                        errors.push({
                          source: source.influencer_name,
                          platform: 'newsletter',
                          title: title,
                          error: contentResponse.error || 'Failed to process'
                        });
                      }
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
