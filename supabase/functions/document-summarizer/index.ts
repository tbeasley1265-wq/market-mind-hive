import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, fileContent, summaryLength = 'medium' } = await req.json();

    if (!fileName || !fileContent) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fileName and fileContent' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode base64 content
    let textContent = '';
    try {
      // For text files, directly decode
      if (fileType.startsWith('text/') || fileType === 'application/json') {
        textContent = atob(fileContent);
      } else {
        // For other file types (PDF, DOC, etc.), we would need additional parsing
        // For now, we'll return an error for unsupported types
        return new Response(
          JSON.stringify({ error: 'File type not supported yet. Please use text files (.txt, .md) for now.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error decoding file content:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid file content encoding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine summary length instructions
    let lengthInstruction = '';
    switch (summaryLength) {
      case 'short':
        lengthInstruction = 'Provide a concise 2-3 sentence summary.';
        break;
      case 'long':
        lengthInstruction = 'Provide a detailed summary with multiple paragraphs covering all key points.';
        break;
      default:
        lengthInstruction = 'Provide a medium-length summary in 1-2 paragraphs.';
    }

    console.log(`Processing document: ${fileName}`);

    // Generate summary using OpenAI
    const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a financial research analyst tasked with summarizing documents. Focus on:
            - Key financial insights and analysis
            - Market implications and trends
            - Investment opportunities or risks
            - Economic indicators and data
            - Actionable takeaways for investors
            
            ${lengthInstruction}
            
            Format your response as a clear, professional summary that highlights the most important points for financial decision-making.`
          },
          {
            role: 'user',
            content: `Please summarize this document titled "${fileName}":\n\n${textContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!summaryResponse.ok) {
      const errorData = await summaryResponse.text();
      console.error('OpenAI API error for summary:', errorData);
      throw new Error(`OpenAI API error: ${summaryResponse.status}`);
    }

    const summaryData = await summaryResponse.json();
    const summary = summaryData.choices[0].message.content;

    // Generate tags and sentiment
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst. Based on the summary provided, extract relevant tags (3-6 keywords) and determine the overall sentiment (bullish, bearish, or neutral). Return your response in this exact JSON format: {"tags": ["tag1", "tag2", "tag3"], "sentiment": "neutral"}'
          },
          {
            role: 'user',
            content: `Analyze this summary and extract tags and sentiment:\n\n${summary}`
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.text();
      console.error('OpenAI API error for analysis:', errorData);
      throw new Error(`OpenAI API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let tags = [];
    let sentiment = 'neutral';

    try {
      const analysis = JSON.parse(analysisData.choices[0].message.content);
      tags = analysis.tags || [];
      sentiment = analysis.sentiment || 'neutral';
    } catch (error) {
      console.error('Error parsing analysis response:', error);
      // Fallback values
      tags = ['Document', 'Analysis'];
      sentiment = 'neutral';
    }

    console.log(`Document processed successfully: ${fileName}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          title: fileName.replace(/\.[^/.]+$/, ''), // Remove file extension
          summary,
          tags,
          sentiment,
          source: 'Document Upload',
          platform: 'document',
          author: 'User Upload',
          timestamp: new Date().toISOString(),
          originalFileName: fileName
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in document-summarizer function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});