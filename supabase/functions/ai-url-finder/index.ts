import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { influencerName, selectedPlatforms } = await req.json();
    
    if (!influencerName) {
      return new Response(
        JSON.stringify({ error: 'Influencer name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Finding URLs for: ${influencerName}`);
    console.log(`📋 Platforms requested: ${selectedPlatforms?.join(', ')}`);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a detailed prompt for GPT to find platform URLs
    const prompt = `You are an expert at finding social media and content platform URLs for public figures and influencers in finance, crypto, and technology.

Find the official platform URLs/identifiers for: ${influencerName}

Platforms to find:
${selectedPlatforms?.map((p: string) => `- ${p}`).join('\n')}

RETURN FORMAT RULES:
1. YouTube: Return ONLY the channel ID (e.g., "UCJ9yBKzd2I1VGFRfz7-TsJw")
   - Found after /channel/ or /@username in the URL
   - Example: youtube.com/channel/UCJ9yBKzd2I1VGFRfz7-TsJw → return "UCJ9yBKzd2I1VGFRfz7-TsJw"
   
2. Twitter: Return ONLY the handle WITHOUT @ (e.g., "RaoulGMI")
   - Example: twitter.com/RaoulGMI → return "RaoulGMI"
   
3. Podcasts: Return the RSS feed URL
   - Usually from Apple Podcasts, Spotify, or their website
   - Must be a valid RSS/XML feed URL
   - Example: "https://feeds.simplecast.com/xyz123"
   
4. Substack: Return the feed URL with /feed at the end
   - Example: "https://username.substack.com/feed"
   
5. Newsletters: Return newsletter RSS feed or signup URL
   - Could be the same as Substack feed
   - Example: "https://newsletter.example.com/feed"

ACCURACY RULES:
- Only return URLs/IDs you are HIGHLY CONFIDENT about
- If you cannot find a platform, return null for that platform
- Double-check channel IDs and handles for accuracy
- Wrong URLs are worse than missing URLs

Return ONLY valid JSON in this EXACT format:
{
  "youtube": "channel_id_or_null",
  "twitter": "handle_or_null",
  "podcasts": "rss_url_or_null",
  "substack": "feed_url_or_null",
  "newsletters": "feed_url_or_null",
  "confidence": "high",
  "notes": "Brief notes about findings"
}`;

    // Call OpenAI GPT-4
    console.log('🤖 Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert researcher specializing in finding social media and content platforms for public figures. You always return valid, accurate JSON responses with real URLs and identifiers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0].message.content;
    
    console.log('📝 AI Response received:', aiResponse);
    
    let platformIdentifiers;
    try {
      platformIdentifiers = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', aiResponse);
      throw new Error('AI returned invalid JSON');
    }

    // Validate and clean up the response
    const validatedIdentifiers: Record<string, string> = {};
    
    for (const platform of selectedPlatforms || []) {
      const value = platformIdentifiers[platform];
      if (value && value !== 'null' && value !== null && value.trim() !== '') {
        validatedIdentifiers[platform] = value.trim();
        console.log(`✓ Found ${platform}: ${value}`);
      } else {
        console.log(`⚠ Missing ${platform}`);
      }
    }

    // Verify URLs are accessible
    console.log('🔍 Verifying URLs...');
    const verificationResults = await verifyUrls(validatedIdentifiers);

    const foundCount = Object.keys(verificationResults.validUrls).length;
    const requestedCount = selectedPlatforms?.length || 0;
    
    console.log(`✅ Successfully found ${foundCount} of ${requestedCount} platforms`);

    return new Response(
      JSON.stringify({
        success: true,
        platformIdentifiers: verificationResults.validUrls,
        confidence: platformIdentifiers.confidence || 'medium',
        notes: platformIdentifiers.notes || '',
        verificationErrors: verificationResults.errors,
        foundCount,
        requestedCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error in ai-url-finder:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to verify URLs are actually accessible
async function verifyUrls(identifiers: Record<string, string>) {
  const validUrls: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const [platform, identifier] of Object.entries(identifiers)) {
    try {
      if (platform === 'youtube' && identifier) {
        // Verify YouTube channel exists
        const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
        if (YOUTUBE_API_KEY) {
          console.log(`Verifying YouTube channel: ${identifier}`);
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${identifier}&part=snippet`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
              validUrls[platform] = identifier;
              console.log(`✓ YouTube channel verified: ${data.items[0].snippet.title}`);
            } else {
              errors[platform] = 'Channel not found';
              console.warn(`⚠ YouTube channel not found: ${identifier}`);
            }
          } else {
            errors[platform] = `API error: ${response.status}`;
          }
        } else {
          // No API key, accept as-is
          validUrls[platform] = identifier;
          console.log(`⚠ YouTube API key not set, accepting without verification`);
        }
      } else if (platform === 'podcasts' && identifier) {
        // Verify RSS feed is accessible
        console.log(`Verifying podcast feed: ${identifier}`);
        try {
          const response = await fetch(identifier, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok || response.status === 405) { // Some feeds don't support HEAD
            validUrls[platform] = identifier;
            console.log(`✓ Podcast feed verified`);
          } else {
            errors[platform] = `Feed not accessible (${response.status})`;
            console.warn(`⚠ Podcast feed error: ${response.status}`);
          }
        } catch (fetchError) {
          // Timeout or network error - include anyway
          validUrls[platform] = identifier;
          errors[platform] = 'Could not verify (included anyway)';
          console.warn(`⚠ Could not verify podcast feed: ${fetchError}`);
        }
      } else if ((platform === 'substack' || platform === 'newsletters') && identifier) {
        // Verify Substack/newsletter feed
        console.log(`Verifying ${platform} feed: ${identifier}`);
        try {
          const response = await fetch(identifier, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok || response.status === 405) {
            validUrls[platform] = identifier;
            console.log(`✓ ${platform} feed verified`);
          } else {
            errors[platform] = `Feed not accessible (${response.status})`;
            console.warn(`⚠ ${platform} feed error: ${response.status}`);
          }
        } catch (fetchError) {
          // Include anyway
          validUrls[platform] = identifier;
          errors[platform] = 'Could not verify (included anyway)';
          console.warn(`⚠ Could not verify ${platform} feed: ${fetchError}`);
        }
      } else if (platform === 'twitter' && identifier) {
        // For Twitter, just validate format (API verification requires auth)
        if (/^[a-zA-Z0-9_]{1,15}$/.test(identifier)) {
          validUrls[platform] = identifier;
          console.log(`✓ Twitter handle format valid: @${identifier}`);
        } else {
          errors[platform] = 'Invalid handle format';
          console.warn(`⚠ Invalid Twitter handle: ${identifier}`);
        }
      } else {
        // For other platforms, accept as-is
        validUrls[platform] = identifier;
      }
    } catch (verifyError) {
      console.warn(`⚠ Verification error for ${platform}: ${verifyError}`);
      // Still include it, but note the error
      validUrls[platform] = identifier;
      errors[platform] = 'Could not verify (included anyway)';
    }
  }

  return { validUrls, errors };
}
