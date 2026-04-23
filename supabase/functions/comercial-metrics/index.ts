// ============================================================================
// Edge Function: comercial-metrics  (v6 — base de leads + base de vendas separadas)
// ============================================================================
// - Leads do período (volume): usa leads.created_at
// - Vendas do período (faturamento): usa orders.data_venda
// - Fallback de produto/recorrência: order_items -> deal_products -> deals
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
const SEM_PRODUTO = "Sem produto";

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
    resumo: { total_leads: 0, agendamentos: 0, atendimentos: 0, fechamentos: 0 },
    financeiro: { receita_total: 0, ticket_medio: 0 },
    por_closer: [],
    por_origem: [],
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

    // ============================================================
    // 1. LEADS DO PIPELINE COMERCIAL (universo total, sem filtro de data)
    // ============================================================
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
    const pipelineLeadIdSet = new Set(allEntryLeadIds);
    const pipelineLeadIds = [...pipelineLeadIdSet];

    if (pipelineLeadIds.length === 0) {
      return jsonResponse(emptyResponse(dataInicio!, dataFim!, periodo, { id: pipeline.id, nome: pipeline.nome }));
    }

    // ============================================================
    // 2. BASE DE LEADS DO PERÍODO (leads.created_at)
    //    Usada para volume: total_leads, sessoes, por_etapa, por_status,
    //    por_closer[].leads, por_origem[].leads
    // ============================================================
    const allLeadsPeriod: any[] = [];
    for (let i = 0; i < pipelineLeadIds.length; i += CHUNK_SIZE) {
      const chunk = pipelineLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, origem, status_geral, closer, created_at")
        .in("id", chunk)
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);
      if (error) console.error(`[leads period chunk err]`, error);
      if (data) allLeadsPeriod.push(...data);
    }

    // ============================================================
    // 3. BASE DE VENDAS DO PERÍODO (orders.data_venda)
    //    Pegar TODOS os orders cuja data_venda cai no período,
    //    cujo lead pertence ao pipeline comercial e cujo lead.status_geral='fechou'
    // ============================================================
    type OrderRow = {
      id: string;
      lead_id: string;
      valor_total: number;
      data_venda: string | null;
      data_pedido: string | null;
      deal_id: string | null;
      items: { recorrencia: string | null; produto: string | null }[];
    };

    // 3a. Pegar orders com data_venda no período
    const ordersInPeriod: any[] = [];
    let oFrom = 0;
    while (true) {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, lead_id, valor_total, data_venda, data_pedido, deal_id,
          order_items ( recorrencia, products ( nome ) )
        `)
        .gte("data_venda", `${dataInicio}T00:00:00`)
        .lte("data_venda", `${dataFim}T23:59:59`)
        .range(oFrom, oFrom + PAGE - 1);
      if (error) { console.error("[orders period err]", error); break; }
      if (!data || data.length === 0) break;
      ordersInPeriod.push(...data);
      if (data.length < PAGE) break;
      oFrom += PAGE;
    }

    // 3b. Filtrar para somente orders cujo lead pertence ao pipeline comercial
    const ordersPipeline = ordersInPeriod.filter(
      (o: any) => o.lead_id && pipelineLeadIdSet.has(o.lead_id),
    );

    // 3c. Buscar status_geral + dados básicos desses leads (sem filtrar created_at)
    const saleLeadIds = [...new Set(ordersPipeline.map((o: any) => o.lead_id))];
    const saleLeadsMap = new Map<string, any>();
    for (let i = 0; i < saleLeadIds.length; i += CHUNK_SIZE) {
      const chunk = saleLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("leads")
        .select("id, nome, origem, status_geral, closer, created_at")
        .in("id", chunk);
      if (error) { console.error("[sale leads err]", error); continue; }
      (data || []).forEach((l: any) => saleLeadsMap.set(l.id, l));
    }

    // 3d. Restringir a leads com status_geral = 'fechou'
    const ordersFechou = ordersPipeline.filter((o: any) => {
      const lead = saleLeadsMap.get(o.lead_id);
      return lead && isFechou(lead.status_geral);
    });

    // 3e. Buscar fallback de produto/recorrência via deal_products + deals
    const dealIds = [...new Set(ordersFechou.map((o: any) => o.deal_id).filter(Boolean))];
    const dealProductsMap = new Map<string, { produto: string | null; valor: number }[]>();
    const dealMap = new Map<string, { produto_id: string | null; recorrente: boolean; produto_nome: string | null }>();

    if (dealIds.length > 0) {
      // deal_products com nome do produto
      for (let i = 0; i < dealIds.length; i += CHUNK_SIZE) {
        const chunk = dealIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
          .from("deal_products")
          .select("deal_id, valor_unitario, products ( nome )")
          .in("deal_id", chunk);
        if (error) { console.error("[deal_products err]", error); continue; }
        (data || []).forEach((dp: any) => {
          const arr = dealProductsMap.get(dp.deal_id) || [];
          arr.push({ produto: dp.products?.nome ?? null, valor: Number(dp.valor_unitario) || 0 });
          dealProductsMap.set(dp.deal_id, arr);
        });
      }

      // deals (recorrente + produto_id direto)
      for (let i = 0; i < dealIds.length; i += CHUNK_SIZE) {
        const chunk = dealIds.slice(i, i + CHUNK_SIZE);
        const { data, error } = await supabase
          .from("deals")
          .select("id, recorrente, produto_id, products!deals_produto_id_fkey ( nome )")
          .in("id", chunk);
        if (error) { console.error("[deals fallback err]", error); continue; }
        (data || []).forEach((d: any) => {
          dealMap.set(d.id, {
            produto_id: d.produto_id ?? null,
            recorrente: d.recorrente === true,
            produto_nome: d.products?.nome ?? null,
          });
        });
      }
    }

    // 3f. Normalizar orders fechados
    const salesRows: OrderRow[] = ordersFechou.map((o: any) => {
      const items = (o.order_items || []).map((it: any) => ({
        recorrencia: it.recorrencia ?? null,
        produto: it.products?.nome ?? null,
      }));
      return {
        id: o.id,
        lead_id: o.lead_id,
        valor_total: Number(o.valor_total) || 0,
        data_venda: o.data_venda,
        data_pedido: o.data_pedido,
        deal_id: o.deal_id ?? null,
        items,
      };
    });

    // Helpers de fallback produto/recorrência:
    // 1) order_items -> 2) deal_products -> 3) deals.produto_id -> "Sem produto"
    // recorrência: order_items.recorrencia -> deals.recorrente -> false
    const resolveOrderProduct = (o: OrderRow): string => {
      const fromItems = o.items.find((it) => it.produto)?.produto;
      if (fromItems) return fromItems;
      if (o.deal_id) {
        const dps = dealProductsMap.get(o.deal_id);
        const fromDealProducts = dps?.find((d) => d.produto)?.produto;
        if (fromDealProducts) return fromDealProducts;
        const fromDeal = dealMap.get(o.deal_id)?.produto_nome;
        if (fromDeal) return fromDeal;
      }
      return SEM_PRODUTO;
    };
    const resolveOrderRecurring = (o: OrderRow): boolean => {
      const fromItems = o.items.some(
        (it) => it.recorrencia && it.recorrencia.toLowerCase() !== "nenhuma",
      );
      if (fromItems) return true;
      if (o.deal_id) {
        const d = dealMap.get(o.deal_id);
        if (d?.recorrente) return true;
      }
      return false;
    };

    // ============================================================
    // 4. CLOSER HIERARCHY (para todos os leads relevantes:
    //    leads do período + leads das vendas)
    // ============================================================
    const closerLeadIds = [
      ...new Set([
        ...allLeadsPeriod.map((l: any) => l.id),
        ...saleLeadIds,
      ]),
    ];

    const dealCloserMap = new Map<string, string>();
    for (let i = 0; i < closerLeadIds.length; i += CHUNK_SIZE) {
      const chunk = closerLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("deals")
        .select("lead_id, created_at, profiles!deals_closer_id_fkey(nome, full_name)")
        .in("lead_id", chunk)
        .order("created_at", { ascending: false });
      if (error) { console.error("[deals closer err]", error); continue; }
      (data || []).forEach((d: any) => {
        const name = d.profiles?.nome || d.profiles?.full_name;
        if (name && !dealCloserMap.has(d.lead_id)) dealCloserMap.set(d.lead_id, name);
      });
    }

    const respCloserMap = new Map<string, string>();
    for (let i = 0; i < closerLeadIds.length; i += CHUNK_SIZE) {
      const chunk = closerLeadIds.slice(i, i + CHUNK_SIZE);
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

    const resolveCloserById = (leadId: string, fallbackCloser: string | null): string =>
      dealCloserMap.get(leadId)
        ?? respCloserMap.get(leadId)
        ?? (fallbackCloser && fallbackCloser.trim() ? fallbackCloser.trim() : NAO_ATRIBUIDO);

    // ============================================================
    // 5. APPOINTMENTS (para leads do período)
    // ============================================================
    const apptLeadSet = new Set<string>();
    const periodLeadIds = allLeadsPeriod.map((l: any) => l.id);
    for (let i = 0; i < periodLeadIds.length; i += CHUNK_SIZE) {
      const chunk = periodLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("appointments")
        .select("lead_id")
        .in("lead_id", chunk);
      if (error) { console.error("[appts err]", error); continue; }
      (data || []).forEach((a: any) => apptLeadSet.add(a.lead_id));
    }

    // ============================================================
    // 6. WORKING SET (base de leads do período)
    // ============================================================
    let workingLeads = allLeadsPeriod.map((l: any) => ({
      ...l,
      __closer: resolveCloserById(l.id, l.closer),
      __agendado: apptLeadSet.has(l.id),
      __mentorado: isMentorado(l.status_geral),
      __fechou: isFechou(l.status_geral),
    }));

    // Filtros
    if (closersFilter.length > 0) {
      const set = new Set(closersFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.__closer || "").toLowerCase()));
    }
    if (origensFilter.length > 0) {
      const set = new Set(origensFilter.map((c) => c.toLowerCase()));
      workingLeads = workingLeads.filter((l) => set.has((l.origem || "").toLowerCase()));
    }

    // ============================================================
    // 7. WORKING SALES (base de vendas do período)
    //    Cada venda tem um lead, closer e origem associados.
    // ============================================================
    type WorkingSale = OrderRow & {
      __closer: string;
      __origem: string;
      __recorrente: boolean;
      __produto: string;
    };

    let workingSales: WorkingSale[] = salesRows.map((o) => {
      const lead = saleLeadsMap.get(o.lead_id);
      return {
        ...o,
        __closer: resolveCloserById(o.lead_id, lead?.closer ?? null),
        __origem: lead?.origem || "Não informado",
        __recorrente: resolveOrderRecurring(o),
        __produto: resolveOrderProduct(o),
      };
    });

    if (closersFilter.length > 0) {
      const set = new Set(closersFilter.map((c) => c.toLowerCase()));
      workingSales = workingSales.filter((s) => set.has((s.__closer || "").toLowerCase()));
    }
    if (origensFilter.length > 0) {
      const set = new Set(origensFilter.map((c) => c.toLowerCase()));
      workingSales = workingSales.filter((s) => set.has((s.__origem || "").toLowerCase()));
    }

    // ============================================================
    // 8. RESUMO (base leads)
    // ============================================================
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

    // ============================================================
    // 9. VENDAS (base vendas)
    // ============================================================
    const total_fechamentos = workingSales.length;
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

    for (const s of workingSales) {
      receita_total += s.valor_total;
      if (s.__recorrente) {
        receita_recorrente += s.valor_total;
        vendas_recorrente += 1;
      } else {
        receita_avista += s.valor_total;
        vendas_avista += 1;
      }
      lista_vendas.push({
        id: s.id,
        closer: s.__closer,
        valor: s.valor_total,
        origem: s.__origem,
        recorrente: s.__recorrente,
        produto: s.__produto,
        data_venda: s.data_venda || s.data_pedido,
      });
    }

    const ticket_medio = total_fechamentos > 0 ? receita_total / total_fechamentos : 0;
    const ticket_medio_recorrente = vendas_recorrente > 0 ? receita_recorrente / vendas_recorrente : 0;
    const ticket_medio_avista = vendas_avista > 0 ? receita_avista / vendas_avista : 0;

    // Perdidos (base de leads do período)
    const perdidos_pos_sessao = workingLeads.filter((l) => isPerdido(l.status_geral) && l.__agendado).length;
    const perdidos_sem_sessao = workingLeads.filter((l) => isPerdido(l.status_geral) && !l.__agendado).length;
    const taxa_conversao = compareceram > 0
      ? +(total_fechamentos / compareceram * 100).toFixed(2)
      : 0;

    // ============================================================
    // 10. POR CLOSER (combina base leads + base vendas)
    // ============================================================
    type CloserAgg = {
      leads: number; compareceu: number;
      fechou: number; receita: number;
      recorrente: number; avista: number;
      receita_recorrente: number; receita_avista: number;
      // legado:
      agendamentos: number; atendimentos: number; fechamentos: number;
    };
    const closerAgg = new Map<string, CloserAgg>();
    const ensureCloser = (k: string): CloserAgg => {
      let cur = closerAgg.get(k);
      if (!cur) {
        cur = {
          leads: 0, compareceu: 0,
          fechou: 0, receita: 0,
          recorrente: 0, avista: 0,
          receita_recorrente: 0, receita_avista: 0,
          agendamentos: 0, atendimentos: 0, fechamentos: 0,
        };
        closerAgg.set(k, cur);
      }
      return cur;
    };

    // Volume (base leads)
    for (const l of workingLeads) {
      const cur = ensureCloser(l.__closer || NAO_ATRIBUIDO);
      cur.leads += 1;
      if (l.__agendado) cur.agendamentos += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
      if (isAtendidoLegacy(l.status_geral)) cur.atendimentos += 1;
    }
    // Receita & fechamentos (base vendas)
    for (const s of workingSales) {
      const cur = ensureCloser(s.__closer || NAO_ATRIBUIDO);
      cur.fechou += 1;
      cur.fechamentos += 1;
      cur.receita += s.valor_total;
      if (s.__recorrente) {
        cur.recorrente += 1;
        cur.receita_recorrente += s.valor_total;
      } else {
        cur.avista += 1;
        cur.receita_avista += s.valor_total;
      }
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

    // ============================================================
    // 11. POR ORIGEM (combina base leads + base vendas)
    // ============================================================
    type OrigemAgg = { leads: number; compareceu: number; fechou: number; receita: number };
    const origemAgg = new Map<string, OrigemAgg>();
    const ensureOrigem = (k: string): OrigemAgg => {
      let cur = origemAgg.get(k);
      if (!cur) {
        cur = { leads: 0, compareceu: 0, fechou: 0, receita: 0 };
        origemAgg.set(k, cur);
      }
      return cur;
    };

    for (const l of workingLeads) {
      const cur = ensureOrigem(l.origem || "Não informado");
      cur.leads += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
    }
    for (const s of workingSales) {
      const cur = ensureOrigem(s.__origem || "Não informado");
      cur.fechou += 1;
      cur.receita += s.valor_total;
    }

    const por_origem_nested = Array.from(origemAgg.entries())
      .map(([nome, v]) => ({ origem: nome, nome, ...v }))
      .sort((a, b) => b.leads - a.leads);

    const por_origem_legacy = Array.from(origemAgg.entries())
      .map(([nome, v]) => ({ nome, leads: v.leads, fechamentos: v.fechou, receita: v.receita }))
      .sort((a, b) => b.leads - a.leads);

    // ============================================================
    // 12. POR ETAPA / STATUS (base leads do período)
    // ============================================================
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

    // ============================================================
    // 13. POR PRODUTO (base vendas)
    // ============================================================
    const produtoAgg = new Map<string, { vendas: number; receita: number }>();
    for (const s of workingSales) {
      const cur = produtoAgg.get(s.__produto) ?? { vendas: 0, receita: 0 };
      cur.vendas += 1;
      cur.receita += s.valor_total;
      produtoAgg.set(s.__produto, cur);
    }
    const por_produto = Array.from(produtoAgg.entries())
      .map(([produto, v]) => ({ produto, ...v }))
      .sort((a, b) => b.receita - a.receita);

    // ============================================================
    // 14. CRUZAMENTOS
    // ============================================================
    // closer x origem (mistura leads do período + vendas do período)
    const xClOrigem = new Map<string, any>();
    const ensureClOrigem = (closer: string, origem: string) => {
      const k = `${closer}||${origem}`;
      let cur = xClOrigem.get(k);
      if (!cur) {
        cur = { closer, origem, leads: 0, compareceu: 0, fechou: 0, receita: 0 };
        xClOrigem.set(k, cur);
      }
      return cur;
    };
    for (const l of workingLeads) {
      const cur = ensureClOrigem(l.__closer, l.origem || "Não informado");
      cur.leads += 1;
      if (isCompareceu(l.status_geral)) cur.compareceu += 1;
    }
    for (const s of workingSales) {
      const cur = ensureClOrigem(s.__closer, s.__origem);
      cur.fechou += 1;
      cur.receita += s.valor_total;
    }
    const closer_x_origem = Array.from(xClOrigem.values()).map((v) => ({
      ...v,
      taxa_conversao: v.compareceu > 0 ? +(v.fechou / v.compareceu * 100).toFixed(2) : 0,
    }));

    // closer x produto e closer x tipo_venda (base vendas)
    const xClProduto = new Map<string, any>();
    const xClTipo = new Map<string, any>();
    for (const s of workingSales) {
      const kp = `${s.__closer}||${s.__produto}`;
      const cp = xClProduto.get(kp) ?? {
        closer: s.__closer, produto: s.__produto,
        vendas: 0, receita: 0, recorrente: 0, avista: 0,
      };
      cp.vendas += 1;
      cp.receita += s.valor_total;
      if (s.__recorrente) cp.recorrente += 1; else cp.avista += 1;
      xClProduto.set(kp, cp);

      const kt = s.__closer;
      const ct = xClTipo.get(kt) ?? {
        closer: s.__closer, recorrente: 0, avista: 0,
        receita_recorrente: 0, receita_avista: 0,
      };
      if (s.__recorrente) {
        ct.recorrente += 1; ct.receita_recorrente += s.valor_total;
      } else {
        ct.avista += 1; ct.receita_avista += s.valor_total;
      }
      xClTipo.set(kt, ct);
    }
    const closer_x_produto = Array.from(xClProduto.values());
    const closer_x_tipo_venda = Array.from(xClTipo.values());

    // ============================================================
    // 15. PARITY LOGS — comparar os dois critérios lado a lado
    // ============================================================
    // Critério antigo: leads.created_at no período + orders desses leads (status_geral=fechou)
    let oldFechou = 0;
    let oldReceita = 0;
    for (const l of workingLeads) {
      if (l.__fechou) {
        const ords = ordersInPeriod.filter((o: any) => o.lead_id === l.id);
        // (esse é apenas um log informativo — ords aqui são orders do período)
        for (const o of ords) {
          oldFechou += 1;
          oldReceita += Number(o.valor_total) || 0;
        }
      }
    }

    console.log(
      `[comercial-metrics v6] periodo=${dataInicio}..${dataFim}\n` +
      `  por_lead_created_at: fechou=${oldFechou} receita=${oldReceita.toFixed(2)}\n` +
      `  por_data_venda:      fechou=${total_fechamentos} receita=${receita_total.toFixed(2)}\n` +
      `  retornado:           por_data_venda`
    );

    // Paridade interna
    if (Math.abs((receita_avista + receita_recorrente) - receita_total) > 0.01) {
      console.warn(`[v6] PARITY MISMATCH avista+rec=${receita_avista + receita_recorrente} vs total=${receita_total}`);
    }
    if ((vendas_avista + vendas_recorrente) !== total_fechamentos) {
      console.warn(`[v6] PARITY MISMATCH vendas tipo=${vendas_avista + vendas_recorrente} vs fechamentos=${total_fechamentos}`);
    }
    if (lista_vendas.length !== total_fechamentos) {
      console.warn(`[v6] PARITY MISMATCH lista_vendas=${lista_vendas.length} vs fechamentos=${total_fechamentos}`);
    }
    const sumCloserReceita = por_closer_nested.reduce((a, c) => a + c.receita, 0);
    if (Math.abs(sumCloserReceita - receita_total) > 0.01) {
      console.warn(`[v6] PARITY MISMATCH closer.receita=${sumCloserReceita} vs total=${receita_total}`);
    }

    console.log(
      `[comercial-metrics v6] resumo total_leads=${total_leads} validos=${leads_validos} ` +
      `fechou=${total_fechamentos} receita=${receita_total.toFixed(2)} ` +
      `closers=${por_closer_nested.length} produtos=${por_produto.length}`
    );

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
    console.error("[comercial-metrics v6] erro fatal", err);
    return jsonResponse({ error: "Erro interno ao calcular métricas", details: String(err?.message || err) }, 500);
  }
});
