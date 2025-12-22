-- Criar tabela de controle de acesso por pipeline
CREATE TABLE public.pipeline_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  CONSTRAINT pipeline_access_level_check CHECK (access_level IN ('view', 'edit', 'manage')),
  CONSTRAINT pipeline_access_unique UNIQUE (user_id, pipeline_id)
);

-- Índices para performance
CREATE INDEX idx_pipeline_access_user ON public.pipeline_access(user_id);
CREATE INDEX idx_pipeline_access_pipeline ON public.pipeline_access(pipeline_id);

-- Habilitar RLS
ALTER TABLE public.pipeline_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pipeline_access
CREATE POLICY "Admins can manage all pipeline access"
ON public.pipeline_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own pipeline access"
ON public.pipeline_access
FOR SELECT
USING (auth.uid() = user_id);

-- Função para verificar acesso a pipeline (SECURITY DEFINER evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_pipeline_access(_user_id UUID, _pipeline_id UUID, _min_level TEXT DEFAULT 'view')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Admins têm acesso total a todos os pipelines
    has_role(_user_id, 'admin')
    OR
    -- Verificar acesso específico na tabela pipeline_access
    EXISTS (
      SELECT 1 FROM pipeline_access pa
      WHERE pa.user_id = _user_id 
        AND pa.pipeline_id = _pipeline_id
        AND (
          -- view: qualquer nível serve
          (_min_level = 'view')
          OR
          -- edit: precisa de edit ou manage
          (_min_level = 'edit' AND pa.access_level IN ('edit', 'manage'))
          OR
          -- manage: precisa de manage
          (_min_level = 'manage' AND pa.access_level = 'manage')
        )
    )
  )
$$;

-- Função helper para obter nível de acesso
CREATE OR REPLACE FUNCTION public.get_pipeline_access_level(_user_id UUID, _pipeline_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN has_role(_user_id, 'admin') THEN 'admin'
      ELSE COALESCE(
        (SELECT access_level FROM pipeline_access WHERE user_id = _user_id AND pipeline_id = _pipeline_id),
        'none'
      )
    END
$$;

-- Atualizar política de SELECT em pipelines para considerar acesso
DROP POLICY IF EXISTS "Authenticated users can view active pipelines" ON public.pipelines;

CREATE POLICY "Users can view pipelines they have access to"
ON public.pipelines
FOR SELECT
USING (
  ativo = true 
  AND (
    has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM pipeline_access 
      WHERE user_id = auth.uid() AND pipeline_id = pipelines.id
    )
  )
);

-- Atualizar política de SELECT em lead_pipeline_entries
DROP POLICY IF EXISTS "Authenticated users can view entries" ON public.lead_pipeline_entries;

CREATE POLICY "Users can view entries for accessible pipelines"
ON public.lead_pipeline_entries
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR has_pipeline_access(auth.uid(), pipeline_id, 'view')
);

-- Atualizar política de UPDATE em lead_pipeline_entries
DROP POLICY IF EXISTS "Authenticated users can update entries" ON public.lead_pipeline_entries;

CREATE POLICY "Users can update entries for pipelines with edit access"
ON public.lead_pipeline_entries
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin')
  OR has_pipeline_access(auth.uid(), pipeline_id, 'edit')
);

-- Atualizar política de INSERT em lead_pipeline_entries
DROP POLICY IF EXISTS "Authenticated users can create entries" ON public.lead_pipeline_entries;

CREATE POLICY "Users can create entries for pipelines with edit access"
ON public.lead_pipeline_entries
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin')
  OR has_pipeline_access(auth.uid(), pipeline_id, 'edit')
);