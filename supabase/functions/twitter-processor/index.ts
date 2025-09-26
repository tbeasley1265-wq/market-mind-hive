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
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  const items = [] as Array<Record<string, unknown>>;

  for (const raw of itemMatches) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const dateMatch = raw.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const guidMatch = raw.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const descriptionMatch = raw.match(/<description[^>]*>([\s\S]*?)<\/description>/i);

    items.push({
      id: cleanText(guidMatch?.[1] || titleMatch?.[1] || linkMatch?.[1]),
      title: cleanText(titleMatch?.[1] || ''),
      url: cleanText(linkMatch?.[1] || ''),
      publishedAt: dateMatch ? new Date(cleanText(dateMatch[1])).toISOString() : null,
      summary: cleanText(descriptionMatch?.[1] || ''),
    });
  }

  return items;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { handle, maxItems = 10 } = await req.json();

    if (!handle) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: handle',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedHandle = handle.replace(/^@/, '').trim();

    try {
      const feedResponse = await fetch(`https://r.jina.ai/https://nitter.net/${encodeURIComponent(normalizedHandle)}/rss`);

      if (!feedResponse.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to fetch Twitter feed: ${feedResponse.status}`,
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
        warnings: items.length === 0 ? ['No tweets found for handle'] : undefined,
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
    console.error('twitter-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
