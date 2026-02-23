
-- Copiar acessos de pipeline do usuário antigo para o novo
INSERT INTO public.pipeline_access (user_id, pipeline_id, access_level)
VALUES 
  ('0df09423-4886-4a45-afdb-543ee59d1ed5', '860965aa-afe8-4585-a44b-fae4af67bf81', 'edit'),
  ('0df09423-4886-4a45-afdb-543ee59d1ed5', 'f3ee5926-dbc5-421f-b523-3c5793dc05ff', 'edit')
ON CONFLICT DO NOTHING;
