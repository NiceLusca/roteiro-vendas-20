-- Modificar pipeline "Convidados Evento" - Atualizar etapas de contato

-- 1. Atualizar Contato 1 para "Contato 1 - Ligação"
UPDATE pipeline_stages 
SET nome = 'Contato 1 - Ligação',
    proximo_passo_tipo = 'Humano',
    proximo_passo_label = 'Realizar ligação inicial',
    updated_at = NOW()
WHERE id = '47a1584b-4563-4498-95bf-b85ed3d08bbf';

-- 2. Atualizar Contato 2 para "Contato 2 - Áudio"
UPDATE pipeline_stages 
SET nome = 'Contato 2 - Áudio',
    proximo_passo_tipo = 'Mensagem',
    proximo_passo_label = 'Enviar áudio pelo WhatsApp',
    updated_at = NOW()
WHERE id = 'aeb83135-82e9-4eec-aa21-6e3d6316d9ae';

-- 3. Atualizar Contato 3 para "Contato 3 - Ligação"
UPDATE pipeline_stages 
SET nome = 'Contato 3 - Ligação',
    proximo_passo_tipo = 'Humano',
    proximo_passo_label = 'Realizar segunda ligação',
    updated_at = NOW()
WHERE id = 'edb98fba-3eca-4011-9819-1e4dcbacdab7';

-- 4. Reordenar etapas finais para acomodar novo "Contato 4"
UPDATE pipeline_stages 
SET ordem = 6,
    updated_at = NOW()
WHERE id = '29ea11b1-c1bd-40a4-9b40-c705c1564e5d'; -- Fechou

UPDATE pipeline_stages 
SET ordem = 7,
    updated_at = NOW()
WHERE id = '4aae9367-ee10-4d47-8075-008703504c34'; -- Declinou

UPDATE pipeline_stages 
SET ordem = 8,
    updated_at = NOW()
WHERE id = '63664b6b-8449-411d-92f3-96958ae706eb'; -- Perdido

-- 5. Criar nova etapa "Contato 4 - Mensagem"
INSERT INTO pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo,
  created_at,
  updated_at
) VALUES (
  '50ff2911-1b01-43b3-b7e2-b19b8a0dc137', -- Pipeline Convidados Evento
  'Contato 4 - Mensagem',
  5,
  2,
  'Mensagem',
  'Enviar mensagem final de acompanhamento',
  false,
  true,
  NOW(),
  NOW()
);