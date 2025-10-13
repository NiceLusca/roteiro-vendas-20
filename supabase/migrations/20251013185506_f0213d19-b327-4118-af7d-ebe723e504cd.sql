-- Função temporária para decodificar entidades HTML em português
CREATE OR REPLACE FUNCTION decode_html_entities(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  output_text TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  output_text := input_text;
  
  -- Substituir entidades HTML comuns do português
  output_text := REPLACE(output_text, '&aacute;', 'á');
  output_text := REPLACE(output_text, '&Aacute;', 'Á');
  output_text := REPLACE(output_text, '&eacute;', 'é');
  output_text := REPLACE(output_text, '&Eacute;', 'É');
  output_text := REPLACE(output_text, '&iacute;', 'í');
  output_text := REPLACE(output_text, '&Iacute;', 'Í');
  output_text := REPLACE(output_text, '&oacute;', 'ó');
  output_text := REPLACE(output_text, '&Oacute;', 'Ó');
  output_text := REPLACE(output_text, '&uacute;', 'ú');
  output_text := REPLACE(output_text, '&Uacute;', 'Ú');
  output_text := REPLACE(output_text, '&atilde;', 'ã');
  output_text := REPLACE(output_text, '&Atilde;', 'Ã');
  output_text := REPLACE(output_text, '&otilde;', 'õ');
  output_text := REPLACE(output_text, '&Otilde;', 'Õ');
  output_text := REPLACE(output_text, '&ccedil;', 'ç');
  output_text := REPLACE(output_text, '&Ccedil;', 'Ç');
  output_text := REPLACE(output_text, '&agrave;', 'à');
  output_text := REPLACE(output_text, '&Agrave;', 'À');
  output_text := REPLACE(output_text, '&egrave;', 'è');
  output_text := REPLACE(output_text, '&igrave;', 'ì');
  output_text := REPLACE(output_text, '&ograve;', 'ò');
  output_text := REPLACE(output_text, '&ugrave;', 'ù');
  output_text := REPLACE(output_text, '&acirc;', 'â');
  output_text := REPLACE(output_text, '&Acirc;', 'Â');
  output_text := REPLACE(output_text, '&ecirc;', 'ê');
  output_text := REPLACE(output_text, '&Ecirc;', 'Ê');
  output_text := REPLACE(output_text, '&icirc;', 'î');
  output_text := REPLACE(output_text, '&ocirc;', 'ô');
  output_text := REPLACE(output_text, '&Ocirc;', 'Ô');
  output_text := REPLACE(output_text, '&ucirc;', 'û');
  
  -- Entidades HTML gerais
  output_text := REPLACE(output_text, '&copy;', '©');
  output_text := REPLACE(output_text, '&reg;', '®');
  output_text := REPLACE(output_text, '&trade;', '™');
  output_text := REPLACE(output_text, '&nbsp;', ' ');
  output_text := REPLACE(output_text, '&quot;', '"');
  output_text := REPLACE(output_text, '&#39;', '''');
  output_text := REPLACE(output_text, '&lt;', '<');
  output_text := REPLACE(output_text, '&gt;', '>');
  output_text := REPLACE(output_text, '&amp;', '&'); -- Deve ser o último
  
  RETURN output_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Corrigir leads existentes com entidades HTML
UPDATE leads
SET 
  nome = decode_html_entities(nome),
  email = decode_html_entities(email),
  segmento = decode_html_entities(segmento),
  closer = decode_html_entities(closer),
  observacoes = decode_html_entities(observacoes),
  desejo_na_sessao = decode_html_entities(desejo_na_sessao),
  objecao_obs = decode_html_entities(objecao_obs),
  resultado_sessao_ultimo = decode_html_entities(resultado_sessao_ultimo),
  resultado_obs_ultima_sessao = decode_html_entities(resultado_obs_ultima_sessao)
WHERE 
  nome LIKE '%&%' OR
  email LIKE '%&%' OR
  segmento LIKE '%&%' OR
  closer LIKE '%&%' OR
  observacoes LIKE '%&%' OR
  desejo_na_sessao LIKE '%&%' OR
  objecao_obs LIKE '%&%' OR
  resultado_sessao_ultimo LIKE '%&%' OR
  resultado_obs_ultima_sessao LIKE '%&%';