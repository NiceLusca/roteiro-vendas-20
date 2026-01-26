-- Pipeline Comercial ID: f46a3fad-da4e-4f16-88f3-15b24f3b09b3

-- 1. Atualizar etapas existentes
UPDATE pipeline_stages 
SET nome = 'Agendado', 
    grupo = 'Pré-Sessão', 
    cor_grupo = '#3B82F6',
    prazo_em_dias = 3,
    updated_at = NOW()
WHERE id = '27b4ef65-5e2b-4c32-a601-a9291c72f963';

UPDATE pipeline_stages 
SET nome = 'Confirmado', 
    grupo = 'Pré-Sessão', 
    cor_grupo = '#3B82F6',
    prazo_em_dias = 2,
    updated_at = NOW()
WHERE id = '66215bb9-8e2a-4b4c-9312-00b7c788eef5';

-- 2. Inserir 11 novas etapas com grupos e cores
INSERT INTO pipeline_stages (pipeline_id, nome, ordem, prazo_em_dias, grupo, cor_grupo, proximo_passo_tipo, gerar_agendamento_auto, created_at, updated_at)
VALUES 
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Remarcou', 3, 3, 'Pré-Sessão', '#3B82F6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'No-Show', 4, 2, 'Pré-Sessão', '#3B82F6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Sessão Realizada', 5, 1, 'Sessão', '#8B5CF6', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Fechou', 6, 1, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Não Fechou (quente)', 7, 2, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Não Fechou (frio)', 8, 7, 'Decisão', '#A855F7', 'Humano', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+2', 9, 2, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+4', 10, 2, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Recuperação D+7', 11, 3, 'Recuperação', '#F97316', 'Mensagem', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Cliente', 12, NULL, 'Desfecho', '#10B981', 'Outro', false, NOW(), NOW()),
  ('f46a3fad-da4e-4f16-88f3-15b24f3b09b3', 'Perdido', 13, NULL, 'Desfecho', '#10B981', 'Outro', false, NOW(), NOW());