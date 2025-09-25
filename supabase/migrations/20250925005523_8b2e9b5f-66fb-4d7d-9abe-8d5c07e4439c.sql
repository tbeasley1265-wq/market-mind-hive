-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule content aggregation to run every 15 minutes
SELECT cron.schedule(
  'content-aggregation',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://zpytenapldiyxvjrntrm.supabase.co/functions/v1/content-aggregator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpweXRlbmFwbGRpeXh2anJudHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk3Mzk5NSwiZXhwIjoyMDczNTQ5OTk1fQ.rwu6aH6B9Z0wRZqGYDjp4p6cW7jQtcOXhECvEZmBH8g"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);