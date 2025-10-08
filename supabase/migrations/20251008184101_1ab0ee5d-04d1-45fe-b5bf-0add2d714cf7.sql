-- Remove old foreign key constraints that are causing ambiguity
-- These are the default-named constraints that conflict with the new explicit ones

ALTER TABLE public.lead_pipeline_entries
DROP CONSTRAINT IF EXISTS lead_pipeline_entries_lead_id_fkey;

ALTER TABLE public.lead_pipeline_entries
DROP CONSTRAINT IF EXISTS lead_pipeline_entries_pipeline_id_fkey;

ALTER TABLE public.lead_pipeline_entries
DROP CONSTRAINT IF EXISTS lead_pipeline_entries_etapa_atual_id_fkey;

-- The new explicit constraints will remain:
-- ✅ fk_lead_pipeline_entries_lead (lead_id -> leads.id)
-- ✅ fk_lead_pipeline_entries_pipeline (pipeline_id -> pipelines.id)
-- ✅ fk_lead_pipeline_entries_stage (etapa_atual_id -> pipeline_stages.id)

COMMENT ON CONSTRAINT fk_lead_pipeline_entries_lead ON public.lead_pipeline_entries 
IS 'Explicit FK to leads table for unambiguous joins';

COMMENT ON CONSTRAINT fk_lead_pipeline_entries_pipeline ON public.lead_pipeline_entries 
IS 'Explicit FK to pipelines table for unambiguous joins';

COMMENT ON CONSTRAINT fk_lead_pipeline_entries_stage ON public.lead_pipeline_entries 
IS 'Explicit FK to pipeline_stages table for unambiguous joins';