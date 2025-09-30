-- Habilitar extensão pg_trgm para busca fuzzy primeiro
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Adicionar índices para otimizar queries de leads
-- Índice composto para user_id e created_at (query mais comum)
CREATE INDEX IF NOT EXISTS idx_leads_user_created 
ON public.leads (user_id, created_at DESC);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_leads_status 
ON public.leads (status_geral) 
WHERE status_geral IN ('Ativo', 'Cliente');

-- Índice para busca por score classification
CREATE INDEX IF NOT EXISTS idx_leads_score 
ON public.leads (lead_score_classification);

-- Índice para busca de texto em nome e email usando trigram
CREATE INDEX IF NOT EXISTS idx_leads_nome_trgm 
ON public.leads USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_leads_email_trgm 
ON public.leads USING gin (email gin_trgm_ops) 
WHERE email IS NOT NULL;