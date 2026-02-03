-- Adicionar coluna pipeline_entry_id à tabela lead_responsibles
ALTER TABLE lead_responsibles 
ADD COLUMN pipeline_entry_id UUID REFERENCES lead_pipeline_entries(id) ON DELETE CASCADE;

-- Criar índice para performance
CREATE INDEX idx_lead_responsibles_entry_id ON lead_responsibles(pipeline_entry_id);

-- Remover constraint antiga (lead_id, user_id)
ALTER TABLE lead_responsibles DROP CONSTRAINT IF EXISTS lead_responsibles_lead_id_user_id_key;

-- Nova constraint: único por entry + user (permitindo NULL para dados legados)
ALTER TABLE lead_responsibles 
ADD CONSTRAINT lead_responsibles_entry_user_unique UNIQUE (pipeline_entry_id, user_id);

-- Adicionar coluna pipeline_entry_id à tabela de histórico também
ALTER TABLE lead_responsibility_history 
ADD COLUMN pipeline_entry_id UUID REFERENCES lead_pipeline_entries(id) ON DELETE CASCADE;