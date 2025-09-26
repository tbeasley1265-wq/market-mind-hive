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

const parseDuration = (value: string | null | undefined): number | null => {
  if (!value) return null;
  const parts = value.split(':').map((part) => parseInt(part, 10) || 0);
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
};

const parseRssItems = (xml: string, limit: number) => {
  const itemMatches = xml.match(/<item[^>]*>([\s\S]*?)<\/item>/gi) || [];
  const items = [] as Array<Record<string, unknown>>;

  for (const raw of itemMatches.slice(0, limit)) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
    const descriptionMatch = raw.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const pubDateMatch = raw.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
    const enclosureMatch = raw.match(/<enclosure[^>]*url="([^"]+)"[^>]*>/i);
    const durationMatch = raw.match(/<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/i);

    items.push({
      title: cleanText(titleMatch?.[1] || ''),
      url: cleanText(linkMatch?.[1] || ''),
      description: cleanText(descriptionMatch?.[1] || ''),
      publishedAt: pubDateMatch ? new Date(cleanText(pubDateMatch[1])).toISOString() : null,
      audioUrl: enclosureMatch ? cleanText(enclosureMatch[1]) : null,
      durationSeconds: parseDuration(cleanText(durationMatch?.[1] || '')), 
    });
  }

  return items;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedUrl, influencerName, maxItems = 3 } = await req.json();

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
          error: `Failed to fetch podcast feed: ${response.status}`,
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const xml = await response.text();
      const items = parseRssItems(xml, maxItems);

      return new Response(JSON.stringify({
        success: items.length > 0,
        processedItems: items.length,
        items,
        details: {
          feedUrl,
          influencerName,
        },
        warnings: items.length === 0 ? ['No podcast episodes found'] : undefined,
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
    console.error('podcast-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
