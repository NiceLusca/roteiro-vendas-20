-- Atualizar saude_etapa NULL para 'Verde' em leads ativos
UPDATE lead_pipeline_entries 
SET saude_etapa = 'Verde' 
WHERE saude_etapa IS NULL 
AND status_inscricao = 'Ativo';

-- Adicionar constraint para garantir que novos registros tenham saude_etapa
ALTER TABLE lead_pipeline_entries 
ALTER COLUMN saude_etapa SET DEFAULT 'Verde';