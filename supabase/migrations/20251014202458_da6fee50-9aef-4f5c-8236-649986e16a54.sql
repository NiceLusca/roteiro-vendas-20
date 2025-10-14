-- Criar tabela para metadata dos anexos
CREATE TABLE lead_attachments_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_lead_attachments_lead_id ON lead_attachments_metadata(lead_id);
CREATE INDEX idx_lead_attachments_uploaded_by ON lead_attachments_metadata(uploaded_by);

-- RLS Policies
ALTER TABLE lead_attachments_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachment metadata"
ON lead_attachments_metadata FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create attachment metadata"
ON lead_attachments_metadata FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete attachment metadata"
ON lead_attachments_metadata FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));