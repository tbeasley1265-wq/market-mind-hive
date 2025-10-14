import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('Fetching Gmail emails for user:', userId);

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's OAuth tokens
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      throw new Error('User not found');
    }

    // Get Google provider token
    const googleIdentity = user.identities?.find(identity => identity.provider === 'google');
    const accessToken = googleIdentity?.access_token;

    if (!accessToken) {
      throw new Error('No Google access token found. User needs to re-authenticate with Gmail permissions.');
    }

    console.log('Found access token, searching Gmail...');

    // Search for financial emails
    const searchQuery = encodeURIComponent(
      'subject:(invoice OR payment OR statement OR receipt OR bill) OR from:(bank OR paypal OR stripe OR square)'
    );

    const searchResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Gmail API search error:', errorText);
      throw new Error(`Gmail API error: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    const messages = searchData.messages || [];

    console.log(`Found ${messages.length} messages`);

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'No financial emails found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch full details for each message
    const emailPromises = messages.map(async (message: { id: string }) => {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!messageResponse.ok) {
        console.error(`Failed to fetch message ${message.id}`);
        return null;
      }

      return messageResponse.json();
    });

    const emailDetails = await Promise.all(emailPromises);
    const validEmails = emailDetails.filter(email => email !== null);

    console.log(`Processing ${validEmails.length} valid emails`);

    // Parse and insert emails
    const emailRecords = validEmails.map((email: any) => {
      const headers = email.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown';
      const date = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();

      // Get email body
      let fullContent = '';
      if (email.payload?.body?.data) {
        fullContent = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (email.payload?.parts) {
        const textPart = email.payload.parts.find((part: any) => part.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          fullContent = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      const snippet = email.snippet || '';

      // Detect category based on keywords
      let category = 'other';
      const lowerSubject = subject.toLowerCase();
      const lowerContent = (snippet + fullContent).toLowerCase();

      if (lowerSubject.includes('invoice') || lowerContent.includes('invoice')) {
        category = 'invoice';
      } else if (lowerSubject.includes('receipt') || lowerContent.includes('receipt')) {
        category = 'receipt';
      } else if (lowerSubject.includes('statement') || lowerContent.includes('statement')) {
        category = 'statement';
      } else if (lowerSubject.includes('payment') || lowerContent.includes('payment')) {
        category = 'payment';
      } else if (lowerSubject.includes('bill') || lowerContent.includes('bill')) {
        category = 'bill';
      }

      // Parse date
      let receivedAt = new Date();
      try {
        receivedAt = new Date(date);
      } catch (e) {
        console.error('Error parsing date:', date);
      }

      return {
        email_id: email.id,
        user_id: userId,
        subject,
        from_address: from,
        snippet,
        full_content: fullContent.substring(0, 10000), // Limit content length
        category,
        received_at: receivedAt.toISOString(),
      };
    });

    // Insert emails into database (ignore duplicates)
    const { data, error: insertError } = await supabaseAdmin
      .from('email_items')
      .upsert(emailRecords, { 
        onConflict: 'email_id,user_id',
        ignoreDuplicates: true 
      });

    if (insertError) {
      console.error('Error inserting emails:', insertError);
      throw insertError;
    }

    console.log(`Successfully processed ${emailRecords.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: emailRecords.length,
        message: `Successfully fetched and stored ${emailRecords.length} financial emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in fetch-gmail-emails function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred',
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
