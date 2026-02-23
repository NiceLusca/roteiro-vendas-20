
-- Copiar todas as responsabilidades de leads do usuário antigo para o novo
INSERT INTO public.lead_responsibles (lead_id, user_id, pipeline_entry_id, is_primary, assigned_by, assigned_at)
SELECT lead_id, '0df09423-4886-4a45-afdb-543ee59d1ed5', pipeline_entry_id, is_primary, assigned_by, assigned_at
FROM public.lead_responsibles
WHERE user_id = 'fcccf669-20b6-4c1a-8fdc-b698abbc5d48'
ON CONFLICT DO NOTHING;
