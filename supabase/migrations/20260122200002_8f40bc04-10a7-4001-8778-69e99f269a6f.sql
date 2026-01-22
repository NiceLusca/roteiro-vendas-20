-- =====================================================
-- CORREÇÃO DE POLÍTICAS RLS PERMISSIVAS
-- Substituir USING (true) por auth.uid() IS NOT NULL
-- =====================================================

-- APPOINTMENTS: Corrigir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON appointments;
CREATE POLICY "Authenticated users can create appointments"
ON appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update appointments" ON appointments;
CREATE POLICY "Authenticated users can update appointments"
ON appointments FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- AUDIT_LOGS: Corrigir INSERT
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audit_logs;
CREATE POLICY "Authenticated users can create audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- BULK_IMPORT_LOGS: Corrigir INSERT
DROP POLICY IF EXISTS "Users can create import logs" ON bulk_import_logs;
CREATE POLICY "Users can create import logs"
ON bulk_import_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- DEALS: Corrigir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;
CREATE POLICY "Authenticated users can create deals"
ON deals FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update deals" ON deals;
CREATE POLICY "Authenticated users can update deals"
ON deals FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- INTERACTIONS: Corrigir INSERT
DROP POLICY IF EXISTS "Authenticated users can create interactions" ON interactions;
CREATE POLICY "Authenticated users can create interactions"
ON interactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- LEAD_CRITERIA_STATE: Corrigir ALL
DROP POLICY IF EXISTS "Authenticated users can manage criteria states" ON lead_criteria_state;
CREATE POLICY "Authenticated users can manage criteria states"
ON lead_criteria_state FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- LEAD_NOTES: Corrigir INSERT
DROP POLICY IF EXISTS "Authenticated users can create notes" ON lead_notes;
CREATE POLICY "Authenticated users can create notes"
ON lead_notes FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- LEAD_TAG_ASSIGNMENTS: Corrigir ALL
DROP POLICY IF EXISTS "Authenticated users can manage tag assignments" ON lead_tag_assignments;
CREATE POLICY "Authenticated users can manage tag assignments"
ON lead_tag_assignments FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- LEADS: Corrigir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can create leads" ON leads;
CREATE POLICY "Authenticated users can create leads"
ON leads FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update leads" ON leads;
CREATE POLICY "Authenticated users can update leads"
ON leads FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- ORDER_ITEMS: Corrigir INSERT
DROP POLICY IF EXISTS "Authenticated users can create order items" ON order_items;
CREATE POLICY "Authenticated users can create order items"
ON order_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- ORDERS: Corrigir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
CREATE POLICY "Authenticated users can update orders"
ON orders FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- TAGS: Corrigir INSERT e UPDATE
DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;
CREATE POLICY "Authenticated users can create tags"
ON tags FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update tags" ON tags;
CREATE POLICY "Authenticated users can update tags"
ON tags FOR UPDATE TO authenticated
USING (auth.uid() IS NOT NULL);

-- NOTIFICATIONS: Corrigir INSERT do sistema
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
ON notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Mover materialized view para schema privado (remover da API pública)
-- Nota: Isso pode quebrar queries que dependem dela via API
-- ALTER MATERIALIZED VIEW mv_pipeline_metrics SET SCHEMA private;