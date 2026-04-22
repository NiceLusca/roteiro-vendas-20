// ============================================================================
// Edge Function: comercial-metrics  (v4 — closer hierarchy + parity fix)
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

function isFechouStatus(s: string | null): boolean {
  return s === "fechou" || s === "cliente";
}

function isAtendidoStatus(s: string | null): boolean {
  return (
    s === "atendido" ||
    s === "ligacao_realizada" ||
    s === "fechou" ||
    s === "cliente" ||
    s === "nao_fechou" ||
    s === "ja_possui" ||
    s === "perdido"
  );
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
      return jsonResponse({
        resumo: { total_leads: 0, agendamentos: 0, atendimentos: 0, fechamentos: 0 },
        financeiro: { receita_total: 0, ticket_medio: 0 },
        por_closer: [],
        por_origem: [],
        periodo: { data_inicio: dataInicio, data_fim: dataFim },
      });
    }

    const allLeads: any[] = [];
    for (let i = 0; i < uniqueLeadIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, origem, status_geral, closer, created_at")
        .in("id", chunk)
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);
      if (error) console.error(`[leads chunk err]`, error);
      if (data) allLeads.push(...data);
    }

    if (allLeads.length === 0) {
      return jsonResponse({
        resumo: { total_leads: 0, agendamentos: 0, atendimentos: 0, fechamentos: 0 },
        financeiro: { receita_total: 0, ticket_medio: 0 },
        por_closer: [],
        por_origem: [],
        periodo: { data_inicio: dataInicio, data_fim: dataFim },
      });
    }

    const leadIds = allLeads.map((l: any) => l.id);

    const dealCloserMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("deals")
        .select("lead_id, created_at, profiles!deals_closer_id_fkey(nome, full_name)")
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

    const apptLeadSet = new Set();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("appointments")
        .select("lead_id")
        .in("lead_id", chunk);
      if (error) { console.error("[appts err]", error); continue; }
      (data || []).forEach((a: any) => apptLeadSet.add(a.lead_id));
    }

    const orderTotalMap = new Map();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data: orders, error } = await supabase
        .from("orders")
        .select("lead_id, valor_total")
        .in("lead_id", chunk);
      if (error) { console.error("[orders err]", error); continue; }
      (orders || []).forEach((o: any) => {
        const prev = orderTotalMap.get(o.lead_id) || 0;
        orderTotalMap.set(o.lead_id, prev + (Number(o.valor_total) || 0));
      });
    }

    const resolveCloser = (l: any): string =>
      dealCloserMap.get(l.id)
        ?? respCloserMap.get(l.id)
        ?? (l.closer && l.closer.trim() ? l.closer.trim() : NAO_ATRIBUIDO);

    let workingLeads = allLeads.map((l: any) => ({
      ...l,
      __closer: resolveCloser(l),
      __receita: orderTotalMap.get(l.id) || 0,
      __agendado: apptLeadSet.has(l.id),
    }));

    if (closersFilter.length > 0) {
      const set = new Set(closersFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.__closer || "").toLowerCase()));
    }
    if (origensFilter.length > 0) {
      const set = new Set(origensFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.origem || "").toLowerCase()));
    }

    const total_leads = workingLeads.length;
    const agendamentos = workingLeads.filter((l) => l.__agendado).length;
    const atendimentos = workingLeads.filter((l) => isAtendidoStatus(l.status_geral)).length;
    const fechamentos = workingLeads.filter((l) => isFechouStatus(l.status_geral)).length;
    const receita_total = workingLeads.reduce((acc, l) => acc + l.__receita, 0);
    const ticket_medio = fechamentos > 0 ? receita_total / fechamentos : 0;

    const closerAgg = new Map();

    for (const l of workingLeads) {
      const key = l.__closer || NAO_ATRIBUIDO;
      const cur = closerAgg.get(key) ?? {
        leads: 0, agendamentos: 0, atendimentos: 0, fechamentos: 0, receita: 0,
      };
      cur.leads += 1;
      if (l.__agendado) cur.agendamentos += 1;
      if (isAtendidoStatus(l.status_geral)) cur.atendimentos += 1;
      if (isFechouStatus(l.status_geral)) cur.fechamentos += 1;
      cur.receita += l.__receita;
      closerAgg.set(key, cur);
    }

    const por_closer = Array.from(closerAgg.entries())
      .map(([nome, v]) => ({
        nome,
        leads: v.leads,
        agendamentos: v.agendamentos,
        atendimentos: v.atendimentos,
        fechamentos: v.fechamentos,
        receita: v.receita,
        taxa_conversao: v.atendimentos > 0 ? v.fechamentos / v.atendimentos : 0,
        taxa_fechamento: v.leads > 0 ? v.fechamentos / v.leads : 0,
        ticket_medio: v.fechamentos > 0 ? v.receita / v.fechamentos : 0,
      }))
      .sort((a, b) => b.receita - a.receita);

    const origemAgg = new Map();
    for (const l of workingLeads) {
      const key = l.origem || "Não informado";
      const cur = origemAgg.get(key) ?? { leads: 0, fechamentos: 0, receita: 0 };
      cur.leads += 1;
      if (isFechouStatus(l.status_geral)) cur.fechamentos += 1;
      cur.receita += l.__receita;
      origemAgg.set(key, cur);
    }
    const por_origem = Array.from(origemAgg.entries())
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.leads - a.leads);

    const sumLeads = por_closer.reduce((a, c) => a + c.leads, 0);
    const sumReceita = por_closer.reduce((a, c) => a + c.receita, 0);
    if (sumLeads !== total_leads) {
      console.warn(`[comercial-metrics v4] PARITY MISMATCH leads: closer=${sumLeads} total=${total_leads}`);
    }
    if (Math.abs(sumReceita - receita_total) > 0.01) {
      console.warn(`[comercial-metrics v4] PARITY MISMATCH receita: closer=${sumReceita} total=${receita_total}`);
    }

    console.log(`[comercial-metrics v4] total=${total_leads} closers=${por_closer.length} sumLeads=${sumLeads} receita=${receita_total}`);

    return jsonResponse({
      resumo: { total_leads, agendamentos, atendimentos, fechamentos },
      financeiro: { receita_total, ticket_medio },
      por_closer,
      por_origem,
      periodo: { data_inicio: dataInicio, data_fim: dataFim },
    });
  } catch (err: any) {
    console.error("[comercial-metrics v4] erro fatal", err);
    return jsonResponse({ error: "Erro interno ao calcular métricas", details: String(err?.message || err) }, 500);
  }
});
