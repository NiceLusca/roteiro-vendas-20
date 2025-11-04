-- Adicionar coluna entrada_criteria à tabela pipeline_stages
ALTER TABLE public.pipeline_stages 
ADD COLUMN IF NOT EXISTS entrada_criteria jsonb;

COMMENT ON COLUMN public.pipeline_stages.entrada_criteria IS 'Critérios de entrada para a etapa (formato JSON)';