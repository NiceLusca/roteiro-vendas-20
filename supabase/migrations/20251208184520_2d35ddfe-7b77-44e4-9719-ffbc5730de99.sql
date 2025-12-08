-- Tabela para histórico completo de atividades do lead
CREATE TABLE public.lead_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  pipeline_entry_id UUID REFERENCES public.lead_pipeline_entries(id) ON DELETE SET NULL,
  
  -- Tipo de atividade
  activity_type TEXT NOT NULL, -- 'stage_change', 'note_added', 'attachment_added', 'attachment_deleted', 'responsible_added', 'responsible_removed', 'inscription', 'archive', 'transfer'
  
  -- Detalhes da atividade (JSON flexível)
  details JSONB DEFAULT '{}',
  
  -- Quem realizou a ação
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Índices para busca
  CONSTRAINT valid_activity_type CHECK (activity_type IN (
    'stage_change',
    'note_added', 
    'attachment_added',
    'attachment_deleted',
    'responsible_added',
    'responsible_removed',
    'inscription',
    'archive',
    'transfer',
    'lead_created',
    'lead_updated'
  ))
);

-- Índices para performance
CREATE INDEX idx_lead_activity_log_lead_id ON public.lead_activity_log(lead_id);
CREATE INDEX idx_lead_activity_log_created_at ON public.lead_activity_log(created_at DESC);
CREATE INDEX idx_lead_activity_log_activity_type ON public.lead_activity_log(activity_type);

-- Enable RLS
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view activity logs"
ON public.lead_activity_log
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create activity logs"
ON public.lead_activity_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Apenas admins podem deletar logs
CREATE POLICY "Admins can delete activity logs"
ON public.lead_activity_log
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));