-- Corrigir todos os campos de texto dos leads com UTF-8 corrompido
UPDATE leads
SET 
  nome = public.fix_utf8_encoding(nome),
  email = public.fix_utf8_encoding(COALESCE(email, '')),
  segmento = public.fix_utf8_encoding(COALESCE(segmento, '')),
  closer = public.fix_utf8_encoding(COALESCE(closer, '')),
  observacoes = public.fix_utf8_encoding(COALESCE(observacoes, '')),
  desejo_na_sessao = public.fix_utf8_encoding(COALESCE(desejo_na_sessao, '')),
  objecao_obs = public.fix_utf8_encoding(COALESCE(objecao_obs, '')),
  resultado_sessao_ultimo = public.fix_utf8_encoding(COALESCE(resultado_sessao_ultimo, '')),
  resultado_obs_ultima_sessao = public.fix_utf8_encoding(COALESCE(resultado_obs_ultima_sessao, ''))
WHERE 
  nome LIKE '%Ã%' OR
  email LIKE '%Ã%' OR
  segmento LIKE '%Ã%' OR
  closer LIKE '%Ã%' OR
  observacoes LIKE '%Ã%' OR
  desejo_na_sessao LIKE '%Ã%' OR
  objecao_obs LIKE '%Ã%' OR
  resultado_sessao_ultimo LIKE '%Ã%' OR
  resultado_obs_ultima_sessao LIKE '%Ã%';