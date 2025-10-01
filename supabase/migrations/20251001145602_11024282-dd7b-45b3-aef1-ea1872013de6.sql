-- Adicionar campo valor_lead à tabela leads
ALTER TABLE public.leads 
ADD COLUMN valor_lead integer DEFAULT 0;

-- Adicionar constraint para limitar valor entre 0 e 110
ALTER TABLE public.leads
ADD CONSTRAINT check_valor_lead_range CHECK (valor_lead >= 0 AND valor_lead <= 110);

-- Criar índice para melhor performance em queries
CREATE INDEX idx_leads_valor_lead ON public.leads(valor_lead);

COMMENT ON COLUMN public.leads.valor_lead IS 'Valor potencial do lead (0-110)';