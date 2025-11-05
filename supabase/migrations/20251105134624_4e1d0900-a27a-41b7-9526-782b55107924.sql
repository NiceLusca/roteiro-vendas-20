-- ============================================
-- FASE 4: ÍNDICES E PERFORMANCE PARA ESCALABILIDADE
-- ============================================

-- 1️⃣ Índices críticos para queries de lead_pipeline_entries
CREATE INDEX IF NOT EXISTS idx_entries_pipeline_stage 
ON lead_pipeline_entries(pipeline_id, etapa_atual_id, status_inscricao);

CREATE INDEX IF NOT EXISTS idx_entries_health 
ON lead_pipeline_entries(saude_etapa, pipeline_id) 
WHERE status_inscricao = 'Ativo';

CREATE INDEX IF NOT EXISTS idx_entries_stage_date 
ON lead_pipeline_entries(etapa_atual_id, data_entrada_etapa DESC) 
WHERE status_inscricao = 'Ativo';

CREATE INDEX IF NOT EXISTS idx_entries_pipeline_active 
ON lead_pipeline_entries(pipeline_id, status_inscricao) 
WHERE status_inscricao = 'Ativo';

-- 2️⃣ Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_score 
ON leads(lead_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_leads_closer 
ON leads(closer) 
WHERE closer IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_leads_score_classification 
ON leads(lead_score_classification);

-- 3️⃣ Materialized View para métricas de pipeline (agregações pré-calculadas)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_pipeline_metrics AS
SELECT 
  pipeline_id,
  etapa_atual_id,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE saude_etapa = 'Vermelho') as leads_atrasados,
  COUNT(*) FILTER (WHERE saude_etapa = 'Amarelo') as leads_atencao,
  COUNT(*) FILTER (WHERE saude_etapa = 'Verde') as leads_ok,
  AVG(EXTRACT(EPOCH FROM (NOW() - data_entrada_etapa)) / 86400) as tempo_medio_dias
FROM lead_pipeline_entries
WHERE status_inscricao = 'Ativo'
GROUP BY pipeline_id, etapa_atual_id;

-- Criar índice único para a materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_pipeline_metrics 
ON mv_pipeline_metrics(pipeline_id, etapa_atual_id);

-- 4️⃣ Function para refresh automático da materialized view
CREATE OR REPLACE FUNCTION refresh_pipeline_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_metrics;
END;
$$;

-- 5️⃣ Trigger para atualizar métricas quando entries mudam
CREATE OR REPLACE FUNCTION trigger_refresh_pipeline_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Agendar refresh da materialized view (será executado após commit)
  PERFORM refresh_pipeline_metrics();
  RETURN NULL;
END;
$$;

-- Criar trigger (executado após INSERT/UPDATE/DELETE em lead_pipeline_entries)
DROP TRIGGER IF EXISTS trigger_update_pipeline_metrics ON lead_pipeline_entries;
CREATE TRIGGER trigger_update_pipeline_metrics
AFTER INSERT OR UPDATE OR DELETE ON lead_pipeline_entries
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_pipeline_metrics();

-- 6️⃣ Índice para ordenação por data de criação
CREATE INDEX IF NOT EXISTS idx_entries_created_at 
ON lead_pipeline_entries(created_at DESC);

-- 7️⃣ Comentários para documentação
COMMENT ON INDEX idx_entries_pipeline_stage IS 'Otimiza queries por pipeline e etapa';
COMMENT ON INDEX idx_entries_health IS 'Otimiza filtros por saúde do lead';
COMMENT ON MATERIALIZED VIEW mv_pipeline_metrics IS 'Métricas pré-calculadas do pipeline para dashboards';