-- Atualizar leads existentes para aplicar os novos triggers de lead_score
UPDATE public.leads 
SET updated_at = now() 
WHERE lead_score IS NULL OR lead_score_classification IS NULL;

-- Atualizar entradas de pipeline existentes para aplicar os novos triggers de SLA
UPDATE public.lead_pipeline_entries 
SET updated_at = now() 
WHERE saude_etapa IS NULL OR tempo_em_etapa_dias IS NULL;