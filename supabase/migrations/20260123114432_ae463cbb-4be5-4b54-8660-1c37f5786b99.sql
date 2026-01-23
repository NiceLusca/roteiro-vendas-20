-- Normalizar valores de status_inscricao para 'Ativo' (PascalCase)
UPDATE lead_pipeline_entries 
SET status_inscricao = 'Ativo' 
WHERE status_inscricao = 'ativo';

-- Adicionar constraint para garantir consistência futura
ALTER TABLE lead_pipeline_entries
ADD CONSTRAINT check_status_inscricao_valid 
CHECK (status_inscricao IN ('Ativo', 'Arquivado', 'Concluido'));