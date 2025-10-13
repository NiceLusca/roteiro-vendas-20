-- Função para corrigir encoding UTF-8 mal interpretado
CREATE OR REPLACE FUNCTION fix_utf8_encoding(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  output_text TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  output_text := input_text;
  
  -- Corrigir bytes UTF-8 mal interpretados como Latin-1
  -- á (U+00E1) aparece como Ã¡ quando UTF-8 é lido como Latin-1
  output_text := REPLACE(output_text, E'Ã¡', 'á');
  output_text := REPLACE(output_text, E'Ã©', 'é');
  output_text := REPLACE(output_text, E'Ã­', 'í');
  output_text := REPLACE(output_text, E'Ã³', 'ó');
  output_text := REPLACE(output_text, E'Ãº', 'ú');
  output_text := REPLACE(output_text, E'Ã£', 'ã');
  output_text := REPLACE(output_text, E'Ãµ', 'õ');
  output_text := REPLACE(output_text, E'Ã§', 'ç');
  output_text := REPLACE(output_text, E'Ã¢', 'â');
  output_text := REPLACE(output_text, E'Ãª', 'ê');
  output_text := REPLACE(output_text, E'Ã­', 'í');
  output_text := REPLACE(output_text, E'Ã´', 'ô');
  output_text := REPLACE(output_text, E'Ã¹', 'ù');
  output_text := REPLACE(output_text, E'Ã ', 'à');
  
  -- Maiúsculas
  output_text := REPLACE(output_text, E'Ã', 'Á');
  output_text := REPLACE(output_text, E'Ã', 'É');
  output_text := REPLACE(output_text, E'Ã', 'Í');
  output_text := REPLACE(output_text, E'Ã', 'Ó');
  output_text := REPLACE(output_text, E'Ã', 'Ú');
  output_text := REPLACE(output_text, E'Ã', 'Ã');
  output_text := REPLACE(output_text, E'Ã', 'Õ');
  output_text := REPLACE(output_text, E'Ã', 'Ç');
  output_text := REPLACE(output_text, E'Ã', 'Â');
  output_text := REPLACE(output_text, E'Ã', 'Ê');
  output_text := REPLACE(output_text, E'Ã', 'Ô');
  
  RETURN output_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Corrigir todos os nomes de leads
UPDATE leads
SET nome = fix_utf8_encoding(nome)
WHERE nome LIKE '%Ã%' OR nome LIKE '%Ã%';

-- Corrigir outros campos de texto também
UPDATE leads
SET 
  email = fix_utf8_encoding(email),
  segmento = fix_utf8_encoding(segmento),
  closer = fix_utf8_encoding(closer),
  observacoes = fix_utf8_encoding(observacoes),
  desejo_na_sessao = fix_utf8_encoding(desejo_na_sessao),
  objecao_obs = fix_utf8_encoding(objecao_obs),
  resultado_sessao_ultimo = fix_utf8_encoding(resultado_sessao_ultimo),
  resultado_obs_ultima_sessao = fix_utf8_encoding(resultado_obs_ultima_sessao)
WHERE 
  email LIKE '%Ã%' OR email LIKE '%Ã%' OR
  segmento LIKE '%Ã%' OR segmento LIKE '%Ã%' OR
  closer LIKE '%Ã%' OR closer LIKE '%Ã%' OR
  observacoes LIKE '%Ã%' OR observacoes LIKE '%Ã%' OR
  desejo_na_sessao LIKE '%Ã%' OR desejo_na_sessao LIKE '%Ã%' OR
  objecao_obs LIKE '%Ã%' OR objecao_obs LIKE '%Ã%' OR
  resultado_sessao_ultimo LIKE '%Ã%' OR resultado_sessao_ultimo LIKE '%Ã%' OR
  resultado_obs_ultima_sessao LIKE '%Ã%' OR resultado_obs_ultima_sessao LIKE '%Ã%';