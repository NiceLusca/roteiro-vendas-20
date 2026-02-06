-- Correção dos 3 leads arquivados por engano
-- 1. Reativar e mover para etapa "Fechou"
UPDATE lead_pipeline_entries 
SET 
  status_inscricao = 'Ativo',
  etapa_atual_id = '25221344-0e76-486c-800f-eab07e0c8c08',
  data_entrada_etapa = NOW(),
  updated_at = NOW()
WHERE id IN (
  '402dc789-d7d6-45d0-9401-bdd4a1fa5a9f',
  'a97ef3ab-4ce0-4184-8c33-59e62b479fe2',
  '6a631a0e-9e5c-43df-9a31-efe7b878d875'
);

-- 2. Criar deals (ganho) com valor R$ 750 para cada lead
INSERT INTO deals (lead_id, valor_proposto, status, data_fechamento)
VALUES 
  ('5e387202-7d0f-4405-979b-6c99992394f2', 750, 'ganho', NOW()),
  ('ca6a05f2-a3f6-4ed5-8712-3ceb7652f3db', 750, 'ganho', NOW()),
  ('fc09c00d-7a71-4aa3-aacf-1d0cf09ab88e', 750, 'ganho', NOW());