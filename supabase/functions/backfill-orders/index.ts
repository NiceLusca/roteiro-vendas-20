import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("[backfill-orders] Iniciando backfill de orders para deals ganhos...");

    // Get all won deals without orders
    const { data: dealsWithoutOrders, error: dealsError } = await supabase
      .from("deals")
      .select(`
        id,
        lead_id,
        valor_proposto,
        recorrente,
        data_fechamento,
        leads!deals_lead_id_fkey(nome, origem)
      `)
      .eq("status", "ganho");

    if (dealsError) {
      console.error("[backfill-orders] Erro ao buscar deals:", dealsError);
      throw dealsError;
    }

    console.log(`[backfill-orders] ${dealsWithoutOrders?.length || 0} deals ganhos encontrados`);

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const deal of dealsWithoutOrders || []) {
      // Check if order already exists for this deal
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .eq("deal_id", deal.id)
        .maybeSingle();

      if (existingOrder) {
        skipped.push(deal.id);
        console.log(`[backfill-orders] Order já existe para deal ${deal.id}, pulando`);
        continue;
      }

      // Get primary responsible for the lead
      const { data: primaryResp } = await supabase
        .from("lead_responsibles")
        .select(`
          user_id,
          profiles!lead_responsibles_user_id_fkey(nome, full_name)
        `)
        .eq("lead_id", deal.lead_id)
        .eq("is_primary", true)
        .maybeSingle();

      const closerName = (primaryResp?.profiles as any)?.nome 
        || (primaryResp?.profiles as any)?.full_name 
        || "Não atribuído";

      console.log(`[backfill-orders] Criando order para deal ${deal.id}, closer: ${closerName}`);

      // Create the order
      const { error: insertError } = await supabase
        .from("orders")
        .insert({
          lead_id: deal.lead_id,
          deal_id: deal.id,
          valor_total: deal.valor_proposto,
          closer: closerName,
          status_pagamento: "pago",
          data_venda: deal.data_fechamento || new Date().toISOString()
        });

      if (insertError) {
        console.error(`[backfill-orders] Erro ao criar order para deal ${deal.id}:`, insertError);
        errors.push(`${deal.id}: ${insertError.message}`);
      } else {
        created.push(deal.id);
        console.log(`[backfill-orders] Order criada para deal ${deal.id}`);
      }
    }

    const result = {
      success: true,
      summary: {
        total_deals: dealsWithoutOrders?.length || 0,
        orders_created: created.length,
        orders_skipped: skipped.length,
        errors: errors.length
      },
      details: {
        created,
        skipped,
        errors
      }
    };

    console.log("[backfill-orders] Resultado:", JSON.stringify(result));

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("[backfill-orders] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
