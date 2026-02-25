import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Product ID → Pipeline slug mapping (string keys for new format)
const PRODUCT_PIPELINE_MAP: Record<string, string> = {
  '2922489': 'mentoria-society',
  '2921900': 'mentoria-society',
  '2921896': 'mentoria-society',
  '2917974': 'mentoria-society',
  '2908090': 'mentoria-society',
  '2893797': 'mentoria-society',
};

// Helper: fetch all admin user_ids
async function getAdminUserIds(supabase: any): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'admin');
  
  if (error || !data) {
    console.error('Error fetching admin users:', error);
    return [];
  }
  return data.map((r: any) => r.user_id);
}

// Helper: send notifications to all admins
async function notifyAdmins(
  supabase: any,
  params: {
    type: string;
    priority: string;
    title: string;
    message: string;
    leadId?: string;
    leadName?: string;
    actionUrl?: string;
  }
) {
  const adminIds = await getAdminUserIds(supabase);
  if (adminIds.length === 0) {
    console.log('No admin users found to notify');
    return;
  }

  const notifications = adminIds.map((userId: string) => ({
    user_id: userId,
    type: params.type,
    priority: params.priority,
    title: params.title,
    message: params.message,
    lead_id: params.leadId || null,
    lead_name: params.leadName || null,
    action_url: params.actionUrl || null,
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('Error creating admin notifications:', error);
  } else {
    console.log(`Notified ${adminIds.length} admins: ${params.title}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    const rawPayload = Array.isArray(payload) ? payload[0]?.body || payload[0] : payload.body || payload;
    const event = rawPayload.event;
    const data = rawPayload.data;

    // Validate payment is approved
    if (event !== 'myeduzz.invoice_paid' && data?.status !== 'paid') {
      console.log(`Ignoring webhook: event=${event}, status=${data?.status} (not approved payment)`);
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored: payment not approved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching product
    const items = data?.items || [];
    let matchedProduct = null;
    let targetPipelineSlug: string | null = null;

    for (const item of items) {
      const productId = String(item.productId);
      if (PRODUCT_PIPELINE_MAP[productId]) {
        matchedProduct = item;
        targetPipelineSlug = PRODUCT_PIPELINE_MAP[productId];
        console.log(`Matched product: ${productId} (${item.name}) → pipeline: ${targetPipelineSlug}`);
        break;
      }
    }

    if (!targetPipelineSlug || !matchedProduct) {
      const productIds = items.map((i: any) => i.productId).join(', ');
      console.log(`Ignoring webhook: no products match configured pipelines. Products: [${productIds}]`);
      return new Response(
        JSON.stringify({ success: true, message: `Ignored: products [${productIds}] not configured` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract buyer data
    const buyer = data?.buyer || {};
    const customerName = buyer.name?.trim() || 'Nome não informado';
    const customerEmail = buyer.email?.trim()?.toLowerCase() || null;
    const customerPhone = (buyer.cellphone || buyer.phone || '').replace(/\D/g, '') || null;
    
    const productName = matchedProduct.name || 'Produto Eduzz';
    const transValue = data?.price?.value || data?.price?.paid?.value || null;
    const transCod = data?.transaction?.id || rawPayload.id || null;

    console.log('Customer data:', { name: customerName, email: customerEmail, phone: customerPhone, product: productName, value: transValue, transCod, targetPipeline: targetPipelineSlug });

    // Search for existing lead
    let existingLead = null;

    if (customerPhone) {
      const { data: leadByPhone } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes')
        .eq('whatsapp', customerPhone)
        .maybeSingle();
      if (leadByPhone) { existingLead = leadByPhone; console.log('Found lead by phone:', existingLead.id); }
    }

    if (!existingLead && customerEmail) {
      const { data: leadByEmail } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes')
        .eq('email', customerEmail)
        .maybeSingle();
      if (leadByEmail) { existingLead = leadByEmail; console.log('Found lead by email:', existingLead.id); }
    }

    let leadId: string;

    if (existingLead) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (!existingLead.whatsapp && customerPhone) updateData.whatsapp = customerPhone;
      if (!existingLead.email && customerEmail) updateData.email = customerEmail;
      if (transValue) updateData.valor_lead = transValue;

      const purchaseNote = `[COMPRA] ${new Date().toISOString().split('T')[0]} - ${productName} - R$ ${transValue?.toFixed(2) || '0.00'} - Trans: ${transCod}`;
      updateData.observacoes = existingLead.observacoes ? `${existingLead.observacoes}\n${purchaseNote}` : purchaseNote;

      const { error: updateError } = await supabase.from('leads').update(updateData).eq('id', existingLead.id);
      if (updateError) { console.error('Error updating lead:', updateError); throw updateError; }
      leadId = existingLead.id;
      console.log('Lead updated:', leadId);
    } else {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          nome: customerName, email: customerEmail, whatsapp: customerPhone,
          origem: productName, valor_lead: transValue, status_geral: 'lead',
          observacoes: `[COMPRA] ${new Date().toISOString().split('T')[0]} - ${productName} - R$ ${transValue?.toFixed(2) || '0.00'} - Trans: ${transCod}`,
        })
        .select('id')
        .single();
      if (insertError) { console.error('Error creating lead:', insertError); throw insertError; }
      leadId = newLead.id;
      console.log('New lead created:', leadId);
    }

    // Get target pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, nome')
      .eq('slug', targetPipelineSlug)
      .eq('ativo', true)
      .maybeSingle();

    if (pipelineError || !pipeline) {
      console.error('Pipeline not found:', targetPipelineSlug, pipelineError);
      throw new Error(`Pipeline "${targetPipelineSlug}" not found`);
    }

    // Get first stage
    const { data: firstStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, nome')
      .eq('pipeline_id', pipeline.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (stageError || !firstStage) {
      console.error('First stage not found:', pipeline.id, stageError);
      throw new Error('First stage not found for pipeline');
    }

    // Check if already enrolled
    const { data: existingEntry } = await supabase
      .from('lead_pipeline_entries')
      .select('id')
      .eq('lead_id', leadId)
      .eq('pipeline_id', pipeline.id)
      .eq('status_inscricao', 'ativo')
      .maybeSingle();

    if (existingEntry) {
      console.log('Lead already enrolled:', existingEntry.id);

      // Notify admins: already enrolled
      await notifyAdmins(supabase, {
        type: 'automation',
        priority: 'low',
        title: 'Compra Eduzz - Lead já inscrito',
        message: `${customerName} comprou ${productName} - R$ ${transValue?.toFixed(2) || '0.00'}, mas já está inscrito no pipeline ${pipeline.nome}.`,
        leadId,
        leadName: customerName,
        actionUrl: `/pipelines?lead=${leadId}`,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Lead already enrolled in pipeline', lead_id: leadId, entry_id: existingEntry.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enroll lead in pipeline
    const now = new Date().toISOString();
    const { data: newEntry, error: entryError } = await supabase
      .from('lead_pipeline_entries')
      .insert({
        lead_id: leadId, pipeline_id: pipeline.id, etapa_atual_id: firstStage.id,
        status_inscricao: 'Ativo', data_inscricao: now, data_entrada_etapa: now, saude_etapa: 'Verde',
      })
      .select('id')
      .single();

    if (entryError) { console.error('Error enrolling lead:', entryError); throw entryError; }
    console.log('Lead enrolled:', newEntry.id);

    // Log activity
    await supabase.from('lead_activity_log').insert({
      lead_id: leadId, pipeline_entry_id: newEntry.id, activity_type: 'pipeline_inscription',
      details: { pipeline_name: pipeline.nome, stage_name: firstStage.nome, source: 'eduzz_webhook', product: productName, product_id: matchedProduct.productId, trans_cod: transCod, value: transValue },
    });

    // Notify admins: success
    await notifyAdmins(supabase, {
      type: 'automation',
      priority: 'medium',
      title: 'Nova Compra Eduzz',
      message: `${customerName} comprou ${productName} - R$ ${transValue?.toFixed(2) || '0.00'}. Lead inscrito no pipeline ${pipeline.nome}.`,
      leadId,
      leadName: customerName,
      actionUrl: `/pipelines?lead=${leadId}`,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Lead created/updated and enrolled', lead_id: leadId, entry_id: newEntry.id, pipeline: pipeline.nome, stage: firstStage.nome }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Notify admins: error
    try {
      await notifyAdmins(supabase, {
        type: 'automation',
        priority: 'critical',
        title: 'Erro no Webhook Eduzz',
        message: `Erro ao processar compra: ${error.message || 'Erro interno'}`,
      });
    } catch (notifError) {
      console.error('Failed to send error notification:', notifError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
