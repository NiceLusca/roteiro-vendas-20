-- Add foreign keys to lead_pipeline_entries table
-- This enables proper joins and relationships in queries

-- Add foreign key to leads table
ALTER TABLE public.lead_pipeline_entries
ADD CONSTRAINT fk_lead_pipeline_entries_lead
FOREIGN KEY (lead_id) REFERENCES public.leads(id)
ON DELETE CASCADE;

-- Add foreign key to pipelines table
ALTER TABLE public.lead_pipeline_entries
ADD CONSTRAINT fk_lead_pipeline_entries_pipeline
FOREIGN KEY (pipeline_id) REFERENCES public.pipelines(id)
ON DELETE CASCADE;

-- Add foreign key to pipeline_stages table
ALTER TABLE public.lead_pipeline_entries
ADD CONSTRAINT fk_lead_pipeline_entries_stage
FOREIGN KEY (etapa_atual_id) REFERENCES public.pipeline_stages(id)
ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_entries_lead_id 
ON public.lead_pipeline_entries(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_pipeline_entries_pipeline_id 
ON public.lead_pipeline_entries(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_lead_pipeline_entries_stage_id 
ON public.lead_pipeline_entries(etapa_atual_id);

CREATE INDEX IF NOT EXISTS idx_lead_pipeline_entries_status 
ON public.lead_pipeline_entries(status_inscricao);

-- Add comment explaining the relationships
COMMENT ON TABLE public.lead_pipeline_entries IS 'Tracks leads progress through pipeline stages with proper foreign key relationships';