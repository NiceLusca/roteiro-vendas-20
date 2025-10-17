-- Adicionar coluna slug
ALTER TABLE pipelines ADD COLUMN slug TEXT;

-- Função para gerar slug
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  slug := lower(trim(input_text));
  -- Substituir acentos comuns
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
  -- Substituir espaços e caracteres especiais por hífen
  slug := REGEXP_REPLACE(slug, '[^a-z0-9]+', '-', 'g');
  -- Remover hífens do início e fim
  slug := TRIM(BOTH '-' FROM slug);
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Gerar slugs para pipelines existentes
UPDATE pipelines 
SET slug = generate_slug(nome)
WHERE slug IS NULL;

-- Resolver conflitos de slugs duplicados adicionando sufixo numérico
DO $$
DECLARE
  pipeline_record RECORD;
  new_slug TEXT;
  counter INTEGER;
BEGIN
  FOR pipeline_record IN 
    SELECT id, nome, slug 
    FROM pipelines 
    WHERE slug IN (
      SELECT slug 
      FROM pipelines 
      WHERE slug IS NOT NULL 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    )
    ORDER BY created_at
  LOOP
    counter := 1;
    new_slug := pipeline_record.slug;
    
    WHILE EXISTS (SELECT 1 FROM pipelines WHERE slug = new_slug AND id != pipeline_record.id) LOOP
      counter := counter + 1;
      new_slug := pipeline_record.slug || '-' || counter;
    END LOOP;
    
    IF new_slug != pipeline_record.slug THEN
      UPDATE pipelines SET slug = new_slug WHERE id = pipeline_record.id;
    END IF;
  END LOOP;
END $$;

-- Tornar slug obrigatório e único
ALTER TABLE pipelines 
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT pipelines_slug_unique UNIQUE (slug);

-- Criar trigger para gerar slug automaticamente
CREATE OR REPLACE FUNCTION set_pipeline_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Só gerar slug se não foi fornecido ou se o nome mudou
  IF NEW.slug IS NULL OR (TG_OP = 'UPDATE' AND NEW.nome != OLD.nome) THEN
    base_slug := generate_slug(NEW.nome);
    final_slug := base_slug;
    
    -- Verificar se slug já existe (ignorando o próprio registro em UPDATE)
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_pipeline_slug
  BEFORE INSERT OR UPDATE ON pipelines
  FOR EACH ROW
  EXECUTE FUNCTION set_pipeline_slug();