import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Kiwify product_id → pipeline slug
const KIWIFY_PRODUCT_PIPELINE_MAP: Record<string, string> = {
  '6d3aec60-3885-11f1-afdf-b95efc23004a': 'crescimento-acelerado-diario',
};

const APPROVED_STATUSES = new Set([
  'paid', 'approved', 'aprovado', 'completed',
  'order_approved', 'compra_aprovada',
]);

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
  if (adminIds.length === 0) return;

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
  if (error) console.error('Error creating admin notifications:', error);
}

function pickFirst<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    console.log('Kiwify webhook received:', JSON.stringify(payload, null, 2));

    const data = payload?.data || payload;

    // Status / event check (be tolerant to Kiwify payload variants)
    const status = String(
      pickFirst(
        payload?.order_status,
        payload?.status,
        data?.order_status,
        data?.status,
        payload?.webhook_event_type,
        payload?.event,
      ) || ''
    ).toLowerCase();

    if (status && !APPROVED_STATUSES.has(status)) {
      console.log(`Ignoring Kiwify webhook: status="${status}" not approved`);
      return new Response(
        JSON.stringify({ success: true, message: `Ignored: status ${status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract product_id (varies between Kiwify webhook versions)
    const productId = String(
      pickFirst(
        data?.Product?.product_id,
        data?.product?.product_id,
        data?.Product?.id,
        data?.product?.id,
        data?.product_id,
        payload?.Product?.product_id,
        payload?.product_id,
        payload?.product?.id,
      ) || ''
    );

    const targetPipelineSlug = KIWIFY_PRODUCT_PIPELINE_MAP[productId];
    if (!targetPipelineSlug) {
      console.log(`Ignoring Kiwify webhook: product_id="${productId}" not configured`);
      return new Response(
        JSON.stringify({ success: true, message: `Ignored: product ${productId} not configured` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buyer info
    const buyer = data?.Customer || data?.customer || payload?.Customer || payload?.customer || {};
    const customerName = String(
      pickFirst(buyer.full_name, buyer.name, buyer.first_name) || 'Nome não informado'
    ).trim();
    const customerEmail = (pickFirst(buyer.email) as string | null)?.trim()?.toLowerCase() || null;
    const rawPhone = pickFirst(buyer.mobile, buyer.phone, buyer.cellphone, buyer.telephone) as string | null;
    const customerPhone = rawPhone ? String(rawPhone).replace(/\D/g, '') : null;

    const productName = String(
      pickFirst(
        data?.Product?.product_name,
        data?.product?.product_name,
        data?.Product?.name,
        data?.product?.name,
        payload?.product_name,
      ) || 'Produto Kiwify'
    );

    // Value (Kiwify usually sends cents)
    const rawValue = pickFirst(
      data?.Commissions?.charge_amount,
      data?.charge_amount,
      data?.CheckoutItems?.[0]?.price,
      payload?.charge_amount,
      payload?.price,
    );
    let transValue: number | null = null;
    if (rawValue !== null && rawValue !== undefined) {
      const n = Number(rawValue);
      if (!isNaN(n)) transValue = n > 1000 ? n / 100 : n; // assume cents if large
    }

    const transCod = String(
      pickFirst(data?.order_id, payload?.order_id, data?.id, payload?.id) || ''
    );

    console.log('Kiwify customer:', { customerName, customerEmail, customerPhone, productName, transValue, transCod, targetPipelineSlug });

    // Find existing lead
    let existingLead: any = null;
    if (customerPhone) {
      const { data: leadByPhone } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes')
        .eq('whatsapp', customerPhone)
        .maybeSingle();
      if (leadByPhone) existingLead = leadByPhone;
    }
    if (!existingLead && customerEmail) {
      const { data: leadByEmail } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes')
        .eq('email', customerEmail)
        .maybeSingle();
      if (leadByEmail) existingLead = leadByEmail;
    }

    const today = new Date().toISOString().split('T')[0];
    const purchaseNote = `[COMPRA] ${today} - ${productName} - R$ ${transValue?.toFixed(2) || '0.00'} - Trans: ${transCod}`;

    let leadId: string;
    if (existingLead) {
      const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
      if (!existingLead.whatsapp && customerPhone) updateData.whatsapp = customerPhone;
      if (!existingLead.email && customerEmail) updateData.email = customerEmail;
      if (transValue) updateData.valor_lead = transValue;
      updateData.observacoes = existingLead.observacoes
        ? `${existingLead.observacoes}\n${purchaseNote}`
        : purchaseNote;

      const { error: updateError } = await supabase.from('leads').update(updateData).eq('id', existingLead.id);
      if (updateError) throw updateError;
      leadId = existingLead.id;
    } else {
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          nome: customerName,
          email: customerEmail,
          whatsapp: customerPhone,
          origem: `Kiwify - ${productName}`,
          valor_lead: transValue,
          status_geral: 'lead',
          observacoes: purchaseNote,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      leadId = newLead.id;
    }

    // Pipeline + first stage
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, nome')
      .eq('slug', targetPipelineSlug)
      .eq('ativo', true)
      .maybeSingle();
    if (pipelineError || !pipeline) throw new Error(`Pipeline "${targetPipelineSlug}" not found`);

    const { data: firstStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, nome')
      .eq('pipeline_id', pipeline.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (stageError || !firstStage) throw new Error('First stage not found for pipeline');

    // Already enrolled?
    const { data: existingEntry } = await supabase
      .from('lead_pipeline_entries')
      .select('id')
      .eq('lead_id', leadId)
      .eq('pipeline_id', pipeline.id)
      .eq('status_inscricao', 'Ativo')
      .maybeSingle();

    if (existingEntry) {
      await notifyAdmins(supabase, {
        type: 'automation',
        priority: 'low',
        title: 'Compra Kiwify - Lead já inscrito',
        message: `${customerName} comprou ${productName} - R$ ${transValue?.toFixed(2) || '0.00'}, mas já está inscrito no pipeline ${pipeline.nome}.`,
        leadId,
        leadName: customerName,
        actionUrl: `/pipelines?lead=${leadId}`,
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Lead already enrolled', lead_id: leadId, entry_id: existingEntry.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enroll
    const now = new Date().toISOString();
    const { data: newEntry, error: entryError } = await supabase
      .from('lead_pipeline_entries')
      .insert({
        lead_id: leadId,
        pipeline_id: pipeline.id,
        etapa_atual_id: firstStage.id,
        status_inscricao: 'Ativo',
        data_inscricao: now,
        data_entrada_etapa: now,
        saude_etapa: 'Verde',
      })
      .select('id')
      .single();
    if (entryError) throw entryError;

    await supabase.from('lead_activity_log').insert({
      lead_id: leadId,
      pipeline_entry_id: newEntry.id,
      activity_type: 'pipeline_inscription',
      details: {
        pipeline_name: pipeline.nome,
        stage_name: firstStage.nome,
        source: 'kiwify_webhook',
        product: productName,
        product_id: productId,
        trans_cod: transCod,
        value: transValue,
      },
    });

    await notifyAdmins(supabase, {
      type: 'automation',
      priority: 'medium',
      title: 'Nova Compra Kiwify',
      message: `${customerName} comprou ${productName} - R$ ${transValue?.toFixed(2) || '0.00'}. Lead inscrito no pipeline ${pipeline.nome}.`,
      leadId,
      leadName: customerName,
      actionUrl: `/pipelines?lead=${leadId}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead created/updated and enrolled',
        lead_id: leadId,
        entry_id: newEntry.id,
        pipeline: pipeline.nome,
        stage: firstStage.nome,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Kiwify webhook processing error:', error);
    try {
      await notifyAdmins(supabase, {
        type: 'automation',
        priority: 'critical',
        title: 'Erro no Webhook Kiwify',
        message: `Erro ao processar compra: ${error.message || 'Erro interno'}`,
      });
    } catch (_) {}

    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
