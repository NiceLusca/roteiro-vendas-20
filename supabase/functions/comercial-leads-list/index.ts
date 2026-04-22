// ============================================================================
// Edge Function: comercial-leads-list  (v3 — CORS + closer hierarchy fix)
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const CHUNK_SIZE = 100;
const PAGE = 1000;
const NAO_ATRIBUIDO = "Não atribuído";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function mapStatus(statusGeral: string | null): string {
  switch (statusGeral) {
    case "fechou": return "Fechou";
    case "agendado": return "Agendado";
    case "confirmado": return "Confirmado";
    case "remarcou": return "Remarcou";
    case "nao_compareceu": return "Não Apareceu";
    case "desmarcou": return "Desmarcou";
    case "atendido":
    case "ligacao_realizada": return "Compareceu";
    case "nao_fechou":
    case "ja_possui":
    case "perdido": return "Não Fechou";
    case "em_negociacao": return "Aguardando resposta";
    case "cliente": return "Mentorado";
    case "closer_ausente": return "No Show";
    default:
      return statusGeral
        ? statusGeral.charAt(0).toUpperCase() + statusGeral.slice(1)
        : "";
  }
}

function resolvePeriod(params: URLSearchParams | Record<string, any>) {
  const get = (k: string) =>
    params instanceof URLSearchParams ? params.get(k) : params[k] ?? null;

  const periodo = (get("periodo") as string) || "mes_atual";
  let dataInicio = get("data_inicio") as string | null;
  let dataFim = get("data_fim") as string | null;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (dataInicio && dataFim) return { dataInicio, dataFim, periodo };

  switch (periodo) {
    case "mes_atual":
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      dataFim = today; break;
    case "mes_anterior":
      dataInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      dataFim = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0]; break;
    case "ultimos_30_dias":
      dataInicio = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
      dataFim = today; break;
    case "ultimos_7_dias":
      dataInicio = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
      dataFim = today; break;
    case "hoje":
      dataInicio = today; dataFim = today; break;
    case "ano_atual":
      dataInicio = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      dataFim = today; break;
    default:
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      dataFim = today;
  }
  return { dataInicio, dataFim, periodo };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    let params: URLSearchParams | Record<string, any> = url.searchParams;
    let closersFilter: string[] = [];
    let origensFilter: string[] = [];

    if (req.method === "POST") {
      try {
        const body = await req.json();
        params = body;
        closersFilter = Array.isArray(body.closer) ? body.closer : [];
        origensFilter = Array.isArray(body.origem) ? body.origem : [];
      } catch {/* body vazio */}
    } else {
      const c = url.searchParams.getAll("closer");
      const o = url.searchParams.getAll("origem");
      if (c.length) closersFilter = c;
      if (o.length) origensFilter = o;
    }

    const { dataInicio, dataFim, periodo } = resolvePeriod(params);
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataInicio!) || !dateRegex.test(dataFim!)) {
      return jsonResponse({ error: "datas devem estar em YYYY-MM-DD" }, 400);
    }

    console.log(
      `[comercial-leads-list v3] periodo=${periodo} ${dataInicio}→${dataFim} ` +
      `closers=${closersFilter.length} origens=${origensFilter.length}`,
    );

    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines").select("id").eq("slug", "comercial").single();
    if (pipelineError || !pipeline) {
      return jsonResponse({ error: "Pipeline comercial não encontrado" }, 404);
    }

    const allEntryLeadIds: string[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from("lead_pipeline_entries")
        .select("lead_id")
        .eq("pipeline_id", pipeline.id)
        .range(from, from + PAGE - 1);
      if (error) { console.error("[entries err]", error); break; }
      if (!data || data.length === 0) break;
      data.forEach((d: any) => allEntryLeadIds.push(d.lead_id));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const uniqueLeadIds = [...new Set(allEntryLeadIds)];

    if (uniqueLeadIds.length === 0) {
      return jsonResponse({ leads: [], total: 0, periodo: { data_inicio: dataInicio, data_fim: dataFim } });
    }

    const allLeads: any[] = [];
    for (let i = 0; i < uniqueLeadIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, email, whatsapp, origem, status_geral, closer, objecao_principal, created_at")
        .in("id", chunk)
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);
      if (error) console.error(`[leads chunk err]`, error);
      if (data) allLeads.push(...data);
    }

    if (allLeads.length === 0) {
      return jsonResponse({ leads: [], total: 0, periodo: { data_inicio: dataInicio, data_fim: dataFim } });
    }

    const leadIds = allLeads.map((l: any) => l.id);

    const dealCloserMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("deals")
        .select("lead_id, created_at, recorrente, profiles!deals_closer_id_fkey(nome, full_name)")
        .in("lead_id", chunk)
        .order("created_at", { ascending: false });
      if (error) { console.error("[deals err]", error); continue; }
      (data || []).forEach((d: any) => {
        const name = d.profiles?.nome || d.profiles?.full_name;
        if (name && !dealCloserMap.has(d.lead_id)) dealCloserMap.set(d.lead_id, name);
      });
    }

    const respCloserMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("lead_responsibles")
        .select("lead_id, is_primary, profiles!lead_responsibles_user_id_fkey(nome, full_name)")
        .in("lead_id", chunk)
        .eq("is_primary", true);
      if (error) { console.error("[responsibles err]", error); continue; }
      (data || []).forEach((r: any) => {
        const name = r.profiles?.nome || r.profiles?.full_name;
        if (name) respCloserMap.set(r.lead_id, name);
      });
    }

    const apptMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("appointments")
        .select("lead_id, start_at, data_hora")
        .in("lead_id", chunk)
        .order("start_at", { ascending: false });
      if (error) { console.error("[appts err]", error); continue; }
      (data || []).forEach((a: any) => {
        if (!apptMap.has(a.lead_id)) apptMap.set(a.lead_id, { start_at: a.start_at || a.data_hora });
      });
    }

    // Aggregate orders per lead. Recurrence is determined by deals.recorrente
    // (order_items doesn't store recorrencia in this schema reliably).
    const orderAggMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, lead_id, valor_total, data_venda, deal_id, deals(recorrente), order_items(preco_unitario, recorrencia, products(nome))")
        .in("lead_id", chunk);
      if (error) { console.error("[orders err]", error); continue; }
      (orders || []).forEach((o: any) => {
        const items = (o.order_items || []) as any[];
        const recorrenteFromDeal = !!o.deals?.recorrente;
        const recorrenteFromItems = items.some((it) => it.recorrencia && it.recorrencia !== "Nenhuma");
        const recorrente = recorrenteFromDeal || recorrenteFromItems;
        const produto = items[0]?.products?.nome || null;
        const prev = orderAggMap.get(o.lead_id);
        orderAggMap.set(o.lead_id, {
          total: (prev?.total || 0) + (Number(o.valor_total) || 0),
          recorrente: prev?.recorrente || recorrente,
          produto: prev?.produto || produto,
          data_venda: prev?.data_venda || o.data_venda,
        });
      });
    }

    const resolveCloser = (l: any): string =>
      dealCloserMap.get(l.id)
        ?? respCloserMap.get(l.id)
        ?? (l.closer && l.closer.trim() ? l.closer.trim() : NAO_ATRIBUIDO);

    let leads = allLeads.map((l: any, idx: number) => {
      const apt = apptMap.get(l.id);
      const order = orderAggMap.get(l.id);
      const closer = resolveCloser(l);
      const dateIso = (apt?.start_at || l.created_at) as string;
      const dateOnly = dateIso ? dateIso.split("T")[0] : "";
      const hora = dateIso && dateIso.includes("T")
        ? dateIso.split("T")[1].substring(0, 5) : "";

      return {
        row_number: idx + 1,
        id: l.id,
        data: dateOnly,
        parsedDate: dateIso,
        Hora: hora,
        Nome: l.nome || "",
        "e-mail": l.email || "",
        Whatsapp: l.whatsapp || "",
        origem: l.origem || "Não informado",
        Origem: l.origem || "Não informado",
        Status: mapStatus(l.status_geral),
        Closer: closer,
        Vendedor: closer,
        Valor: order?.total || 0,
        "Venda Completa": order?.recorrente ? 0 : (order?.total || 0),
        recorrente: order?.recorrente ? (order?.total || 0) : 0,
        Recorrente: order?.recorrente ? (order?.total || 0) : 0,
        Produto: order?.produto || "",
        objecao_principal: l.objecao_principal || "",
        status_geral: l.status_geral,
      };
    });

    if (closersFilter.length > 0) {
      const set = new Set(closersFilter.map((c) => c.toLowerCase()));
      leads = leads.filter((l) => set.has((l.Closer || "").toLowerCase()));
    }
    if (origensFilter.length > 0) {
      const set = new Set(origensFilter.map((c) => c.toLowerCase()));
      leads = leads.filter((l) => set.has((l.origem || "").toLowerCase()));
    }

    const closerCounts = new Map();
    leads.forEach((l) => closerCounts.set(l.Closer, (closerCounts.get(l.Closer) || 0) + 1));
    console.log(`[comercial-leads-list v3] closers únicos = ${closerCounts.size}:`,
      Array.from(closerCounts.entries()).map(([k, v]) => `${k}=${v}`).join(", "));

    return jsonResponse({
      leads,
      total: leads.length,
      periodo: { data_inicio: dataInicio, data_fim: dataFim },
    });
  } catch (err: any) {
    console.error("[comercial-leads-list v3] erro fatal", err);
    return jsonResponse({ error: "Erro interno ao listar leads", details: String(err?.message || err) }, 500);
  }
});
