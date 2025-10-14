import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const optionalSecret = Deno.env.get('SCHEDULED_CONTENT_SYNC_SECRET');

    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.replace(/Bearer\s+/i, '').trim();
    const validSecrets = [serviceRoleKey, optionalSecret].filter((value): value is string => Boolean(value && value.length > 0));

    if (!validSecrets.includes(token)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🕐 ========================================');
    console.log('🕐 SCHEDULED CONTENT SYNC STARTED');
    console.log('🕐 ========================================\n');

    const startTime = Date.now();

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = serviceRoleKey;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who have at least one influencer source
    const { data: sources, error: sourcesError } = await supabase
      .from('influencer_sources')
      .select('user_id, influencer_name')
      .limit(10000); // Adjust based on your scale

    if (sourcesError) {
      throw sourcesError;
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(sources?.map(s => s.user_id) || [])];
    
    console.log(`📊 Found ${sources?.length || 0} total sources`);
    console.log(`👥 Found ${uniqueUserIds.length} unique users with active sources\n`);

    if (uniqueUserIds.length === 0) {
      console.log('⚠️  No users with sources found. Exiting.');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users to process',
          usersProcessed: 0,
          totalItemsProcessed: 0
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Process each user
    let successfulUsers = 0;
    let failedUsers = 0;
    let totalItemsProcessed = 0;
    const userResults: any[] = [];

    for (const userId of uniqueUserIds) {
      try {
        console.log(`\n📍 Processing user: ${userId}`);
        
        // Count their sources
        const userSourceCount = sources?.filter(s => s.user_id === userId).length || 0;
        console.log(`   Sources: ${userSourceCount}`);
        
        // Invoke content-aggregator for this user
        const { data, error } = await supabase.functions.invoke('content-aggregator', {
          body: { 
            userId: userId,
            automated: true // Flag to indicate this is an automated run
          }
        });

        if (error) {
          console.error(`   ❌ Error for user ${userId}:`, error.message);
          failedUsers++;
          userResults.push({
            userId,
            success: false,
            error: error.message,
            sourcesCount: userSourceCount
          });
          continue;
        }

        const itemsProcessed = data?.processedCount || 0;
        totalItemsProcessed += itemsProcessed;
        successfulUsers++;
        
        console.log(`   ✅ Success: ${itemsProcessed} new items processed`);
        
        userResults.push({
          userId,
          success: true,
          itemsProcessed,
          sourcesCount: userSourceCount,
          errors: data?.errors?.length || 0
        });

      } catch (userError) {
        console.error(`   ❌ Exception processing user ${userId}:`, userError);
        failedUsers++;
        userResults.push({
          userId,
          success: false,
          error: userError instanceof Error ? userError.message : String(userError)
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n🕐 ========================================');
    console.log('🕐 SCHEDULED CONTENT SYNC COMPLETED');
    console.log(`🕐 Duration: ${duration}s`);
    console.log(`🕐 ========================================`);
    console.log(`✅ Successful users: ${successfulUsers}`);
    console.log(`❌ Failed users: ${failedUsers}`);
    console.log(`📦 Total items processed: ${totalItemsProcessed}`);
    console.log('🕐 ========================================\n');

    return new Response(
      JSON.stringify({ 
        success: true,
        summary: {
          totalUsers: uniqueUserIds.length,
          successfulUsers,
          failedUsers,
          totalItemsProcessed,
          durationSeconds: parseFloat(duration)
        },
        userResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ FATAL ERROR in scheduled sync:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
