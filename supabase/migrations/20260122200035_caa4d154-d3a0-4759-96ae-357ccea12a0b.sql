-- Corrigir última policy permissiva
DROP POLICY IF EXISTS "System can create security events" ON security_events;
CREATE POLICY "System can create security events"
ON security_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);