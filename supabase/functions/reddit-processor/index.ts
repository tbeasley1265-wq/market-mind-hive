import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanText = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
};

const parseRssItems = (xml: string) => {
  const itemMatches = xml.match(/<entry[^>]*>([\s\S]*?)<\/entry>/gi) || [];
  const items = [] as Array<Record<string, unknown>>;

  for (const raw of itemMatches) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[^>]*href="([^"]+)"[^>]*>/i);
    const dateMatch = raw.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);
    const authorMatch = raw.match(/<name[^>]*>([\s\S]*?)<\/name>/i);
    const contentMatch = raw.match(/<content[^>]*>([\s\S]*?)<\/content>/i);

    items.push({
      title: cleanText(titleMatch?.[1] || ''),
      url: cleanText(linkMatch?.[1] || ''),
      author: cleanText(authorMatch?.[1] || 'Reddit User'),
      publishedAt: dateMatch ? new Date(cleanText(dateMatch[1])).toISOString() : null,
      summary: cleanText(contentMatch?.[1] || ''),
    });
  }

  return items;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subreddit, maxItems = 10 } = await req.json();

    if (!subreddit) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: subreddit',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedSubreddit = subreddit.replace(/^r\//, '').trim();

    try {
      const feedResponse = await fetch(`https://www.reddit.com/r/${encodeURIComponent(normalizedSubreddit)}.rss`);

      if (!feedResponse.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to fetch subreddit feed: ${feedResponse.status}`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const feedText = await feedResponse.text();
      const items = parseRssItems(feedText).slice(0, maxItems);

      return new Response(JSON.stringify({
        success: items.length > 0,
        items,
        warnings: items.length === 0 ? ['No posts found for subreddit'] : undefined,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error fetching feed';
      return new Response(JSON.stringify({
        success: false,
        error: errorMessage,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('reddit-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
