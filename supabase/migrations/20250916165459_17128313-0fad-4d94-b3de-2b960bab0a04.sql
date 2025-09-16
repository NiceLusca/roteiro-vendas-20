-- FASE 2: Correções de Segurança Críticas
-- Corrigir search_path nas funções para prevenir ataques de injeção

-- 1. Função handle_new_user já tem search_path correto, mas vamos garantir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- 2. Corrigir função assign_default_data_to_user
CREATE OR REPLACE FUNCTION public.assign_default_data_to_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Update pipeline to belong to new user if it doesn't have an owner
    UPDATE public.pipelines 
    SET user_id = NEW.id 
    WHERE nome = 'Geral (Primário)' AND user_id IS NULL;
    
    -- Update product to belong to new user if it doesn't have an owner
    UPDATE public.products 
    SET user_id = NEW.id 
    WHERE nome = 'Indefinido' AND user_id IS NULL;
    
    RETURN NEW;
END;
$$;

-- 3. Melhorar validação de UUIDs para evitar erros de "invalid input syntax"
CREATE OR REPLACE FUNCTION public.validate_uuid(input_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se é um UUID válido
  IF input_text IS NULL OR input_text = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Tentar converter para UUID
  BEGIN
    PERFORM input_text::UUID;
    RETURN TRUE;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN FALSE;
  END;
END;
$$;

-- 4. Função para sanitização de logs (LGPD compliance)
CREATE OR REPLACE FUNCTION public.sanitize_log_data(log_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sanitized_data JSONB := log_data;
  sensitive_fields TEXT[] := ARRAY['email', 'telefone', 'cpf', 'password', 'token'];
  field TEXT;
BEGIN
  -- Remover campos sensíveis dos logs
  FOREACH field IN ARRAY sensitive_fields
  LOOP
    sanitized_data := sanitized_data - field;
  END LOOP;
  
  RETURN sanitized_data;
END;
$$;

-- 5. Trigger para sanitizar dados de auditoria automaticamente
CREATE OR REPLACE FUNCTION public.sanitize_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Sanitizar dados sensíveis nos logs de auditoria
  IF NEW.alteracao IS NOT NULL THEN
    NEW.alteracao := public.sanitize_log_data(NEW.alteracao);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar o trigger de sanitização nos audit_logs
DROP TRIGGER IF EXISTS sanitize_audit_logs_trigger ON public.audit_logs;
CREATE TRIGGER sanitize_audit_logs_trigger
  BEFORE INSERT OR UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_audit_log();

-- 6. Função para limpeza automática de logs antigos (retenção de dados)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover logs com mais de 1 ano (conformidade LGPD)
  DELETE FROM public.audit_logs
  WHERE created_at < (NOW() - INTERVAL '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 7. Política RLS mais restritiva para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para visualização de audit_logs (apenas admins ou próprios dados)
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      -- Admin pode ver todos
      public.has_role(auth.uid(), 'admin') OR
      -- Usuário pode ver apenas seus próprios logs
      ator = auth.email()
    )
  );

-- Política para inserção de audit_logs (qualquer usuário autenticado)
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 8. Melhorar validação de entrada para prevenir injeção
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.email;
  END IF;
  
  -- Validar telefone (apenas números, espaços e símbolos comuns)
  IF NEW.telefone IS NOT NULL AND NEW.telefone !~ '^[\+\(\)\-\s\d]+$' THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;
  
  -- Limitar tamanho de campos de texto livre
  IF LENGTH(NEW.nome) > 200 THEN
    RAISE EXCEPTION 'Nome muito longo (máximo 200 caracteres)';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger de validação nos leads
DROP TRIGGER IF EXISTS validate_lead_input_trigger ON public.leads;
CREATE TRIGGER validate_lead_input_trigger
  BEFORE INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_input();

-- 9. Índices para melhor performance em consultas de segurança
CREATE INDEX IF NOT EXISTS idx_audit_logs_ator ON public.audit_logs(ator);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

-- 10. Política de retenção para leads inativos (LGPD)
CREATE OR REPLACE FUNCTION public.cleanup_inactive_leads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Anonimizar leads perdidos há mais de 2 anos
  UPDATE public.leads
  SET 
    nome = 'Lead Anonimizado',
    email = NULL,
    telefone = NULL,
    instagram = NULL
  WHERE 
    status_geral = 'Perdido' 
    AND updated_at < (NOW() - INTERVAL '2 years')
    AND nome != 'Lead Anonimizado';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;