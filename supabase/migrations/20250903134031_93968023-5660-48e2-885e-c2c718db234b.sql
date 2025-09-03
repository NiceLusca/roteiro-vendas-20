-- Enable real-time updates for lead_pipeline_entries table
ALTER TABLE public.lead_pipeline_entries REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_pipeline_entries;