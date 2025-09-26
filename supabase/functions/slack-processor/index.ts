import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const toTimestamp = (ts: string | undefined): string | null => {
  if (!ts) return null;
  const [seconds] = ts.split('.');
  const millis = Number(seconds) * 1000;
  if (Number.isNaN(millis)) return null;
  return new Date(millis).toISOString();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelId, maxItems = 10 } = await req.json();

    if (!channelId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: channelId',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = Deno.env.get('SLACK_BOT_TOKEN');

    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slack bot token not configured',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL('https://slack.com/api/conversations.history');
    url.searchParams.set('channel', channelId);
    url.searchParams.set('limit', `${maxItems}`);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `Slack API responded with status ${response.status}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json() as {
      ok?: boolean;
      error?: string;
      messages?: unknown[];
    };

    if (!data.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: data.error || 'Slack API error',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawMessages: unknown[] = Array.isArray(data.messages) ? data.messages : [];

    const items = rawMessages.map((entry) => {
      const message = entry as Record<string, unknown>;
      const text = typeof message.text === 'string' ? message.text : '';
      const user = typeof message.user === 'string'
        ? message.user
        : typeof message.username === 'string'
          ? message.username
          : 'Slack User';
      const ts = typeof message.ts === 'string' ? message.ts : undefined;
      const type = typeof message.type === 'string' ? message.type : 'message';

      return {
        text,
        user,
        ts: ts ?? null,
        publishedAt: toTimestamp(ts),
        type,
      };
    });

    return new Response(JSON.stringify({
      success: items.length > 0,
      items,
      warnings: items.length === 0 ? ['No Slack messages returned'] : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('slack-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
