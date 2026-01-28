-- Inserir leads de Agenda Oceano que não entraram no pipeline comercial desde 22/01
INSERT INTO lead_pipeline_entries (lead_id, pipeline_id, etapa_atual_id, status_inscricao, data_inscricao, data_entrada_etapa, saude_etapa)
SELECT 
  l.id,
  'f46a3fad-da4e-4f16-88f3-15b24f3b09b3',
  '27b4ef65-5e2b-4c32-a601-a9291c72f963',
  'Ativo',
  l.created_at,
  l.created_at,
  'Verde'
FROM leads l
LEFT JOIN lead_pipeline_entries lpe 
  ON lpe.lead_id = l.id 
  AND lpe.pipeline_id = 'f46a3fad-da4e-4f16-88f3-15b24f3b09b3'
WHERE l.created_at > '2026-01-22'
  AND lpe.id IS NULL
  AND l.origem = 'Agenda Oceano'