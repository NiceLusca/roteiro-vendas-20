-- Criar tabela de notas/comentários dos leads
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para lead_notes
CREATE POLICY "Authenticated users can view notes"
  ON public.lead_notes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create notes"
  ON public.lead_notes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notes"
  ON public.lead_notes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete notes"
  ON public.lead_notes
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Criar bucket para anexos dos leads
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-attachments', 'lead-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para lead-attachments
CREATE POLICY "Authenticated users can view attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'lead-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'lead-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update attachments"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'lead-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete attachments"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'lead-attachments' AND has_role(auth.uid(), 'admin'));

-- Índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);