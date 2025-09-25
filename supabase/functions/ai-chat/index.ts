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
    const { message, contentId, conversationId } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Full auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracted token length:', token.length);
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    console.log('User from auth:', user ? `User ID: ${user.id}` : 'No user found');
    console.log('Auth error:', authError);
    
    if (!user) {
      throw new Error(`User not authenticated: ${authError?.message || 'Unknown auth error'}`);
    }

    let conversation;
    let contentContext = '';

    // Get or create conversation
    if (conversationId) {
      const { data } = await supabaseClient
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();
      conversation = data;
    } else if (contentId) {
      // Create new conversation for content
      const { data } = await supabaseClient
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          content_id: contentId,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .maybeSingle();
      conversation = data;
    } else {
      // Create general conversation
      const { data } = await supabaseClient
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: message.substring(0, 50) + '...'
        })
        .select()
        .maybeSingle();
      conversation = data;
    }

    // Get content context if contentId provided
    if (contentId) {
      // Handle mock content
      if (contentId.startsWith('mock-')) {
        const mockContent = getMockContent(contentId);
        if (mockContent) {
          contentContext = `
Content Context:
Title: ${mockContent.title}
Author: ${mockContent.author}
Platform: ${mockContent.platform}
Summary: ${mockContent.summary}
Full Content: ${mockContent.full_content}
          `;
        }
      } else {
        // Handle real database content
        const { data: contentData } = await supabaseClient
          .from('content_items')
          .select('title, summary, full_content, author, platform')
          .eq('id', contentId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (contentData) {
          contentContext = `
Content Context:
Title: ${contentData.title}
Author: ${contentData.author}
Platform: ${contentData.platform}
Summary: ${contentData.summary}
Full Content: ${contentData.full_content}
          `;
        }
      }
    }

    // Mock content data for development
    function getMockContent(contentId: string) {
      const mockData: Record<string, any> = {
        'mock-1': {
          title: "Crypto Market Analysis Q4 2024",
          author: "Alex Chen",
          platform: "CoinDesk",
          summary: "A comprehensive analysis of the cryptocurrency market trends in Q4 2024, covering Bitcoin's resilience, Ethereum's upgrade impact, and emerging altcoin opportunities.",
          full_content: "The cryptocurrency market in Q4 2024 has shown remarkable resilience despite regulatory uncertainties. Bitcoin has maintained its position above $40,000, driven by institutional adoption and increasing acceptance as a store of value. Ethereum's recent network upgrades have significantly improved transaction efficiency, positioning it strongly for continued DeFi growth. Key altcoins including Solana, Cardano, and Polygon have demonstrated strong fundamentals and growing ecosystems. Market analysts predict continued bullish sentiment heading into 2025, with particular strength expected in the DeFi and NFT sectors."
        },
        'mock-2': {
          title: "Federal Reserve Policy Impact on Markets",
          author: "Sarah Johnson",
          platform: "Financial Times",
          summary: "Analysis of how recent Federal Reserve policy changes are affecting various asset classes and what investors should expect in the coming months.",
          full_content: "The Federal Reserve's recent policy adjustments have created significant ripple effects across financial markets. With interest rates remaining elevated, traditional bond investments are showing renewed attractiveness while growth stocks face continued pressure. The Fed's commitment to fighting inflation has strengthened the dollar but created headwinds for commodities and international investments. Investors are advised to maintain diversified portfolios and consider defensive positioning as monetary policy continues to evolve."
        }
      };
      return mockData[contentId];
    }

    // Get conversation history
    const { data: messages } = await supabaseClient
      .from('chat_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    // Save user message
    await supabaseClient
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'user',
        content: message
      });

    // Prepare messages for OpenAI
    const systemMessage = contentContext ? 
      `You are an AI assistant helping analyze financial content. You have access to the following content for reference: ${contentContext}. Answer questions about this content and provide insights based on it. Be specific and reference details from the content when relevant.` :
      `You are an AI assistant for Market Minds, a financial research platform. Help users with their financial research questions and provide insights on market trends, crypto, macro economics, and investment analysis.`;

    const openAIMessages = [
      { role: 'system', content: systemMessage },
      ...(messages || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ];

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save assistant message
    await supabaseClient
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantMessage
      });

    return new Response(
      JSON.stringify({ 
        message: assistantMessage, 
        conversationId: conversation.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});