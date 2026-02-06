-- =============================================
-- OTIMIZAÇÃO DE BANCO DE DADOS - FASE 1
-- Limpeza conservadora de dados e índices
-- =============================================

-- 1. LIMPEZA DE DADOS ANTIGOS DE LOG
-- Remover security_events com mais de 30 dias (logs de segurança)
DELETE FROM security_events 
WHERE timestamp < NOW() - INTERVAL '30 days';

-- Remover audit_logs com mais de 90 dias
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Remover lead_activity_log com mais de 90 dias
DELETE FROM lead_activity_log 
WHERE created_at < NOW() - INTERVAL '90 days';

-- 2. REMOÇÃO DE ÍNDICES CLARAMENTE REDUNDANTES/PROBLEMÁTICOS

-- idx_entries_active usa 'ativo' minúsculo mas app usa 'Ativo' - NUNCA USADO
DROP INDEX IF EXISTS idx_entries_active;

-- idx_entries_created_at tem 0 scans - não está sendo usado
DROP INDEX IF EXISTS idx_entries_created_at;

-- Índices duplicados/cobertos por compostos em lead_pipeline_entries
DROP INDEX IF EXISTS idx_lead_pipeline_entries_status;

-- Índices com 0 scans em leads
DROP INDEX IF EXISTS idx_leads_score;
DROP INDEX IF EXISTS idx_leads_closer;

-- Índices redundantes em notifications (tabela pequena, não precisa de tantos)
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_type;

-- 3. VACUUM ANALYZE para recuperar espaço e atualizar estatísticas
-- (Isso é executado automaticamente pelo Supabase, mas ajuda documentar)