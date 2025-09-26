import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type NormalizedItem = Record<string, unknown>;

type PlatformHandlerResult = {
  success: boolean;
  processedItems: number;
  items: NormalizedItem[];
  error?: string;
  warnings?: string[];
  details?: Record<string, unknown>;
};

type PlatformWorkerResponse = {
  success?: boolean;
  processedItems?: number;
  items?: NormalizedItem[];
  error?: string;
  warnings?: string[];
  details?: Record<string, unknown>;
};

interface InfluencerSource {
  id: string;
  influencer_id: string;
  influencer_name: string;
  selected_platforms: string[];
  [key: string]: unknown;
}

type PlatformHandler = (source: InfluencerSource) => Promise<PlatformHandlerResult>;

type AggregationResult = {
  sourceId: string;
  influencerId: string;
  influencerName: string;
  platform: string;
  success: boolean;
  processedItems: number;
  items: NormalizedItem[];
  error?: string;
  warnings?: string[];
  details?: Record<string, unknown>;
};

interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
  };
}

interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizePlatformKey = (platform: string): string => {
  switch (platform) {
    case 'newsletters':
      return 'rss';
    case 'substack':
      return 'rss';
    case 'emails':
      return 'email';
    case 'podcast':
      return 'podcasts';
    default:
      return platform;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    if (userError || !user) {
      console.log('Authentication failed');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Starting content aggregation for user: ${user.id}`);

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

    const platformHandlers: Record<string, PlatformHandler> = {
      youtube: async (source) => {
        const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
        if (!YOUTUBE_API_KEY) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: 'YouTube API key not configured',
          };
        }

        let channelId = source.influencer_id;
        if (channelId.includes('youtube.com') || channelId.includes('youtu.be')) {
          const channelMatch = channelId.match(/channel\/([^/?]+)/);
          const userMatch = channelId.match(/user\/([^/?]+)/);
          if (channelMatch) {
            channelId = channelMatch[1];
          } else if (userMatch) {
            channelId = userMatch[1];
          }
        }

        try {
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=3`
          );

          if (!searchResponse.ok) {
            return {
              success: false,
              processedItems: 0,
              items: [],
              error: `YouTube API error: ${searchResponse.status}`,
            };
          }

          const searchData: YouTubeSearchResponse = await searchResponse.json();
          const items: NormalizedItem[] = [];

          for (const item of searchData.items || []) {
            const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;

            const { data: existing } = await supabaseClient
              .from('content_items')
              .select('id')
              .eq('original_url', videoUrl)
              .eq('user_id', user.id)
              .single<{ id: string }>();

            if (existing) {
              items.push({
                title: item.snippet.title,
                url: videoUrl,
                author: item.snippet.channelTitle,
                platform: 'youtube',
                status: 'skipped',
                reason: 'Already processed',
              });
              continue;
            }

            const videoResponse = await supabaseClient.functions.invoke<PlatformWorkerResponse>('video-summarizer', {
              body: {
                videoUrl,
                summaryLength: 'standard',
              },
            });

            if (videoResponse.error) {
              items.push({
                title: item.snippet.title,
                url: videoUrl,
                author: item.snippet.channelTitle,
                platform: 'youtube',
                status: 'error',
                error: videoResponse.error.message,
              });
              continue;
            }
            const processed = videoResponse.data as PlatformWorkerResponse | null;
            const processedDetails = processed?.details as Record<string, unknown> | undefined;
            const processedItems = Array.isArray(processed?.items) ? processed.items : [];
            const firstItem = processedItems.length > 0 ? processedItems[0] : null;
            const firstItemId =
              firstItem && typeof firstItem === 'object' && 'id' in firstItem && typeof (firstItem as Record<string, unknown>).id === 'string'
                ? (firstItem as Record<string, unknown>).id
                : null;
            const summaryId = typeof processedDetails?.id === 'string' ? processedDetails.id : firstItemId;

            items.push({
              title: item.snippet.title,
              url: videoUrl,
              author: item.snippet.channelTitle,
              platform: 'youtube',
              status: 'processed',
              summaryId,
            });
          }

          const processedItems = items.filter((item) => item.status === 'processed').length;

          return {
            success: processedItems > 0,
            processedItems,
            items,
            warnings: processedItems === 0 ? ['No new YouTube videos found'] : undefined,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: errorMessage,
          };
        }
      },
      podcasts: async (source) => {
        let feedUrl = source.influencer_id;
        if (feedUrl.includes('feed') === false && feedUrl.includes('http')) {
          feedUrl = feedUrl.replace(/\/$/, '') + '/feed';
        }

        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('podcast-processor', {
          body: {
            feedUrl,
            influencerName: source.influencer_name,
            influencerId: source.influencer_id,
            userId: user.id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.processedItems || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
          details: data.details,
        };
      },
      twitter: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('twitter-processor', {
          body: {
            handle: source.influencer_id,
            userId: user.id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.items?.length || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
        };
      },
      reddit: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('reddit-processor', {
          body: {
            subreddit: source.influencer_id,
            userId: user.id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.items?.length || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
        };
      },
      email: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('email-processor', {
          body: {
            userId: user.id,
            sourceIdentifier: source.influencer_id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.processedItems || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
          details: data.details,
        };
      },
      slack: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('slack-processor', {
          body: {
            channelId: source.influencer_id,
            userId: user.id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.items?.length || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
        };
      },
      rss: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('rss-processor', {
          body: {
            feedUrl: source.influencer_id,
            influencerName: source.influencer_name,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.items?.length || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
        };
      },
      uploads: async (source) => {
        const response = await supabaseClient.functions.invoke<PlatformWorkerResponse>('upload-processor', {
          body: {
            userId: user.id,
            sourceIdentifier: source.influencer_id,
          },
        });

        if (response.error) {
          return {
            success: false,
            processedItems: 0,
            items: [],
            error: response.error.message,
          };
        }

        const data = (response.data as PlatformWorkerResponse | null) ?? {};
        return {
          success: Boolean(data.success),
          processedItems: data.items?.length || 0,
          items: data.items || [],
          error: data.error,
          warnings: data.warnings,
        };
      },
    };

    for (const source of influencerSources || []) {
      console.log(`Processing source: ${source.influencer_name}`);
      const platforms: string[] = Array.isArray(source.selected_platforms) ? source.selected_platforms : [];

      for (const platform of platforms) {
        const normalizedPlatform = normalizePlatformKey(platform);
        const handler = platformHandlers[normalizedPlatform];

        if (!handler) {
          results.push({
            sourceId: source.id,
            influencerId: source.influencer_id,
            influencerName: source.influencer_name,
            platform: normalizedPlatform,
            success: false,
            processedItems: 0,
            items: [],
            error: `No handler configured for platform: ${normalizedPlatform}`,
          });
          continue;
        }

        try {
          const handlerResult = await handler(source);
          processedCount += handlerResult.processedItems;

          results.push({
            sourceId: source.id,
            influencerId: source.influencer_id,
            influencerName: source.influencer_name,
            platform: normalizedPlatform,
            success: handlerResult.success,
            processedItems: handlerResult.processedItems,
            items: handlerResult.items,
            error: handlerResult.error,
            warnings: handlerResult.warnings,
            details: handlerResult.details,
          });
        } catch (platformError) {
          const message = platformError instanceof Error ? platformError.message : 'Unknown error occurred';
          console.error(`Error processing ${normalizedPlatform} for ${source.influencer_name}:`, platformError);

          results.push({
            sourceId: source.id,
            influencerId: source.influencer_id,
            influencerName: source.influencer_name,
            platform: normalizedPlatform,
            success: false,
            processedItems: 0,
            items: [],
            error: message,
          });
        }
      }
    }

    console.log(`Content aggregation completed. Processed ${processedCount} new items.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully processed ${processedCount} content items`,
      processedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in content aggregator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: errorMessage,
      success: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
