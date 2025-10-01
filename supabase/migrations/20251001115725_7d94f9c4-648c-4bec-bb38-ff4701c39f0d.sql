-- Remover políticas antigas e criar novas políticas compartilhadas
-- Todos os usuários autenticados podem ver e gerenciar todos os dados

-- LEADS
DROP POLICY IF EXISTS "Users can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their leads" ON public.leads;

CREATE POLICY "All authenticated users can view all leads"
ON public.leads FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated users can update all leads"
ON public.leads FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can delete all leads"
ON public.leads FOR DELETE
TO authenticated
USING (true);

-- LEAD_TAGS
DROP POLICY IF EXISTS "Users can manage their tags" ON public.lead_tags;

CREATE POLICY "All authenticated users can manage all tags"
ON public.lead_tags FOR ALL
TO authenticated
USING (true);

-- LEAD_TAG_ASSIGNMENTS
DROP POLICY IF EXISTS "Users can manage tags for their leads" ON public.lead_tag_assignments;

CREATE POLICY "All authenticated users can manage tag assignments"
ON public.lead_tag_assignments FOR ALL
TO authenticated
USING (true);

-- PIPELINES
DROP POLICY IF EXISTS "Users can manage their pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Users can view their pipelines" ON public.pipelines;

CREATE POLICY "All authenticated users can manage all pipelines"
ON public.pipelines FOR ALL
TO authenticated
USING (true);

-- PIPELINE_STAGES
DROP POLICY IF EXISTS "Users can access stages of their pipelines" ON public.pipeline_stages;

CREATE POLICY "All authenticated users can manage all stages"
ON public.pipeline_stages FOR ALL
TO authenticated
USING (true);

-- STAGE_CHECKLIST_ITEMS
DROP POLICY IF EXISTS "Users can access checklist items" ON public.stage_checklist_items;

CREATE POLICY "All authenticated users can manage all checklist items"
ON public.stage_checklist_items FOR ALL
TO authenticated
USING (true);

-- STAGE_ADVANCEMENT_CRITERIA
DROP POLICY IF EXISTS "Users can access criteria for their pipelines" ON public.stage_advancement_criteria;

CREATE POLICY "All authenticated users can manage all criteria"
ON public.stage_advancement_criteria FOR ALL
TO authenticated
USING (true);

-- LEAD_PIPELINE_ENTRIES
DROP POLICY IF EXISTS "Users can access their lead pipeline entries" ON public.lead_pipeline_entries;

CREATE POLICY "All authenticated users can manage all pipeline entries"
ON public.lead_pipeline_entries FOR ALL
TO authenticated
USING (true);

-- APPOINTMENTS
DROP POLICY IF EXISTS "Users can access appointments for their leads" ON public.appointments;

CREATE POLICY "All authenticated users can manage all appointments"
ON public.appointments FOR ALL
TO authenticated
USING (true);

-- DEALS
DROP POLICY IF EXISTS "Users can access deals for their leads" ON public.deals;

CREATE POLICY "All authenticated users can manage all deals"
ON public.deals FOR ALL
TO authenticated
USING (true);

-- ORDERS
DROP POLICY IF EXISTS "Users can access orders for their leads" ON public.orders;

CREATE POLICY "All authenticated users can manage all orders"
ON public.orders FOR ALL
TO authenticated
USING (true);

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Users can access order items for their leads" ON public.order_items;

CREATE POLICY "All authenticated users can manage all order items"
ON public.order_items FOR ALL
TO authenticated
USING (true);

-- INTERACTIONS
DROP POLICY IF EXISTS "Users can access interactions for their leads" ON public.interactions;

CREATE POLICY "All authenticated users can manage all interactions"
ON public.interactions FOR ALL
TO authenticated
USING (true);

-- PRODUCTS
DROP POLICY IF EXISTS "Users can manage their products" ON public.products;

CREATE POLICY "All authenticated users can manage all products"
ON public.products FOR ALL
TO authenticated
USING (true);

-- REFUNDS
DROP POLICY IF EXISTS "Users can access refunds for their leads" ON public.refunds;

CREATE POLICY "All authenticated users can manage all refunds"
ON public.refunds FOR ALL
TO authenticated
USING (true);

-- PIPELINE_TRANSFERS
DROP POLICY IF EXISTS "Users can access pipeline transfers for their leads" ON public.pipeline_transfers;

CREATE POLICY "All authenticated users can manage all transfers"
ON public.pipeline_transfers FOR ALL
TO authenticated
USING (true);

-- PIPELINE_EVENTS
DROP POLICY IF EXISTS "Users can access pipeline events" ON public.pipeline_events;

CREATE POLICY "All authenticated users can manage all pipeline events"
ON public.pipeline_events FOR ALL
TO authenticated
USING (true);

-- LEAD_CRITERIA_STATE
DROP POLICY IF EXISTS "Users can access criteria state for their leads" ON public.lead_criteria_state;

CREATE POLICY "All authenticated users can manage all criteria state"
ON public.lead_criteria_state FOR ALL
TO authenticated
USING (true);

-- DEAL_LOST_REASONS
DROP POLICY IF EXISTS "Users can access deal lost reasons for their leads" ON public.deal_lost_reasons;

CREATE POLICY "All authenticated users can manage all deal lost reasons"
ON public.deal_lost_reasons FOR ALL
TO authenticated
USING (true);

-- APPOINTMENT_EVENTS
DROP POLICY IF EXISTS "Users can access appointment events for their leads" ON public.appointment_events;

CREATE POLICY "All authenticated users can manage all appointment events"
ON public.appointment_events FOR ALL
TO authenticated
USING (true);

-- BULK_IMPORT_LOGS
DROP POLICY IF EXISTS "Users can view their import logs" ON public.bulk_import_logs;
DROP POLICY IF EXISTS "Users can create import logs" ON public.bulk_import_logs;

CREATE POLICY "All authenticated users can view all import logs"
ON public.bulk_import_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create import logs"
ON public.bulk_import_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- LEAD_FORM_SUBMISSIONS
DROP POLICY IF EXISTS "Users can view form submissions for their leads" ON public.lead_form_submissions;
DROP POLICY IF EXISTS "Users can insert form submissions for their leads" ON public.lead_form_submissions;

CREATE POLICY "All authenticated users can manage all form submissions"
ON public.lead_form_submissions FOR ALL
TO authenticated
USING (true);