-- Tabela para múltiplos produtos por deal
CREATE TABLE IF NOT EXISTS public.deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantidade INTEGER DEFAULT 1,
  valor_unitario NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(deal_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Authenticated users can view deal_products"
  ON public.deal_products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create deal_products"
  ON public.deal_products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update deal_products"
  ON public.deal_products FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete deal_products"
  ON public.deal_products FOR DELETE
  USING (auth.uid() IS NOT NULL);