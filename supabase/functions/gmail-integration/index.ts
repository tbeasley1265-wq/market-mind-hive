import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, code, accessToken, userId, redirectUri } = await req.json();
    
    if (action === 'get_oauth_url') {
      // Generate OAuth URL with client credentials from environment
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const redirectUriEncoded = encodeURIComponent(redirectUri);
      const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly');
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${redirectUriEncoded}&` +
        `response_type=code&` +
        `scope=${scope}&` +
        `access_type=offline&` +
        `prompt=consent`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'exchange_code') {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: `${req.headers.get('origin')}/sources`
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange error:', error);
        throw new Error('Failed to exchange authorization code');
      }

      const tokens = await tokenResponse.json();
      
      // Store the credentials securely
      const { error: dbError } = await supabase
        .from('content_sources')
        .upsert({
          user_id: userId,
          source_type: 'gmail',
          source_name: 'Gmail Account',
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: Date.now() + (tokens.expires_in * 1000)
          },
          is_active: true
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to store credentials');
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'fetch_emails') {
      // Fetch emails from Gmail
      const { data: source } = await supabase
        .from('content_sources')
        .select('credentials')
        .eq('user_id', userId)
        .eq('source_type', 'gmail')
        .eq('is_active', true)
        .single();

      if (!source?.credentials?.access_token) {
        throw new Error('No Gmail credentials found');
      }

      // Check if token needs refresh
      let accessToken = source.credentials.access_token;
      if (Date.now() >= source.credentials.expires_at) {
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
            refresh_token: source.credentials.refresh_token,
            grant_type: 'refresh_token'
          })
        });

        if (refreshResponse.ok) {
          const newTokens = await refreshResponse.json();
          accessToken = newTokens.access_token;
          
          // Update stored credentials
          await supabase
            .from('content_sources')
            .update({
              credentials: {
                ...source.credentials,
                access_token: accessToken,
                expires_at: Date.now() + (newTokens.expires_in * 1000)
              }
            })
            .eq('user_id', userId)
            .eq('source_type', 'gmail');
        }
      }

      // Fetch emails from Gmail API
      const gmailResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      );

      if (!gmailResponse.ok) {
        throw new Error('Failed to fetch emails from Gmail');
      }

      const emailList = await gmailResponse.json();
      const processedEmails = [];

      // Process each email
      for (const message of emailList.messages || []) {
        try {
          const emailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          );

          if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            const headers = emailData.payload.headers;
            
            const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
            const date = headers.find((h: any) => h.name === 'Date')?.value;
            
            // Extract email body (simplified)
            let body = '';
            if (emailData.payload.body?.data) {
              body = atob(emailData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
            } else if (emailData.payload.parts) {
              for (const part of emailData.payload.parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                  body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                  break;
                }
              }
            }

            // Check if this looks like financial/research content
            const isRelevant = /crypto|bitcoin|market|analysis|research|trading|finance|investment|stock|ETF|fed|policy/i.test(subject + ' ' + body);
            
            if (isRelevant) {
              // Store processed email
              const { error: insertError } = await supabase
                .from('content_items')
                .insert({
                  user_id: userId,
                  title: subject,
                  content_type: 'email',
                  platform: 'gmail',
                  author: from,
                  full_content: body,
                  summary: body.substring(0, 500) + '...',
                  original_url: `https://mail.google.com/mail/u/0/#inbox/${message.id}`,
                  metadata: {
                    message_id: message.id,
                    date: date,
                    labels: emailData.labelIds
                  }
                });

              if (!insertError) {
                processedEmails.push({
                  subject,
                  sender: from,
                  processed: true,
                  tags: ['email', 'research']
                });
              }
            }
          }
        } catch (error) {
          console.error('Error processing email:', error);
        }
      }

      return new Response(JSON.stringify({ emails: processedEmails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in gmail-integration function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});