-- Fix existing leads with lowercase status_inscricao
UPDATE lead_pipeline_entries 
SET status_inscricao = 'Ativo' 
WHERE status_inscricao = 'ativo';