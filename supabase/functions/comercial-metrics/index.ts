// ============================================================================
// Edge Function: comercial-metrics  (v5 — payload completo nested + legado)
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

// ---- Status classifiers ---------------------------------------------------
const STATUS_FECHOU = new Set(["fechou"]);
const STATUS_MENTORADO = new Set(["cliente", "mentorado"]);
const STATUS_COMPARECEU = new Set([
  "atendido", "ligacao_realizada", "fechou", "nao_fechou", "ja_possui", "perdido",
]);
const STATUS_NO_SHOW = new Set(["nao_compareceu", "closer_ausente"]);
const STATUS_PENDENTE = new Set(["agendado", "confirmado", "remarcou"]);
const STATUS_PERDIDO = new Set(["nao_fechou", "ja_possui", "perdido"]);

const isFechou = (s: string | null) => !!s && STATUS_FECHOU.has(s);
const isMentorado = (s: string | null) => !!s && STATUS_MENTORADO.has(s);
const isCompareceu = (s: string | null) => !!s && STATUS_COMPARECEU.has(s);
const isNoShow = (s: string | null) => !!s && STATUS_NO_SHOW.has(s);
const isPendente = (s: string | null) => !!s && STATUS_PENDENTE.has(s);
const isPerdido = (s: string | null) => !!s && STATUS_PERDIDO.has(s);

// Legacy "atendido" set (mantido para campo legado raiz `resumo.atendimentos`)
const isAtendidoLegacy = (s: string | null) =>
  !!s && (STATUS_COMPARECEU.has(s) || s === "cliente");

