-- Criar tabela de tags
CREATE TABLE public.lead_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Habilitar RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lead_tags
CREATE POLICY "Users can manage their tags"
ON public.lead_tags
FOR ALL
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Criar tabela de atribuição de tags a leads
CREATE TABLE public.lead_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- Habilitar RLS
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lead_tag_assignments
CREATE POLICY "Users can manage tags for their leads"
ON public.lead_tag_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = lead_tag_assignments.lead_id
    AND (l.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Criar tabela de logs de importação
CREATE TABLE public.bulk_import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_linhas INTEGER NOT NULL,
  linhas_sucesso INTEGER NOT NULL DEFAULT 0,
  linhas_erro INTEGER NOT NULL DEFAULT 0,
  erros JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  nome_arquivo TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.bulk_import_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para bulk_import_logs
CREATE POLICY "Users can view their import logs"
ON public.bulk_import_logs
FOR SELECT
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create import logs"
ON public.bulk_import_logs
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at em lead_tags
CREATE TRIGGER update_lead_tags_updated_at
BEFORE UPDATE ON public.lead_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();