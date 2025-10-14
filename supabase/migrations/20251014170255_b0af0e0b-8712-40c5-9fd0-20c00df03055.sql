-- Adicionar foreign key entre lead_notes e profiles
ALTER TABLE lead_notes
ADD CONSTRAINT lead_notes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(user_id)
ON DELETE CASCADE;

-- Remover políticas antigas do storage
DROP POLICY IF EXISTS "Authenticated users can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete attachments" ON storage.objects;

-- Criar políticas corrigidas para o bucket lead-attachments
CREATE POLICY "Users can view lead attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'lead-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can upload lead attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lead-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update lead attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lead-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can delete lead attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lead-attachments' 
  AND has_role(auth.uid(), 'admin'::app_role)
);