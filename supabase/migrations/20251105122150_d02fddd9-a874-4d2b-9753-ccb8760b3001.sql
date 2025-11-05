-- Fase 1.1: Adicionar search_path security às funções existentes
-- Previne ataques de search_path manipulation

-- Função: decode_html_entities
CREATE OR REPLACE FUNCTION public.decode_html_entities(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
  output_text := REPLACE(output_text, '&amp;', '&');
  
  RETURN output_text;
END;
$function$;

-- Função: generate_slug
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(trim(input_text));
  slug := REPLACE(slug, 'á', 'a');
  slug := REPLACE(slug, 'é', 'e');
  slug := REPLACE(slug, 'í', 'i');
  slug := REPLACE(slug, 'ó', 'o');
  slug := REPLACE(slug, 'ú', 'u');
  slug := REPLACE(slug, 'ã', 'a');
  slug := REPLACE(slug, 'õ', 'o');
  slug := REPLACE(slug, 'ç', 'c');
  slug := REPLACE(slug, 'â', 'a');
  slug := REPLACE(slug, 'ê', 'e');
  slug := REPLACE(slug, 'ô', 'o');
  slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
  slug := TRIM(BOTH '-' FROM slug);
  
  RETURN slug;
END;
$function$;

-- Função: set_pipeline_slug
CREATE OR REPLACE FUNCTION public.set_pipeline_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.nome != OLD.nome) THEN
    base_slug := generate_slug(NEW.nome);
    final_slug := base_slug;
    
    WHILE EXISTS (
      SELECT 1 FROM pipelines 
      WHERE slug = final_slug 
      AND (TG_OP = 'INSERT' OR id != NEW.id)
    ) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Função: fix_utf8_encoding
CREATE OR REPLACE FUNCTION public.fix_utf8_encoding(input_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  output_text TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  output_text := input_text;
  
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
$function$;

-- Função: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;