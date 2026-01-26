-- Adicionar campos opcionais para agrupamento visual de etapas
-- Campos NULLABLE para compatibilidade total com pipelines existentes

ALTER TABLE pipeline_stages 
ADD COLUMN IF NOT EXISTS grupo TEXT,
ADD COLUMN IF NOT EXISTS cor_grupo TEXT;

-- Comentários para documentação
COMMENT ON COLUMN pipeline_stages.grupo IS 'Nome do grupo visual (opcional) - NULL = etapa renderizada individualmente';
COMMENT ON COLUMN pipeline_stages.cor_grupo IS 'Cor hex do grupo (opcional) - NULL = usa cor padrão emerald #10b981';