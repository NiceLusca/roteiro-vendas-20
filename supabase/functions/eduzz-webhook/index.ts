import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Pipeline slug to enroll buyers
const TARGET_PIPELINE_SLUG = 'mentoria-society';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Handle array payload (n8n sends array)
    const data = Array.isArray(payload) ? payload[0]?.body || payload[0] : payload.body || payload;

    // Validate trans_status === 3 (approved payment)
    if (data.trans_status !== 3) {
      console.log(`Ignoring webhook: trans_status = ${data.trans_status} (not approved)`);
      return new Response(
        JSON.stringify({ success: true, message: 'Ignored: payment not approved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract customer data (using cus_ fields)
    const customerName = data.cus_name?.trim() || 'Nome não informado';
    const customerEmail = data.cus_email?.trim()?.toLowerCase() || null;
    const customerPhone = data.cus_cel?.replace(/\D/g, '') || null; // Clean phone number
    const productName = data.product_name || null;
    const transValue = parseFloat(data.trans_value) || null;
    const transCod = data.trans_cod?.toString() || null;

    console.log('Customer data extracted:', {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      product: productName,
      value: transValue,
      transCod
    });

    // Search for existing lead by whatsapp OR email
    let existingLead = null;

    if (customerPhone) {
      const { data: leadByPhone } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp')
        .eq('whatsapp', customerPhone)
        .maybeSingle();
      
      if (leadByPhone) {
        existingLead = leadByPhone;
        console.log('Found existing lead by phone:', existingLead.id);
      }
    }

    if (!existingLead && customerEmail) {
      const { data: leadByEmail } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp')
        .eq('email', customerEmail)
        .maybeSingle();
      
      if (leadByEmail) {
        existingLead = leadByEmail;
        console.log('Found existing lead by email:', existingLead.id);
      }
    }

    let leadId: string;

    if (existingLead) {
      // Update existing lead
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      // Only update fields that are empty or add new info
      if (!existingLead.whatsapp && customerPhone) {
        updateData.whatsapp = customerPhone;
      }
      if (!existingLead.email && customerEmail) {
        updateData.email = customerEmail;
      }
      if (transValue) {
        updateData.valor_lead = transValue;
      }

      // Add purchase info to observacoes
      const purchaseNote = `[COMPRA] ${new Date().toISOString().split('T')[0]} - ${productName} - R$ ${transValue?.toFixed(2) || '0.00'} - Trans: ${transCod}`;
      updateData.observacoes = existingLead.observacoes 
        ? `${existingLead.observacoes}\n${purchaseNote}`
        : purchaseNote;

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead.id);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        throw updateError;
      }

      leadId = existingLead.id;
      console.log('Lead updated:', leadId);
    } else {
      // Create new lead
      const newLeadData = {
        nome: customerName,
        email: customerEmail,
        whatsapp: customerPhone,
        origem: productName || 'Eduzz',
        valor_lead: transValue,
        status_geral: 'lead',
        observacoes: `[COMPRA] ${new Date().toISOString().split('T')[0]} - ${productName} - R$ ${transValue?.toFixed(2) || '0.00'} - Trans: ${transCod}`,
      };

      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating lead:', insertError);
        throw insertError;
      }

      leadId = newLead.id;
      console.log('New lead created:', leadId);
    }

    // Get target pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id, nome')
      .eq('slug', TARGET_PIPELINE_SLUG)
      .eq('ativo', true)
      .maybeSingle();

    if (pipelineError || !pipeline) {
      console.error('Pipeline not found:', TARGET_PIPELINE_SLUG, pipelineError);
      throw new Error(`Pipeline "${TARGET_PIPELINE_SLUG}" not found`);
    }

    console.log('Target pipeline:', pipeline.id, pipeline.nome);

    // Get first stage of pipeline
    const { data: firstStage, error: stageError } = await supabase
      .from('pipeline_stages')
      .select('id, nome')
      .eq('pipeline_id', pipeline.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (stageError || !firstStage) {
      console.error('First stage not found for pipeline:', pipeline.id, stageError);
      throw new Error('First stage not found for pipeline');
    }

    console.log('First stage:', firstStage.id, firstStage.nome);

    // Check if lead is already enrolled in this pipeline
    const { data: existingEntry } = await supabase
      .from('lead_pipeline_entries')
      .select('id')
      .eq('lead_id', leadId)
      .eq('pipeline_id', pipeline.id)
      .eq('status_inscricao', 'ativo')
      .maybeSingle();

    if (existingEntry) {
      console.log('Lead already enrolled in pipeline:', existingEntry.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead already enrolled in pipeline',
          lead_id: leadId,
          entry_id: existingEntry.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enroll lead in pipeline
    const now = new Date().toISOString();
    const { data: newEntry, error: entryError } = await supabase
      .from('lead_pipeline_entries')
      .insert({
        lead_id: leadId,
        pipeline_id: pipeline.id,
        etapa_atual_id: firstStage.id,
        status_inscricao: 'ativo',
        data_inscricao: now,
        data_entrada_etapa: now,
        saude_etapa: 'Verde',
      })
      .select('id')
      .single();

    if (entryError) {
      console.error('Error enrolling lead in pipeline:', entryError);
      throw entryError;
    }

    console.log('Lead enrolled in pipeline:', newEntry.id);

    // Log activity
    await supabase
      .from('lead_activity_log')
      .insert({
        lead_id: leadId,
        pipeline_entry_id: newEntry.id,
        activity_type: 'pipeline_inscription',
        details: {
          pipeline_name: pipeline.nome,
          stage_name: firstStage.nome,
          source: 'eduzz_webhook',
          product: productName,
          trans_cod: transCod,
          value: transValue
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead created/updated and enrolled in pipeline',
        lead_id: leadId,
        entry_id: newEntry.id,
        pipeline: pipeline.nome,
        stage: firstStage.nome
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
