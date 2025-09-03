-- Create table for stage advancement criteria
CREATE TABLE public.stage_advancement_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id UUID NOT NULL,
  tipo_criterio TEXT NOT NULL CHECK (tipo_criterio IN ('checklist', 'automatico', 'manual', 'condicional')),
  nome TEXT NOT NULL,
  descricao TEXT,
  regra_condicional JSONB,
  obrigatorio BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking lead criteria state
CREATE TABLE public.lead_criteria_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  criterio_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'atendido', 'nao_aplicavel', 'bloqueado')),
  valor_validacao JSONB,
  validado_em TIMESTAMP WITH TIME ZONE,
  validado_por TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lead_id, stage_id, criterio_id)
);

-- Enable RLS on new tables
ALTER TABLE public.stage_advancement_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_criteria_state ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stage_advancement_criteria
CREATE POLICY "Users can access criteria for their pipelines"
ON public.stage_advancement_criteria
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM pipeline_stages ps
    JOIN pipelines p ON p.id = ps.pipeline_id
    WHERE ps.id = stage_advancement_criteria.stage_id 
    AND (p.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create RLS policies for lead_criteria_state
CREATE POLICY "Users can access criteria state for their leads"
ON public.lead_criteria_state
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM leads l
    WHERE l.id = lead_criteria_state.lead_id 
    AND (l.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create indexes for performance
CREATE INDEX idx_stage_advancement_criteria_stage_id ON public.stage_advancement_criteria(stage_id);
CREATE INDEX idx_stage_advancement_criteria_tipo ON public.stage_advancement_criteria(tipo_criterio);
CREATE INDEX idx_lead_criteria_state_lead_stage ON public.lead_criteria_state(lead_id, stage_id);
CREATE INDEX idx_lead_criteria_state_status ON public.lead_criteria_state(status);

-- Create trigger for updating timestamps
CREATE TRIGGER update_stage_advancement_criteria_updated_at
  BEFORE UPDATE ON public.stage_advancement_criteria
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_criteria_state_updated_at
  BEFORE UPDATE ON public.lead_criteria_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();