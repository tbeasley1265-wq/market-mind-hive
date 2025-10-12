import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title, author, platform, originalUrl, summaryLength = 'standard', userId } = await req.json();
    
    if (!content || !title) {
      throw new Error('Content and title are required');
    }

    let actualUserId: string;
    let supabaseClient: any;

    // AUTOMATED MODE: userId provided in body (called by content-aggregator)
    if (userId) {
      console.log('📅 AUTOMATED MODE: Processing for user:', userId);
      
      // Use service role client
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      actualUserId = userId;
      
    } else {
      // MANUAL MODE: Get user from auth header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header or userId provided');
      }

      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      actualUserId = user.id;
      console.log('🔧 MANUAL MODE: Processing for user:', actualUserId);
    }

    // Determine summary length instructions
    let lengthInstruction = '';
    switch (summaryLength) {
      case 'brief':
        lengthInstruction = 'Keep the summary very brief (2-3 sentences).';
        break;
      case 'detailed':
        lengthInstruction = 'Provide a detailed summary with key insights and quotes (4-6 paragraphs).';
        break;
      case 'standard':
      default:
        lengthInstruction = 'Provide a comprehensive but concise summary (2-3 paragraphs).';
        break;
    }

    console.log(`Processing content: "${title}" by ${author}`);

    // Generate summary using OpenAI
    const summaryPrompt = `
    ${lengthInstruction}

    Analyze this financial content and provide:
    1. A summary of the main points
    2. Key insights and takeaways
    3. Mentioned assets, companies, or important figures
    4. Overall sentiment (bullish/bearish/neutral)
    5. Notable quotes (if any)

    Title: ${title}
    Author: ${author}
    Platform: ${platform}
    Content: ${content.substring(0, 8000)}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial analyst. Provide clear, actionable summaries of financial content with focus on market insights, trends, and investment implications.'
          },
          {
            role: 'user',
            content: summaryPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    console.log(`✓ Generated summary (${summary.length} chars)`);

    // Extract tags and sentiment from the summary
    const tagPrompt = `Based on this content summary, extract relevant tags (max 6) and determine sentiment:
    
    ${summary}
    
    Return a JSON object with:
    - tags: array of relevant financial/market tags
    - sentiment: "bullish", "bearish", or "neutral"
    `;

    const tagResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial content tagger. Return only valid JSON.'
          },
          {
            role: 'user',
            content: tagPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    let tags = [];
    let sentiment = 'neutral';

    if (tagResponse.ok) {
      try {
        const tagData = await tagResponse.json();
        const extracted = JSON.parse(tagData.choices[0].message.content);
        tags = extracted.tags || [];
        sentiment = extracted.sentiment || 'neutral';
        console.log(`✓ Extracted tags: ${tags.join(', ')} | Sentiment: ${sentiment}`);
      } catch (e) {
        console.error('Error parsing tags:', e);
      }
    }

    // Save processed content to database
    const { data: savedContent, error } = await supabaseClient
      .from('content_items')
      .insert({
        user_id: actualUserId,
        title,
        content_type: 'processed',
        original_url: originalUrl,
        author,
        platform,
        summary,
        full_content: content.substring(0, 50000),
        metadata: {
          tags,
          sentiment,
          processed_at: new Date().toISOString(),
          summary_length: summaryLength
        }
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`✅ Saved to database with ID: ${savedContent.id}`);

    return new Response(
      JSON.stringify({
        id: savedContent.id,
        summary,
        tags,
        sentiment,
        processed: true,
        data: savedContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in content-processor function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        processed: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
