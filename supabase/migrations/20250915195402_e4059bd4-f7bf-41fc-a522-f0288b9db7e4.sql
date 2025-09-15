-- Fase 1: Corrigir vulnerabilidades de segurança críticas

-- 1. Corrigir RLS da tabela closer_availability para ser mais restritiva
-- Atualmente permite acesso total (true), vamos restringir para usuários autenticados
DROP POLICY IF EXISTS "Users can manage closer availability" ON public.closer_availability;

-- Criar política mais restritiva - apenas usuários autenticados podem gerenciar
CREATE POLICY "Authenticated users can manage closer availability" 
ON public.closer_availability 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- 2. Adicionar trigger de auditoria para tabela sensível de disponibilidade
CREATE OR REPLACE FUNCTION public.audit_closer_availability()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
CREATE TRIGGER audit_closer_availability_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.closer_availability
  FOR EACH ROW EXECUTE FUNCTION public.audit_closer_availability();

-- 3. Adicionar validação para evitar sobreposição de horários do mesmo closer
CREATE OR REPLACE FUNCTION public.validate_closer_availability()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger de validação
CREATE TRIGGER validate_closer_availability_trigger
  BEFORE INSERT OR UPDATE ON public.closer_availability
  FOR EACH ROW EXECUTE FUNCTION public.validate_closer_availability();