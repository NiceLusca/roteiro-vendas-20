-- Adicionar campo para próxima etapa customizada (permite fluxos cíclicos)
ALTER TABLE public.pipeline_stages 
ADD COLUMN proxima_etapa_id UUID REFERENCES public.pipeline_stages(id) ON DELETE SET NULL;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.pipeline_stages.proxima_etapa_id IS 'ID da próxima etapa customizada. Se NULL, segue ordem sequencial.';