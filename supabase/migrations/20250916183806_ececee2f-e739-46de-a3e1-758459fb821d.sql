-- Fase 2: Segurança & Conformidade - Correções Críticas

-- 1. Corrigir search_path em todas as funções existentes
-- Recriar funções com search_path seguro

CREATE OR REPLACE FUNCTION public.audit_closer_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    ator,
    entidade,
    entidade_id,
    alteracao
  ) VALUES (
    COALESCE(auth.email(), 'sistema'),
    'CloserAvailability',
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'operacao', TG_OP,
      'antes', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
      'depois', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_closer_availability()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Verificar se há sobreposição de horários para o mesmo closer no mesmo dia
  IF EXISTS (
    SELECT 1 
    FROM public.closer_availability 
    WHERE closer_name = NEW.closer_name 
      AND dia_semana = NEW.dia_semana
      AND id != COALESCE(NEW.id, gen_random_uuid())
      AND ativo = true
      AND (
        (NEW.hora_inicio >= hora_inicio AND NEW.hora_inicio < hora_fim) OR
        (NEW.hora_fim > hora_inicio AND NEW.hora_fim <= hora_fim) OR
        (NEW.hora_inicio <= hora_inicio AND NEW.hora_fim >= hora_fim)
      )
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: já existe disponibilidade para este closer no mesmo período';
  END IF;
  
  -- Validar que hora_fim > hora_inicio
  IF NEW.hora_fim <= NEW.hora_inicio THEN
    RAISE EXCEPTION 'Hora de fim deve ser posterior à hora de início';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sanitize_log_data(log_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sanitize_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Sanitizar dados sensíveis nos logs de auditoria
  IF NEW.alteracao IS NOT NULL THEN
    NEW.alteracao := public.sanitize_log_data(NEW.alteracao);
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover logs com mais de 1 ano (conformidade LGPD)
  DELETE FROM public.audit_logs
  WHERE timestamp < (NOW() - INTERVAL '1 year');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

-- 2. Implementar sistema de roles mais granular para closer_availability
-- Revogar política ampla atual
DROP POLICY IF EXISTS "Authenticated users can manage closer availability" ON public.closer_availability;

-- Criar novas políticas mais restritivas
CREATE POLICY "Admins can manage closer availability" 
ON public.closer_availability 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view closer availability" 
ON public.closer_availability 
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- 3. Criar tabela de tentativas de login para monitoramento
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL DEFAULT false,
  details jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de eventos de segurança
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Política para que admins vejam todos os eventos de segurança
CREATE POLICY "Admins can view all security events"
ON public.security_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Função para log de eventos de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _event_type text,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _success boolean DEFAULT false,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type, 
    ip_address,
    user_agent,
    success,
    details
  ) VALUES (
    _user_id,
    _event_type,
    _ip_address,
    _user_agent,
    _success,
    _details
  );
END;
$function$;

-- 5. Função para detectar tentativas suspeitas
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  _ip_address inet,
  _time_window interval DEFAULT '15 minutes'::interval,
  _max_attempts integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER 
SET search_path = public
AS $function$
DECLARE
  attempt_count integer;
BEGIN
  -- Contar tentativas falhadas no período
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.security_events
  WHERE ip_address = _ip_address
    AND success = false
    AND timestamp > (now() - _time_window)
    AND event_type IN ('login_attempt', 'password_reset');
    
  RETURN attempt_count >= _max_attempts;
END;
$function$;

-- 6. Índices para performance de segurança
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events (ip_address, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events (user_id, timestamp DESC);

-- 7. Trigger para cleanup automático de eventos antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remover eventos com mais de 6 meses
  DELETE FROM public.security_events
  WHERE timestamp < (NOW() - INTERVAL '6 months');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$function$;

-- 8. Melhorar validação de entrada de leads
CREATE OR REPLACE FUNCTION public.validate_lead_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Validar email format
  IF NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Email inválido: %', NEW.email;
  END IF;
  
  -- Validar WhatsApp (apenas números, espaços e símbolos comuns)
  IF NEW.whatsapp IS NOT NULL AND NEW.whatsapp !~ '^[\+\(\)\-\s\d]+$' THEN
    RAISE EXCEPTION 'Formato de WhatsApp inválido';
  END IF;
  
  -- Limitar tamanho de campos de texto livre
  IF LENGTH(NEW.nome) > 200 THEN
    RAISE EXCEPTION 'Nome muito longo (máximo 200 caracteres)';
  END IF;
  
  -- Sanitizar dados de entrada
  NEW.nome := trim(NEW.nome);
  NEW.email := lower(trim(COALESCE(NEW.email, '')));
  
  -- Prevenir injeção via campos de texto
  IF NEW.observacoes IS NOT NULL THEN
    -- Remover caracteres potencialmente perigosos
    NEW.observacoes := regexp_replace(NEW.observacoes, '[<>]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$function$;