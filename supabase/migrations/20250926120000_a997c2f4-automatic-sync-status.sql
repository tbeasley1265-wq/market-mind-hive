-- Unschedule legacy cron job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('content-aggregation');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Create table to track background sync health
CREATE TABLE IF NOT EXISTS public.user_sync_status (
  user_id UUID PRIMARY KEY,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT NOT NULL DEFAULT 'success' CHECK (last_sync_status IN ('success', 'partial', 'error')),
  last_error TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sync status"
ON public.user_sync_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their sync status"
ON public.user_sync_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their sync status"
ON public.user_sync_status
FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_sync_status_updated_at
BEFORE UPDATE ON public.user_sync_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
