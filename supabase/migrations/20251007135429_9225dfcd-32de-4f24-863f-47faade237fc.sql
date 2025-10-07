-- Add missing segmento column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS segmento TEXT;

-- Add missing start_at and end_at columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS start_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_at TIMESTAMP WITH TIME ZONE;

-- Migrate existing appointment data from data_hora to start_at/end_at
UPDATE public.appointments
SET 
  start_at = data_hora,
  end_at = data_hora + (duracao_minutos || ' minutes')::INTERVAL
WHERE start_at IS NULL;

-- Create log_security_event RPC function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_details JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.security_events (
    event_type,
    severity,
    details,
    user_id,
    ip_address,
    user_agent,
    success,
    timestamp
  ) VALUES (
    p_event_type,
    p_severity,
    p_details,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_success,
    NOW()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event TO anon;