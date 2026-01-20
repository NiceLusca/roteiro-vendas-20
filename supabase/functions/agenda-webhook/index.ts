import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Pipeline slug para onde os leads agendados serão inscritos
const TARGET_PIPELINE_SLUG = 'comercial';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const payload = await req.json();
    
    console.log('Agenda webhook received:', JSON.stringify(payload, null, 2));

    // Handle array payload (n8n pode enviar array)
    const rawPayload = Array.isArray(payload) ? payload[0]?.body || payload[0] : payload.body || payload;

    // Extract data from payload
    const nome = rawPayload.nome?.trim() || 'Nome não informado';
    const email = rawPayload.email?.trim()?.toLowerCase() || null;
    const whatsapp = (rawPayload.whatsapp || '').replace(/\D/g, '') || null;
    const dataSessao = rawPayload.data_sessao || rawPayload.dataSessao || null;
    const desejoSessao = rawPayload.desejo_sessao || rawPayload.desejoSessao || null;
    const tituloEvento = rawPayload.titulo || rawPayload.title || 'Sessão Agendada';

    console.log('Parsed data:', { nome, email, whatsapp, dataSessao, desejoSessao, tituloEvento });

    // Validate required fields
    if (!whatsapp && !email) {
      console.error('Missing required contact info: need whatsapp or email');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'É necessário informar whatsapp ou email' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for existing lead by whatsapp OR email
    let existingLead = null;

    if (whatsapp) {
      const { data: leadByPhone } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes, desejo_na_sessao')
        .eq('whatsapp', whatsapp)
        .maybeSingle();
      
      if (leadByPhone) {
        existingLead = leadByPhone;
        console.log('Found existing lead by whatsapp:', existingLead.id);
      }
    }

    if (!existingLead && email) {
      const { data: leadByEmail } = await supabase
        .from('leads')
        .select('id, nome, email, whatsapp, observacoes, desejo_na_sessao')
        .eq('email', email)
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
      if (!existingLead.whatsapp && whatsapp) {
        updateData.whatsapp = whatsapp;
      }
      if (!existingLead.email && email) {
        updateData.email = email;
      }
      if (desejoSessao && (!existingLead.desejo_na_sessao || existingLead.desejo_na_sessao !== desejoSessao)) {
        updateData.desejo_na_sessao = desejoSessao;
      }

      // Add scheduling note to observacoes
      const scheduleNote = `[AGENDAMENTO] ${new Date().toISOString().split('T')[0]} - ${tituloEvento} - Sessão: ${dataSessao || 'Data não informada'}`;
      updateData.observacoes = existingLead.observacoes 
        ? `${existingLead.observacoes}\n${scheduleNote}`
        : scheduleNote;

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
        nome,
        email,
        whatsapp,
        origem: 'Agenda Oceano',
        desejo_na_sessao: desejoSessao,
        status_geral: 'lead',
        observacoes: `[AGENDAMENTO] ${new Date().toISOString().split('T')[0]} - ${tituloEvento}`,
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

    // Create appointment if date is provided
    let appointmentId: string | null = null;
    if (dataSessao) {
      const appointmentData = {
        lead_id: leadId,
        data_hora: dataSessao,
        start_at: dataSessao,
        status: 'Agendado',
        titulo: tituloEvento,
        notas: desejoSessao || null,
      };

      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('id')
        .single();

      if (appointmentError) {
        console.error('Error creating appointment:', appointmentError);
        // Don't throw - lead was created, appointment is secondary
      } else {
        appointmentId = newAppointment.id;
        console.log('Appointment created:', appointmentId);
      }
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
      // Don't throw - lead was created, pipeline inscription is secondary
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead created/updated but pipeline not found',
          lead_id: leadId,
          appointment_id: appointmentId,
          warning: `Pipeline "${TARGET_PIPELINE_SLUG}" not found`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Lead created/updated but first stage not found',
          lead_id: leadId,
          appointment_id: appointmentId,
          warning: 'First stage not found for pipeline'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('First stage:', firstStage.id, firstStage.nome);

    // Check if lead is already enrolled in this pipeline
    const { data: existingEntry } = await supabase
      .from('lead_pipeline_entries')
      .select('id')
      .eq('lead_id', leadId)
      .eq('pipeline_id', pipeline.id)
      .eq('status_inscricao', 'Ativo')
      .maybeSingle();

    let entryId: string | null = null;

    if (existingEntry) {
      console.log('Lead already enrolled in pipeline:', existingEntry.id);
      entryId = existingEntry.id;
    } else {
      // Enroll lead in pipeline
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

      if (entryError) {
        console.error('Error enrolling lead in pipeline:', entryError);
        // Don't throw - lead and appointment were created
      } else {
        entryId = newEntry.id;
        console.log('Lead enrolled in pipeline:', entryId);
      }
    }

    // Log activity
    if (entryId) {
      await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: leadId,
          pipeline_entry_id: entryId,
          activity_type: 'pipeline_inscription',
          details: {
            pipeline_name: pipeline.nome,
            stage_name: firstStage.nome,
            source: 'agenda_webhook',
            titulo_evento: tituloEvento,
            data_sessao: dataSessao,
            appointment_id: appointmentId
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: existingLead ? 'Lead updated and appointment created' : 'Lead created and enrolled in pipeline',
        lead_id: leadId,
        appointment_id: appointmentId,
        entry_id: entryId,
        pipeline: pipeline?.nome,
        stage: firstStage?.nome
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
