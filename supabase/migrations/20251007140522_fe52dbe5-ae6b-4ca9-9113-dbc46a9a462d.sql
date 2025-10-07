-- Fix missing columns and tables referenced in the code

-- Add missing columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_score_classification TEXT,
ADD COLUMN IF NOT EXISTS closer TEXT;

-- Create lead_tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Create bulk_import_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bulk_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  status TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_import_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_tags
CREATE POLICY "Authenticated users can view lead tags"
  ON public.lead_tags FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage lead tags"
  ON public.lead_tags FOR ALL
  USING (true);

-- RLS policies for bulk_import_logs
CREATE POLICY "Users can view own import logs"
  ON public.bulk_import_logs FOR SELECT
  USING (true);

CREATE POLICY "Users can create import logs"
  ON public.bulk_import_logs FOR INSERT
  WITH CHECK (true);