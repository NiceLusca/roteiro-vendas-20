-- Configuração de SLA baseado em agendamento
-- Adicionar campos para pipeline_stages
ALTER TABLE pipeline_stages
ADD COLUMN IF NOT EXISTS sla_baseado_em TEXT DEFAULT 'entrada' CHECK (sla_baseado_em IN ('entrada', 'agendamento')),
ADD COLUMN IF NOT EXISTS requer_agendamento BOOLEAN DEFAULT false;

-- Adicionar campo para lead_pipeline_entries (vínculo com agendamento específico)
ALTER TABLE lead_pipeline_entries
ADD COLUMN IF NOT EXISTS agendamento_sla_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Comentários explicativos
COMMENT ON COLUMN pipeline_stages.sla_baseado_em IS 'Define se o prazo SLA conta a partir da entrada na etapa (entrada) ou da data do agendamento (agendamento)';
COMMENT ON COLUMN pipeline_stages.requer_agendamento IS 'Se true, bloqueia movimentação para esta etapa sem agendamento definido';
COMMENT ON COLUMN lead_pipeline_entries.agendamento_sla_id IS 'ID do agendamento selecionado para calcular o SLA deste card';