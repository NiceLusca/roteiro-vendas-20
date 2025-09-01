-- Add the remaining RLS policies without dropping the function

-- Appointment events policies
CREATE POLICY "Users can access appointment events for their leads" ON public.appointment_events
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.leads l ON l.id = a.lead_id
        WHERE a.id = appointment_events.appointment_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Deal lost reasons policies
CREATE POLICY "Users can access deal lost reasons for their leads" ON public.deal_lost_reasons
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.deals d
        JOIN public.leads l ON l.id = d.lead_id
        WHERE d.id = deal_lost_reasons.deal_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Order items policies
CREATE POLICY "Users can access order items for their leads" ON public.order_items
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.leads l ON l.id = o.lead_id
        WHERE o.id = order_items.order_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Refunds policies
CREATE POLICY "Users can access refunds for their leads" ON public.refunds
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.leads l ON l.id = o.lead_id
        WHERE o.id = refunds.order_id 
        AND (l.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Orders policies (complete)
CREATE POLICY "Users can access orders for their leads" ON public.orders
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = orders.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Audit logs policies (users can see audit for their entities)
CREATE POLICY "Users can access audit logs for their entities" ON public.audit_logs
    FOR SELECT USING (
        -- Check if the audit log is for a lead they own
        (entidade = 'Lead' AND EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id::text = audit_logs.entidade_id::text
            AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
        )) OR
        -- Check if the audit log is for a pipeline they own
        (entidade = 'Pipeline' AND EXISTS (
            SELECT 1 FROM public.pipelines 
            WHERE pipelines.id::text = audit_logs.entidade_id::text
            AND (pipelines.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
        )) OR
        -- Admin can see all audit logs
        public.has_role(auth.uid(), 'admin')
    );

-- Pipeline transfers policies
CREATE POLICY "Users can access pipeline transfers for their leads" ON public.pipeline_transfers
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = pipeline_transfers.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));

-- Lead form submissions policies (insert and update)
CREATE POLICY "Users can insert form submissions for their leads" ON public.lead_form_submissions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.leads 
        WHERE leads.id = lead_form_submissions.lead_id 
        AND (leads.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ));