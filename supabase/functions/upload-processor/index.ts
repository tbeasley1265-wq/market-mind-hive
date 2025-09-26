import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, sourceIdentifier, maxItems = 10 } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: userId',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Supabase configuration is incomplete',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from('content_items')
      .select('id, title, summary, original_url, platform, content_type, created_at, metadata')
      .eq('user_id', userId)
      .in('platform', ['document', 'upload', 'uploaded_doc'])
      .order('created_at', { ascending: false })
      .limit(maxItems);

    if (error) {
      return new Response(JSON.stringify({
        success: false,
        error: `Failed to load uploaded content: ${error.message}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    type UploadRecord = {
      id: string;
      title: string;
      summary: string | null;
      original_url: string | null;
      platform: string;
      content_type: string;
      created_at: string;
      metadata: Record<string, unknown> | null;
    };

    const items = ((data as UploadRecord[] | null) ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      url: item.original_url,
      platform: item.platform,
      contentType: item.content_type,
      createdAt: item.created_at,
      metadata: item.metadata,
      sourceIdentifier,
    }));

    return new Response(JSON.stringify({
      success: items.length > 0,
      items,
      warnings: items.length === 0 ? ['No uploaded documents found'] : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('upload-processor error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
