import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface NormalizedPodcastEpisode {
  title: string;
  description: string;
  publishedDate: string | null;
  duration: number | null;
  audioUrl: string | null;
  originalUrl: string;
  summaryContent: string;
}

interface InfluencerSourceRecord {
  influencer_id: string;
  influencer_name: string;
  selected_platforms: string[] | null;
  platform_metadata?: Record<string, unknown> | null;
}

type PodcastMetadataRecord = {
  feed_url?: unknown;
  feedUrl?: unknown;
};

interface AggregationResult {
  type: string;
  title: string;
  author: string;
  url: string;
  status: 'processed' | 'error';
  content_id?: string;
  error?: string;
  [key: string]: unknown;
}

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

function cleanCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const codePoint = parseInt(hex, 16);
      return Number.isNaN(codePoint) ? _ : String.fromCharCode(codePoint);
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const codePoint = parseInt(dec, 10);
      return Number.isNaN(codePoint) ? _ : String.fromCharCode(codePoint);
    })
    .replace(/&(amp|lt|gt|quot|apos|#39);/g, (entity: string) => HTML_ENTITY_MAP[entity] ?? entity);
}

function stripHtmlTags(value: string): string {
  return value
    .replace(/<br\s*\/?/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTagValue(item: string, tagName: string): string | null {
  const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)</${escapedTag}>`, 'i');
  const match = item.match(regex);
  if (!match) {
    return null;
  }
  return cleanCdata(match[1]).trim();
}

function extractEnclosureUrl(item: string): string | null {
  const enclosureMatch = item.match(/<enclosure[^>]+url="([^"]+)"[^>]*>/i);
  if (!enclosureMatch) {
    return null;
  }
  return cleanCdata(enclosureMatch[1]).trim();
}

function parseDurationToSeconds(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const sanitized = value.trim();
  if (sanitized.length === 0) {
    return null;
  }

  if (/^\d+$/.test(sanitized)) {
    return parseInt(sanitized, 10);
  }

  const parts = sanitized.split(':').map((part) => parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return null;
}

function parsePublishedDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function normalizePodcastEpisode(item: string, feedUrl: string): NormalizedPodcastEpisode | null {
  const rawTitle = extractTagValue(item, 'title');
  const rawLink = extractTagValue(item, 'link');
  const rawGuid = extractTagValue(item, 'guid');
  const rawPubDate = extractTagValue(item, 'pubDate');
  const rawDuration = extractTagValue(item, 'itunes:duration');
  const rawContent = extractTagValue(item, 'content:encoded');
  const rawDescription = extractTagValue(item, 'description');
  const enclosureUrl = extractEnclosureUrl(item);

  const title = rawTitle ? stripHtmlTags(decodeHtmlEntities(rawTitle)) : 'Untitled episode';

  const combinedDescription = [rawContent, rawDescription]
    .filter((segment): segment is string => typeof segment === 'string' && segment.trim().length > 0)
    .join('\n\n');

  const description = combinedDescription
    ? stripHtmlTags(decodeHtmlEntities(combinedDescription))
    : '';

  const audioUrl = enclosureUrl ? decodeHtmlEntities(enclosureUrl) : null;

  const link = rawLink ? decodeHtmlEntities(rawLink).trim() : null;
  const guid = rawGuid ? decodeHtmlEntities(rawGuid).trim() : null;
  const originalUrl = link || audioUrl || (guid ? `${feedUrl}#${guid}` : null);

  if (!originalUrl) {
    return null;
  }

  const publishedDate = parsePublishedDate(rawPubDate ? decodeHtmlEntities(rawPubDate) : null);
  const duration = parseDurationToSeconds(rawDuration ? decodeHtmlEntities(rawDuration) : null);

  const summaryParts: string[] = [];
  if (description) {
    summaryParts.push(description);
  }
  if (audioUrl) {
    summaryParts.push(`Listen: ${audioUrl}`);
  }
  if (publishedDate) {
    summaryParts.push(`Published: ${new Date(publishedDate).toUTCString()}`);
  }

  const summaryContent = summaryParts.join('\n\n').trim() || `Episode: ${title}`;

  return {
    title,
    description,
    publishedDate,
    duration,
    audioUrl,
    originalUrl,
    summaryContent,
  };
}

function getPodcastFeedFromSource(source: InfluencerSourceRecord): string | null {
  const metadata = source.platform_metadata;
  if (metadata && typeof metadata === 'object') {
    const podcastsEntry = (metadata as { podcasts?: unknown }).podcasts;
    if (podcastsEntry && typeof podcastsEntry === 'object') {
      const { feed_url, feedUrl } = podcastsEntry as PodcastMetadataRecord;
      const candidate = typeof feed_url === 'string' && feed_url.trim().length > 0
        ? feed_url.trim()
        : typeof feedUrl === 'string' && feedUrl.trim().length > 0
          ? feedUrl.trim()
          : null;
      if (candidate) {
        return candidate;
      }
    }
  }

  if (typeof source.influencer_id === 'string' && source.influencer_id.startsWith('http')) {
    return source.influencer_id;
  }

  return null;
}

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

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
      const results: AggregationResult[] = [];

    // Process each influencer source
    const sources = (influencerSources || []) as InfluencerSourceRecord[];

    for (const source of sources) {
      console.log(`Processing source: ${source.influencer_name}`);

      try {
        const selectedPlatforms = Array.isArray(source.selected_platforms)
          ? source.selected_platforms
          : [];

        // Process YouTube content
        if (selectedPlatforms.includes('youtube')) {
          const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
          if (YOUTUBE_API_KEY) {
            console.log(`Fetching YouTube content for ${source.influencer_name}`);
            
            // Extract channel ID - assume influencer_id is the channel ID or URL
            let channelId = source.influencer_id;
            if (source.influencer_id.includes('youtube.com') || source.influencer_id.includes('youtu.be')) {
              const channelMatch = source.influencer_id.match(/channel\/([^/?]+)/);
              const userMatch = source.influencer_id.match(/user\/([^/?]+)/);
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
        if (selectedPlatforms.includes('podcasts')) {
          console.log(`Fetching podcast content for ${source.influencer_name}`);

          const feedUrl = getPodcastFeedFromSource(source);

          if (!feedUrl) {
            console.warn(`No podcast feed configured for ${source.influencer_name}. Skipping podcast ingestion.`);
          } else {
            try {
              const feedResponse = await fetch(feedUrl);
              if (!feedResponse.ok) {
                throw new Error(`Failed to fetch podcast feed. Status: ${feedResponse.status}`);
              }

              const feedText = await feedResponse.text();
              const itemMatches = feedText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
              const latestEpisodes = itemMatches.slice(0, 3);

              for (const itemMatch of latestEpisodes) {
                const episode = normalizePodcastEpisode(itemMatch, feedUrl);
                if (!episode) {
                  continue;
                }

                try {
                  const { data: existingItems, error: existingError } = await supabaseClient
                    .from('content_items')
                    .select('id')
                    .eq('original_url', episode.originalUrl)
                    .eq('user_id', user.id)
                    .limit(1);

                  if (existingError) {
                    throw existingError;
                  }

                  if (existingItems && existingItems.length > 0) {
                    continue;
                  }

                  const summaryLength = 'standard';
                  const { data: processedData, error: processError } = await supabaseClient.functions.invoke('content-processor', {
                    body: {
                      title: episode.title,
                      content: episode.summaryContent,
                      author: source.influencer_name,
                      platform: 'podcasts',
                      contentType: 'podcasts',
                      originalUrl: episode.originalUrl,
                      summaryLength,
                      metadata: {
                        podcast_name: source.influencer_name,
                        feed_url: feedUrl,
                        audio_url: episode.audioUrl,
                        published_at: episode.publishedDate,
                        duration_seconds: episode.duration,
                      }
                    }
                  });

                  if (processError) {
                    throw processError;
                  }

                  if (!processedData?.processed || !processedData?.id) {
                    throw new Error('Podcast summarization did not return a content identifier');
                  }

                  const { error: upsertEpisodeError } = await supabaseClient
                    .from('podcast_episodes')
                    .upsert({
                      user_id: user.id,
                      podcast_name: source.influencer_name,
                      episode_title: episode.title,
                      episode_url: episode.originalUrl,
                      audio_url: episode.audioUrl,
                      published_date: episode.publishedDate,
                      duration: episode.duration,
                      description: episode.description,
                      transcript: null,
                      summary: processedData.summary,
                      tags: processedData.tags || [],
                      sentiment: processedData.sentiment || 'neutral'
                    }, { onConflict: 'user_id,episode_url' });

                  if (upsertEpisodeError) {
                    throw upsertEpisodeError;
                  }

                  processedCount++;
                  results.push({
                    type: 'podcasts',
                    title: episode.title,
                    author: source.influencer_name,
                    url: episode.originalUrl,
                    status: 'processed',
                    content_id: processedData.id
                  });
                } catch (episodeError) {
                  console.error(`Error processing podcast episode ${episode.title}:`, episodeError);
                  const errorMessage = episodeError instanceof Error ? episodeError.message : String(episodeError);
                  results.push({
                    type: 'podcasts',
                    title: episode.title,
                    author: source.influencer_name,
                    url: episode.originalUrl,
                    status: 'error',
                    error: errorMessage
                  });
                }
              }
            } catch (feedError) {
              console.error(`Error processing podcast RSS feed for ${source.influencer_name}:`, feedError);
            }
          }
        }

        // Process Substack/Newsletter content
        if (selectedPlatforms.includes('substack') || selectedPlatforms.includes('newsletters')) {
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