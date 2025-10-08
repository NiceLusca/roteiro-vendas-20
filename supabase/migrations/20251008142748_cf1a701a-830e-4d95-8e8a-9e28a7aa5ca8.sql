-- Add missing fields to pipelines table
ALTER TABLE pipelines 
ADD COLUMN IF NOT EXISTS primary_pipeline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS objetivo TEXT;

-- Add missing fields to pipeline_stages table  
ALTER TABLE pipeline_stages
ADD COLUMN IF NOT EXISTS prazo_em_dias INTEGER,
ADD COLUMN IF NOT EXISTS proximo_passo_label TEXT,
ADD COLUMN IF NOT EXISTS saida_criteria JSONB,
ADD COLUMN IF NOT EXISTS wip_limit INTEGER,
ADD COLUMN IF NOT EXISTS gerar_agendamento_auto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tipo_agendamento TEXT,
ADD COLUMN IF NOT EXISTS closer_padrao TEXT,
ADD COLUMN IF NOT EXISTS horarios_preferenciais JSONB,
ADD COLUMN IF NOT EXISTS template_agendamento TEXT,
ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER DEFAULT 60;

-- Add missing field to orders table (for legacy compatibility)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS data_venda TIMESTAMP WITH TIME ZONE;

-- Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pipelines_primary ON pipelines(primary_pipeline) WHERE primary_pipeline = true;
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_prazo ON pipeline_stages(prazo_em_dias) WHERE prazo_em_dias IS NOT NULL;