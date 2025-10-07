-- Fase 1: Adicionar colunas faltantes na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS desejo_na_sessao TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS objecao_obs TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resultado_sessao_ultimo TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS resultado_obs_ultima_sessao TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS valor_lead NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Fase 2: Limpar duplicação de tabelas de tags
-- Deletar a tabela lead_tags duplicada (vamos usar apenas lead_tag_assignments)
DROP TABLE IF EXISTS public.lead_tags CASCADE;

-- Garantir que lead_tag_assignments existe com a estrutura correta
CREATE TABLE IF NOT EXISTS public.lead_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Habilitar RLS em lead_tag_assignments
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lead_tag_assignments
DROP POLICY IF EXISTS "Authenticated users can view tag assignments" ON public.lead_tag_assignments;
CREATE POLICY "Authenticated users can view tag assignments"
  ON public.lead_tag_assignments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage tag assignments" ON public.lead_tag_assignments;
CREATE POLICY "Authenticated users can manage tag assignments"
  ON public.lead_tag_assignments FOR ALL
  TO authenticated
  USING (true);

-- Garantir que bulk_import_logs tem user_id
ALTER TABLE public.bulk_import_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);