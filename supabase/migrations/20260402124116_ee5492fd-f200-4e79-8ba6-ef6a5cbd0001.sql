
UPDATE lead_activity_log la
SET pipeline_entry_id = (
  SELECT lpe.id 
  FROM lead_pipeline_entries lpe 
  WHERE lpe.lead_id = la.lead_id 
  ORDER BY 
    CASE WHEN lpe.status_inscricao = 'Ativo' THEN 0 ELSE 1 END,
    lpe.created_at DESC 
  LIMIT 1
)
WHERE la.pipeline_entry_id IS NULL
AND EXISTS (
  SELECT 1 FROM lead_pipeline_entries lpe WHERE lpe.lead_id = la.lead_id
);
