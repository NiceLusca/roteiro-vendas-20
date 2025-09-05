-- Adicionar campos para integração de agendamentos com pipeline

-- Expandir tabela pipeline_stages com campos de agendamento
ALTER TABLE public.pipeline_stages 
ADD COLUMN IF NOT EXISTS tipo_agendamento text CHECK (tipo_agendamento IN ('Descoberta', 'Apresentacao', 'Fechamento', 'Follow-up')),
ADD COLUMN IF NOT EXISTS closer_padrao text,
ADD COLUMN IF NOT EXISTS horarios_preferenciais jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_agendamento jsonb DEFAULT '{}';

-- Expandir tabela appointments com campos de pipeline
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS etapa_origem_id uuid REFERENCES public.pipeline_stages(id),
ADD COLUMN IF NOT EXISTS tipo_sessao text,
ADD COLUMN IF NOT EXISTS closer_responsavel text;

-- Criar tabela para disponibilidade dos closers
CREATE TABLE IF NOT EXISTS public.closer_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closer_name text NOT NULL,
  dia_semana integer NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0 = Domingo, 6 = Sábado
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(closer_name, dia_semana, hora_inicio)
);

-- Enable RLS on closer_availability table
ALTER TABLE public.closer_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for closer_availability
CREATE POLICY "Users can manage closer availability" ON public.closer_availability
  FOR ALL USING (true); -- Simplificado para permitir acesso geral

-- Trigger para atualizar updated_at em closer_availability
CREATE TRIGGER update_closer_availability_updated_at
    BEFORE UPDATE ON public.closer_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON COLUMN public.pipeline_stages.tipo_agendamento IS 'Tipo de agendamento para esta etapa';
COMMENT ON COLUMN public.pipeline_stages.closer_padrao IS 'Closer padrão responsável por agendamentos desta etapa';
COMMENT ON COLUMN public.pipeline_stages.horarios_preferenciais IS 'JSON com horários preferenciais para agendamentos desta etapa';
COMMENT ON COLUMN public.pipeline_stages.template_agendamento IS 'JSON com template para título e descrição do agendamento';

COMMENT ON COLUMN public.appointments.etapa_origem_id IS 'ID da etapa do pipeline que originou este agendamento';
COMMENT ON COLUMN public.appointments.tipo_sessao IS 'Tipo da sessão vinculado ao tipo da etapa';
COMMENT ON COLUMN public.appointments.closer_responsavel IS 'Closer responsável por este agendamento específico';