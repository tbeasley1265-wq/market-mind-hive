import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const cleanText = (value: string | null | undefined): string => {
  if (!value) return '';
  return value
    .replace(/<!\[CDATA\[/g, '')
    .replace(/]]>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .trim();
};

const parseRssItems = (xml: string, limit: number) => {
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  const entries = [] as Array<Record<string, unknown>>;

  for (const raw of itemMatches.slice(0, limit)) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const descriptionMatch = raw.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const dateMatch = raw.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);

    entries.push({
      title: cleanText(titleMatch?.[1] || ''),
      url: cleanText(linkMatch?.[1] || ''),
      summary: cleanText(descriptionMatch?.[1] || ''),
      publishedAt: dateMatch ? new Date(cleanText(dateMatch[1])).toISOString() : null,
    });
  }

  return entries;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedUrl, influencerName, maxItems = 5 } = await req.json();

    if (!feedUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: feedUrl',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const response = await fetch(feedUrl);

      if (!response.ok) {
        return new Response(JSON.stringify({
          success: false,
          error: `Failed to fetch RSS feed: ${response.status}`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const xml = await response.text();
      const items = parseRssItems(xml, maxItems);

      return new Response(JSON.stringify({
        success: items.length > 0,
        items,
        warnings: items.length === 0 ? ['No RSS items found'] : undefined,
        details: {
          feedUrl,
          influencerName,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error fetching RSS feed';
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
    console.error('rss-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