function statusGrupo(s: string | null): string {
  if (!s) return "Outro";
  if (isFechou(s)) return "Fechamento";
  if (isMentorado(s)) return "Mentorado";
  if (isPendente(s)) return "Pendente";
  if (isNoShow(s)) return "No-Show";
  if (isPerdido(s)) return "Perdido";
  if (s === "atendido" || s === "ligacao_realizada") return "Atendido";
  return "Outro";
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

function emptyResponse(dataInicio: string, dataFim: string, periodo: string, pipeline?: { id: string; nome: string }) {
  const dias = Math.max(1, Math.round((+new Date(dataFim) - +new Date(dataInicio)) / 86400000) + 1);
  return {
    periodo: { inicio: dataInicio, fim: dataFim, data_inicio: dataInicio, data_fim: dataFim, tipo: periodo, dias_totais: dias },
    pipeline: pipeline ?? { id: "", nome: "Comercial" },
    fonte: "supabase-direct",
    gerado_em: new Date().toISOString(),
    // legado raiz
    resumo: { total_leads: 0, agendamentos: 0, atendimentos: 0, fechamentos: 0 },
    financeiro: { receita_total: 0, ticket_medio: 0 },
    por_closer: [],
    por_origem: [],
    // nested completo
    metricas: {
      resumo: { total_leads: 0, mentorados: 0, leads_validos: 0 },
      sessoes: {
        pendentes: { agendado: 0, confirmado: 0, remarcou: 0, total: 0 },
        compareceram: 0, nao_compareceram: 0, no_show: 0, taxa_comparecimento: 0,
      },
      vendas: {
        fechamentos_diretos: 0, fechamentos_recuperacao: 0, total_fechamentos: 0,
        taxa_conversao: 0, perdidos_pos_sessao: 0, perdidos_sem_sessao: 0, em_recuperacao: 0,
      },
      financeiro: {
        receita_total: 0, ticket_medio: 0,
        receita_recorrente: 0, receita_avista: 0,
        ticket_medio_recorrente: 0, ticket_medio_avista: 0,
        vendas_recorrente: 0, vendas_avista: 0,
      },
      por_tipo_venda: {
        recorrente: { vendas: 0, receita: 0 },
        avista: { vendas: 0, receita: 0 },
      },
      por_closer: [],
      por_origem: [],
      por_etapa: [],
      por_status: [],
      por_produto: [],
      lista_vendas: [],
      cruzamentos: {
        closer_x_origem: [],
        closer_x_produto: [],
        closer_x_tipo_venda: [],
      },
    },
  };
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
      .from("pipelines").select("id, nome").eq("slug", "comercial").single();
    if (pipelineError || !pipeline) {
      return jsonResponse({ error: "Pipeline comercial não encontrado" }, 404);
    }

    // ---- Leads do pipeline comercial -------------------------------------
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
      return jsonResponse(emptyResponse(dataInicio!, dataFim!, periodo, { id: pipeline.id, nome: pipeline.nome }));
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
      return jsonResponse(emptyResponse(dataInicio!, dataFim!, periodo, { id: pipeline.id, nome: pipeline.nome }));
    }

    const leadIds = allLeads.map((l: any) => l.id);

    // ---- Closer hierarchy: deals ----------------------------------------
    const dealCloserMap = new Map<string, string>();
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

    // ---- Closer hierarchy: lead_responsibles (primary) -------------------
    const respCloserMap = new Map<string, string>();
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

    // ---- Appointments ---------------------------------------------------
    const apptLeadSet = new Set<string>();
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("appointments")
        .select("lead_id")
        .in("lead_id", chunk);
      if (error) { console.error("[appts err]", error); continue; }
      (data || []).forEach((a: any) => apptLeadSet.add(a.lead_id));
    }

    // ---- Orders + items + product ---------------------------------------
    type OrderRow = {
      id: string;
      lead_id: string | null;
      valor_total: number;
      data_venda: string | null;
      data_pedido: string | null;
      items: { recorrencia: string | null; produto?: string | null }[];
    };
    const ordersByLead = new Map<string, OrderRow[]>();

    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          id, lead_id, valor_total, data_venda, data_pedido,
          order_items ( recorrencia, products ( nome ) )
        `)
        .in("lead_id", chunk);
      if (error) { console.error("[orders err]", error); continue; }
      (orders || []).forEach((o: any) => {
        if (!o.lead_id) return;
        const items = (o.order_items || []).map((it: any) => ({
          recorrencia: it.recorrencia ?? null,
          produto: it.products?.nome ?? null,
        }));
        const row: OrderRow = {
          id: o.id,
          lead_id: o.lead_id,
          valor_total: Number(o.valor_total) || 0,
          data_venda: o.data_venda,
          data_pedido: o.data_pedido,
          items,
        };
        const arr = ordersByLead.get(o.lead_id) || [];
        arr.push(row);
        ordersByLead.set(o.lead_id, arr);
      });
    }

    const isOrderRecurring = (o: OrderRow): boolean =>
      o.items.some((it) => it.recorrencia && it.recorrencia.toLowerCase() !== "nenhuma");

    const orderProduct = (o: OrderRow): string =>
      o.items.find((it) => it.produto)?.produto || "Sem produto";

    const resolveCloser = (l: any): string =>
      dealCloserMap.get(l.id)
        ?? respCloserMap.get(l.id)
        ?? (l.closer && l.closer.trim() ? l.closer.trim() : NAO_ATRIBUIDO);

    // ---- Working set ----------------------------------------------------
    let workingLeads = allLeads.map((l: any) => {
      const orders = ordersByLead.get(l.id) || [];
      const isFechado = isFechou(l.status_geral);
      const receitaFechada = isFechado ? orders.reduce((a, o) => a + o.valor_total, 0) : 0;
      return {
        ...l,
        __closer: resolveCloser(l),
        __orders: orders,
        __agendado: apptLeadSet.has(l.id),
        __mentorado: isMentorado(l.status_geral),
        __fechou: isFechado,
        __receita_fechada: receitaFechada,
      };
    });

    if (closersFilter.length > 0) {
      const set = new Set(closersFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.__closer || "").toLowerCase()));
    }
    if (origensFilter.length > 0) {
      const set = new Set(origensFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.origem || "").toLowerCase()));
    }

    // ---- Resumo ---------------------------------------------------------
    const total_leads = workingLeads.length;
    const mentorados = workingLeads.filter((l) => l.__mentorado).length;
    const leads_validos = workingLeads.filter((l) => !l.__mentorado && l.__agendado).length;

    // ---- Sessões --------------------------------------------------------
    const pendAg = workingLeads.filter((l) => l.status_geral === "agendado").length;
    const pendConf = workingLeads.filter((l) => l.status_geral === "confirmado").length;
    const pendRem = workingLeads.filter((l) => l.status_geral === "remarcou").length;
    const pendTotal = pendAg + pendConf + pendRem;
    const compareceram = workingLeads.filter((l) => isCompareceu(l.status_geral)).length;
    const noShow = workingLeads.filter((l) => isNoShow(l.status_geral)).length;
    const taxa_comparecimento = (compareceram + noShow) > 0
      ? +(compareceram / (compareceram + noShow) * 100).toFixed(2)
      : 0;

    // ---- Vendas ---------------------------------------------------------
    const fechouLeads = workingLeads.filter((l) => l.__fechou);
    const total_fechamentos = fechouLeads.length;
    const perdidos_pos_sessao = workingLeads.filter((l) => isPerdido(l.status_geral) && l.__agendado).length;
    const perdidos_sem_sessao = workingLeads.filter((l) => isPerdido(l.status_geral) && !l.__agendado).length;
    const taxa_conversao = compareceram > 0
      ? +(total_fechamentos / compareceram * 100).toFixed(2)
      : 0;

    // ---- Financeiro -----------------------------------------------------
    let receita_total = 0;
    let receita_recorrente = 0;
    let receita_avista = 0;
    let vendas_recorrente = 0;
    let vendas_avista = 0;

    type Sale = {
      id: string;
      closer: string;
      valor: number;
      origem: string;
      recorrente: boolean;
      produto: string;
      data_venda: string | null;
    };
    const lista_vendas: Sale[] = [];

    for (const l of fechouLeads) {
      for (const o of l.__orders as OrderRow[]) {
        const rec = isOrderRecurring(o);
        receita_total += o.valor_total;
        if (rec) { receita_recorrente += o.valor_total; vendas_recorrente += 1; }
        else { receita_avista += o.valor_total; vendas_avista += 1; }
        lista_vendas.push({
          id: o.id,
          closer: l.__closer,
          valor: o.valor_total,
          origem: l.origem || "Não informado",
          recorrente: rec,
          produto: orderProduct(o),
          data_venda: o.data_venda || o.data_pedido,
        });
      }
    }

    const ticket_medio = total_fechamentos > 0 ? receita_total / total_fechamentos : 0;
    const ticket_medio_recorrente = vendas_recorrente > 0 ? receita_recorrente / vendas_recorrente : 0;
    const ticket_medio_avista = vendas_avista > 0 ? receita_avista / vendas_avista : 0;

    // ---- Por closer (nested) -------------------------------------------
    const closerAgg = new Map<string, any>();
    for (const l of workingLeads) {
      const key = l.__closer || NAO_ATRIBUIDO;
      const cur = closerAgg.get(key) ?? {
        leads: 0, compareceu: 0, fechou: 0, receita: 0,
        recorrente: 0, avista: 0,
        receita_recorrente: 0, receita_avista: 0,
        // legado:
        agendamentos: 0, atendimentos: 0, fechamentos: 0,
      };
      cur.leads += 1;
      if (l.__agendado) cur.agendamentos += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
      if (isAtendidoLegacy(l.status_geral)) cur.atendimentos += 1;
      if (l.__fechou) {
        cur.fechou += 1;
        cur.fechamentos += 1;
        for (const o of l.__orders as OrderRow[]) {
          cur.receita += o.valor_total;
          if (isOrderRecurring(o)) {
            cur.recorrente += 1;
            cur.receita_recorrente += o.valor_total;
          } else {
            cur.avista += 1;
            cur.receita_avista += o.valor_total;
          }
        }
      }
      closerAgg.set(key, cur);
    }

    const por_closer_nested = Array.from(closerAgg.entries())
      .map(([nome, v]) => ({
        closer: nome,
        nome,
        leads: v.leads,
        compareceu: v.compareceu,
        fechou: v.fechou,
        receita: v.receita,
        taxa_conversao: v.compareceu > 0 ? +(v.fechou / v.compareceu * 100).toFixed(2) : 0,
        recorrente: v.recorrente,
        avista: v.avista,
        receita_recorrente: v.receita_recorrente,
        receita_avista: v.receita_avista,
      }))
      .sort((a, b) => b.receita - a.receita);

    // legado raiz
    const por_closer_legacy = Array.from(closerAgg.entries())
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

    // ---- Por origem -----------------------------------------------------
    const origemAgg = new Map<string, any>();
    for (const l of workingLeads) {
      const key = l.origem || "Não informado";
      const cur = origemAgg.get(key) ?? { leads: 0, compareceu: 0, fechou: 0, receita: 0 };
      cur.leads += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
      if (l.__fechou) {
        cur.fechou += 1;
        cur.receita += l.__receita_fechada;
      }
      origemAgg.set(key, cur);
    }
    const por_origem_nested = Array.from(origemAgg.entries())
      .map(([nome, v]) => ({ origem: nome, nome, ...v }))
      .sort((a, b) => b.leads - a.leads);

    const por_origem_legacy = Array.from(origemAgg.entries())
      .map(([nome, v]) => ({ nome, leads: v.leads, fechamentos: v.fechou, receita: v.receita }))
      .sort((a, b) => b.leads - a.leads);

    // ---- Por etapa / status --------------------------------------------
    const statusAgg = new Map<string, number>();
    for (const l of workingLeads) {
      const k = l.status_geral || "sem_status";
      statusAgg.set(k, (statusAgg.get(k) || 0) + 1);
    }
    const por_status = Array.from(statusAgg.entries()).map(([status, total]) => ({
      status, total, grupo: statusGrupo(status),
    }));
    const por_etapa = por_status
      .map((s, idx) => ({ etapa: s.status, grupo: s.grupo, total: s.total, ordem: idx + 1 }));

    // ---- Por produto ----------------------------------------------------
    const produtoAgg = new Map<string, { vendas: number; receita: number }>();
    for (const l of fechouLeads) {
      for (const o of l.__orders as OrderRow[]) {
        const p = orderProduct(o);
        const cur = produtoAgg.get(p) ?? { vendas: 0, receita: 0 };
        cur.vendas += 1;
        cur.receita += o.valor_total;
        produtoAgg.set(p, cur);
      }
    }
    const por_produto = Array.from(produtoAgg.entries())
      .map(([produto, v]) => ({ produto, ...v }))
      .sort((a, b) => b.receita - a.receita);

    // ---- Cruzamentos ----------------------------------------------------
    const xClOrigem = new Map<string, any>();
    for (const l of workingLeads) {
      const k = `${l.__closer}||${l.origem || "Não informado"}`;
      const cur = xClOrigem.get(k) ?? {
        closer: l.__closer, origem: l.origem || "Não informado",
        leads: 0, compareceu: 0, fechou: 0, receita: 0,
      };
      cur.leads += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
      if (l.__fechou) { cur.fechou += 1; cur.receita += l.__receita_fechada; }
      xClOrigem.set(k, cur);
    }
    const closer_x_origem = Array.from(xClOrigem.values())
      .map((v) => ({ ...v, taxa_conversao: v.compareceu > 0 ? +(v.fechou / v.compareceu * 100).toFixed(2) : 0 }));

    const xClProduto = new Map<string, any>();
    const xClTipo = new Map<string, any>();
    for (const l of fechouLeads) {
      for (const o of l.__orders as OrderRow[]) {
        const rec = isOrderRecurring(o);
        const prod = orderProduct(o);

        const kp = `${l.__closer}||${prod}`;
        const cp = xClProduto.get(kp) ?? {
          closer: l.__closer, produto: prod, vendas: 0, receita: 0, recorrente: 0, avista: 0,
        };
        cp.vendas += 1;
        cp.receita += o.valor_total;
        if (rec) cp.recorrente += 1; else cp.avista += 1;
        xClProduto.set(kp, cp);

        const kt = l.__closer;
        const ct = xClTipo.get(kt) ?? {
          closer: l.__closer, recorrente: 0, avista: 0, receita_recorrente: 0, receita_avista: 0,
        };
        if (rec) { ct.recorrente += 1; ct.receita_recorrente += o.valor_total; }
        else { ct.avista += 1; ct.receita_avista += o.valor_total; }
        xClTipo.set(kt, ct);
      }
    }
    const closer_x_produto = Array.from(xClProduto.values());
    const closer_x_tipo_venda = Array.from(xClTipo.values());

    // ---- Parity logs ----------------------------------------------------
    const sumLeads = por_closer_nested.reduce((a, c) => a + c.leads, 0);
    const sumReceita = por_closer_nested.reduce((a, c) => a + c.receita, 0);
    if (sumLeads !== total_leads) {
      console.warn(`[comercial-metrics v5] PARITY MISMATCH leads: closer=${sumLeads} total=${total_leads}`);
    }
    if (Math.abs(sumReceita - receita_total) > 0.01) {
      console.warn(`[comercial-metrics v5] PARITY MISMATCH receita: closer=${sumReceita} total=${receita_total}`);
    }
    if (Math.abs((receita_avista + receita_recorrente) - receita_total) > 0.01) {
      console.warn(`[comercial-metrics v5] PARITY MISMATCH avista+rec=${receita_avista + receita_recorrente} total=${receita_total}`);
    }
    if ((vendas_avista + vendas_recorrente) !== total_fechamentos) {
      console.warn(`[comercial-metrics v5] PARITY MISMATCH vendas tipo=${vendas_avista + vendas_recorrente} fechamentos=${total_fechamentos}`);
    }

    console.log(`[comercial-metrics v5] total=${total_leads} validos=${leads_validos} fechou=${total_fechamentos} receita=${receita_total} closers=${por_closer_nested.length}`);

    const dias = Math.max(1, Math.round((+new Date(dataFim!) - +new Date(dataInicio!)) / 86400000) + 1);

    return jsonResponse({
      periodo: {
        inicio: dataInicio, fim: dataFim,
        data_inicio: dataInicio, data_fim: dataFim,
        tipo: periodo, dias_totais: dias,
      },
      pipeline: { id: pipeline.id, nome: pipeline.nome },
      fonte: "supabase-direct",
      gerado_em: new Date().toISOString(),

      // legado raiz (compat)
      resumo: {
        total_leads,
        agendamentos: workingLeads.filter((l) => l.__agendado).length,
        atendimentos: workingLeads.filter((l) => isAtendidoLegacy(l.status_geral)).length,
        fechamentos: total_fechamentos,
      },
      financeiro: { receita_total, ticket_medio },
      por_closer: por_closer_legacy,
      por_origem: por_origem_legacy,

      // novo nested completo
      metricas: {
        resumo: { total_leads, mentorados, leads_validos },
        sessoes: {
          pendentes: { agendado: pendAg, confirmado: pendConf, remarcou: pendRem, total: pendTotal },
          compareceram,
          nao_compareceram: noShow,
          no_show: noShow,
          taxa_comparecimento,
        },
        vendas: {
          fechamentos_diretos: total_fechamentos,
          fechamentos_recuperacao: 0,
          total_fechamentos,
          taxa_conversao,
          perdidos_pos_sessao,
          perdidos_sem_sessao,
          em_recuperacao: 0,
        },
        financeiro: {
          receita_total, ticket_medio,
          receita_recorrente, receita_avista,
          ticket_medio_recorrente, ticket_medio_avista,
          vendas_recorrente, vendas_avista,
        },
        por_tipo_venda: {
          recorrente: { vendas: vendas_recorrente, receita: receita_recorrente },
          avista: { vendas: vendas_avista, receita: receita_avista },
        },
        por_closer: por_closer_nested,
        por_origem: por_origem_nested,
        por_etapa,
        por_status,
        por_produto,
        lista_vendas,
        cruzamentos: {
          closer_x_origem,
          closer_x_produto,
          closer_x_tipo_venda,
        },
      },
    });
  } catch (err: any) {
    console.error("[comercial-metrics v5] erro fatal", err);
    return jsonResponse({ error: "Erro interno ao calcular métricas", details: String(err?.message || err) }, 500);
  }
});
