-- =====================================================
-- ÍNDICES OTIMIZADOS PARA ESCALA (100k+ leads)
-- =====================================================

-- Índice composto para lead_pipeline_entries (query mais frequente)
CREATE INDEX IF NOT EXISTS idx_entries_pipeline_status_stage 
ON lead_pipeline_entries(pipeline_id, status_inscricao, etapa_atual_id);

-- Índice para ordenação por data de entrada na etapa
CREATE INDEX IF NOT EXISTS idx_entries_data_entrada 
ON lead_pipeline_entries(pipeline_id, data_entrada_etapa DESC);

-- Índice para leads ativos (partial index - mais eficiente)
CREATE INDEX IF NOT EXISTS idx_entries_active 
ON lead_pipeline_entries(pipeline_id, etapa_atual_id) 
WHERE status_inscricao = 'ativo';

-- Índice para pipeline_access (usado em TODAS as queries via RLS)
CREATE INDEX IF NOT EXISTS idx_pipeline_access_user_pipeline 
ON pipeline_access(user_id, pipeline_id);

-- Índice para leads por user_id (RLS)
CREATE INDEX IF NOT EXISTS idx_leads_user 
ON leads(user_id) WHERE user_id IS NOT NULL;

-- Índice para busca de leads por nome (case insensitive)
CREATE INDEX IF NOT EXISTS idx_leads_nome_lower 
ON leads(lower(nome));

-- Índice para busca por whatsapp/email
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp 
ON leads(whatsapp) WHERE whatsapp IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_email 
ON leads(lower(email)) WHERE email IS NOT NULL;

-- Índice para appointments por lead e data
CREATE INDEX IF NOT EXISTS idx_appointments_lead_date 
ON appointments(lead_id, data_hora DESC);

-- Índice para appointments futuros
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming 
ON appointments(data_hora) 
WHERE status IN ('agendado', 'confirmado');

-- Índice para notifications por user (usado no NotificationCenter)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE read = false AND dismissed = false;

-- Índice para lead_notes por lead
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead 
ON lead_notes(lead_id, created_at DESC);

-- Índice para lead_responsibles
CREATE INDEX IF NOT EXISTS idx_lead_responsibles_lead 
ON lead_responsibles(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_responsibles_user 
ON lead_responsibles(user_id);

-- Índice para deals por lead
CREATE INDEX IF NOT EXISTS idx_deals_lead_status 
ON deals(lead_id, status);

-- Índice para orders por lead
CREATE INDEX IF NOT EXISTS idx_orders_lead 
ON orders(lead_id, created_at DESC);

-- Índice para stage_advancement_criteria
CREATE INDEX IF NOT EXISTS idx_criteria_stage 
ON stage_advancement_criteria(etapa_id) WHERE ativo = true;

-- Índice para lead_tag_assignments
CREATE INDEX IF NOT EXISTS idx_tag_assignments_lead 
ON lead_tag_assignments(lead_id);

-- Atualizar estatísticas das tabelas principais
ANALYZE leads;
ANALYZE lead_pipeline_entries;
ANALYZE pipeline_access;
ANALYZE appointments;
ANALYZE notifications;