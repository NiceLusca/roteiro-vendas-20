-- Tabela de relacionamento N:N entre leads e responsáveis
CREATE TABLE public.lead_responsibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(user_id),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(lead_id, user_id)
);

-- RLS
ALTER TABLE public.lead_responsibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view responsibles"
  ON public.lead_responsibles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert responsibles"
  ON public.lead_responsibles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update responsibles"
  ON public.lead_responsibles FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete responsibles"
  ON public.lead_responsibles FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Tabela de histórico de responsabilidade
CREATE TABLE public.lead_responsibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  performed_by UUID,
  performed_by_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.lead_responsibility_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view history"
  ON public.lead_responsibility_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create history"
  ON public.lead_responsibility_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_lead_responsibles_lead_id ON public.lead_responsibles(lead_id);
CREATE INDEX idx_lead_responsibles_user_id ON public.lead_responsibles(user_id);
CREATE INDEX idx_lead_responsibility_history_lead_id ON public.lead_responsibility_history(lead_id);