-- Criar Pipeline de Vendas com 8 etapas
-- Inserir o pipeline principal
INSERT INTO public.pipelines (nome, descricao, objetivo, ativo, primary_pipeline)
VALUES (
  'Pipeline de Vendas',
  'Pipeline padrão de vendas com múltiplos pontos de contato',
  'Gerenciar leads desde o primeiro contato até o fechamento ou perda',
  true,
  true
);

-- Inserir as 8 etapas do pipeline
-- Etapa 1: Entrada
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Entrada',
  1,
  2,
  'Humano',
  'Fazer primeiro contato',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 2: Contato 1
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Contato 1',
  2,
  2,
  'Humano',
  'Realizar segunda tentativa de contato',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 3: Contato 2
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Contato 2',
  3,
  2,
  'Humano',
  'Realizar terceira tentativa de contato',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 4: Contato 3
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Contato 3',
  4,
  2,
  'Humano',
  'Última tentativa de contato antes de arquivar',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 5: Agendou (Final)
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  duracao_minutos,
  ativo
)
SELECT 
  p.id,
  'Agendou',
  5,
  9999,
  'Agendamento',
  'Sessão agendada',
  false,
  60,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 6: Fechou (Final)
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Fechou',
  6,
  9999,
  'Outro',
  'Venda concluída com sucesso',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 7: Declinou (Final)
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Declinou',
  7,
  9999,
  'Outro',
  'Lead declinou a oferta',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;

-- Etapa 8: Perdido (Final)
INSERT INTO public.pipeline_stages (
  pipeline_id,
  nome,
  ordem,
  prazo_em_dias,
  proximo_passo_tipo,
  proximo_passo_label,
  gerar_agendamento_auto,
  ativo
)
SELECT 
  p.id,
  'Perdido',
  8,
  9999,
  'Outro',
  'Lead perdido/não convertido',
  false,
  true
FROM public.pipelines p
WHERE p.nome = 'Pipeline de Vendas'
LIMIT 1;