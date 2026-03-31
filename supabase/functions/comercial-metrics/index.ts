import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadEntry {
  lead_id: string;
  origem: string | null;
  closer: string | null;
  status_geral: string | null;
}

interface OrderData {
  id: string;
  closer: string | null;
  valor_total: number;
  lead_origem: string | null;
  recorrente: boolean | null;
  produto_nome: string | null;
  data_venda: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const periodo = url.searchParams.get("periodo") || "mes_atual";
    let dataInicio = url.searchParams.get("data_inicio");
    let dataFim = url.searchParams.get("data_fim");
    const ultimosDias = url.searchParams.get("ultimos_dias");
    const ultimosMeses = url.searchParams.get("ultimos_meses");

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Validar formato de datas se fornecidas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dataInicio && !dateRegex.test(dataInicio)) {
      return new Response(
        JSON.stringify({ error: "data_inicio deve estar no formato YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (dataFim && !dateRegex.test(dataFim)) {
      return new Response(
        JSON.stringify({ error: "data_fim deve estar no formato YYYY-MM-DD" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prioridade: datas específicas > ultimos_dias/meses > periodo pré-definido
    if (dataInicio && dataFim) {
      console.log(`[comercial-metrics] Usando período customizado: ${dataInicio} a ${dataFim}`);
    } else if (ultimosDias) {
      const dias = parseInt(ultimosDias, 10);
      if (isNaN(dias) || dias <= 0) {
        return new Response(
          JSON.stringify({ error: "ultimos_dias deve ser um número positivo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      dataInicio = new Date(now.getTime() - dias * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dataFim = today;
    } else if (ultimosMeses) {
      const meses = parseInt(ultimosMeses, 10);
      if (isNaN(meses) || meses <= 0) {
        return new Response(
          JSON.stringify({ error: "ultimos_meses deve ser um número positivo" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const startDate = new Date(now.getFullYear(), now.getMonth() - meses, 1);
      dataInicio = startDate.toISOString().split("T")[0];
      dataFim = today;
    } else {
      switch (periodo) {
        case "mes_atual":
          dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          dataFim = today;
          break;
        case "mes_anterior":
          dataInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
          dataFim = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
          break;
        case "ultimos_30_dias":
          dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          dataFim = today;
          break;
        case "ultimos_7_dias":
          dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          dataFim = today;
          break;
        case "hoje":
          dataInicio = today;
          dataFim = today;
          break;
        case "ontem": {
          const ontem = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          dataInicio = ontem.toISOString().split("T")[0];
          dataFim = dataInicio;
          break;
        }
        case "semana_atual": {
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
          dataInicio = monday.toISOString().split("T")[0];
          dataFim = today;
          break;
        }
        case "trimestre_atual": {
          const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
          dataInicio = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split("T")[0];
          dataFim = today;
          break;
        }
        case "trimestre_anterior": {
          const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
          const prevQuarterMonth = currentQuarterMonth - 3;
          const prevQuarterYear = prevQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
          const adjustedMonth = prevQuarterMonth < 0 ? prevQuarterMonth + 12 : prevQuarterMonth;
          dataInicio = new Date(prevQuarterYear, adjustedMonth, 1).toISOString().split("T")[0];
          dataFim = new Date(prevQuarterYear, adjustedMonth + 3, 0).toISOString().split("T")[0];
          break;
        }
        case "ano_atual":
          dataInicio = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
          dataFim = today;
          break;
        case "ano_anterior":
          dataInicio = new Date(now.getFullYear() - 1, 0, 1).toISOString().split("T")[0];
          dataFim = new Date(now.getFullYear() - 1, 11, 31).toISOString().split("T")[0];
          break;
        default:
          dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          dataFim = today;
      }
    }

    if (dataInicio && dataFim && dataInicio > dataFim) {
      return new Response(
        JSON.stringify({ error: "data_inicio não pode ser maior que data_fim" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diasTotais = Math.ceil(
      (new Date(dataFim!).getTime() - new Date(dataInicio!).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    console.log(`[comercial-metrics] v4.0 - Fonte: leads_pipeline_comercial | Período: ${periodo}, Início: ${dataInicio}, Fim: ${dataFim}, Dias: ${diasTotais}`);

    // 1. Buscar pipeline comercial
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select("id")
      .eq("slug", "comercial")
      .single();

    if (pipelineError || !pipeline) {
      console.error("[comercial-metrics] Pipeline comercial não encontrado:", pipelineError);
      return new Response(
        JSON.stringify({ error: "Pipeline comercial não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[comercial-metrics] Pipeline comercial ID: ${pipeline.id}`);

    // 2. Buscar lead_ids que passaram pelo pipeline comercial (qualquer status)
    const allPipelineLeadIds: string[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("lead_pipeline_entries")
        .select("lead_id")
        .eq("pipeline_id", pipeline.id)
        .range(from, from + PAGE - 1);
      if (error) {
        console.error(`[comercial-metrics] Erro ao buscar entries (offset ${from}):`, error);
        break;
      }
      if (!data || data.length === 0) break;
      data.forEach((d: any) => allPipelineLeadIds.push(d.lead_id));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const uniqueLeadIds = [...new Set(allPipelineLeadIds)];
    console.log(`[comercial-metrics] ${uniqueLeadIds.length} leads únicos no pipeline comercial`);

    // 3. Buscar leads desses IDs, filtrados por periodo (em chunks)
    const allLeads: any[] = [];
    for (let i = 0; i < uniqueLeadIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error: leadsError } = await supabase
        .from("leads")
        .select("id, nome, origem, status_geral, closer, created_at")
        .in("id", chunk)
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`);
      if (leadsError) {
        console.error(`[comercial-metrics] Erro ao buscar leads (chunk ${i / CHUNK_SIZE + 1}):`, leadsError);
      }
      if (data) allLeads.push(...data);
    }
    const leads = allLeads;

    console.log(`[comercial-metrics] ${leads.length} leads do pipeline comercial no período`);

    // 2. Get lead responsibles with profiles (batched)
    const CHUNK_SIZE = 100;
    const leadIds = (leads || []).map((l: any) => l.id);
    const allResponsibles: any[] = [];
    for (let i = 0; i < leadIds.length; i += CHUNK_SIZE) {
      const chunk = leadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("lead_responsibles")
        .select(`
          lead_id,
          is_primary,
          profiles!lead_responsibles_user_id_fkey(nome, full_name)
        `)
        .in("lead_id", chunk)
        .eq("is_primary", true);
      if (error) {
        console.error(`[comercial-metrics] Erro ao buscar responsibles (chunk ${i / CHUNK_SIZE + 1}):`, error);
      }
      if (data) allResponsibles.push(...data);
    }

    // Create a map of lead_id -> closer name
    const closerMap = new Map<string, string>();
    allResponsibles.forEach((r: any) => {
      const name = r.profiles?.nome || r.profiles?.full_name || null;
      if (name) {
        closerMap.set(r.lead_id, name);
      }
    });

    console.log(`[comercial-metrics] ${closerMap.size} leads com closer atribuído`);

    // 3. Process lead entries
    const leadEntries: LeadEntry[] = (leads || []).map((l: any) => ({
      lead_id: l.id,
      origem: l.origem || "Outro",
      closer: closerMap.get(l.id) || null,
      status_geral: l.status_geral || null,
    }));

    // 4. Calculate attendance metrics based on status_geral
    let mentorados = 0;
    let compareceram = 0;
    let naoCompareceram = 0;
    let pendentes = { agendado: 0, confirmado: 0, remarcou: 0, total: 0 };
    let fechamentosDiretos = 0;
    let fechamentosRecuperacao = 0;
    let perdidosPossSessao = 0;
    let perdidosSemSessao = 0;
    let emRecuperacao = 0;
    let noShow = 0;

    const porStatus: Record<string, number> = {};

    leadEntries.forEach((e) => {
      const status = e.status_geral || 'lead';
      porStatus[status] = (porStatus[status] || 0) + 1;

      switch (status) {
        case 'cliente':
          mentorados++;
          break;
        case 'agendado':
          pendentes.agendado++;
          pendentes.total++;
          break;
        case 'confirmado':
          pendentes.confirmado++;
          pendentes.total++;
          break;
        case 'remarcou':
          pendentes.remarcou++;
          pendentes.total++;
          break;
        case 'nao_compareceu':
        case 'desmarcou':
        case 'closer_ausente':
          noShow++;
          naoCompareceram++;
          break;
        case 'atendido':
        case 'ligacao_realizada':
          compareceram++;
          break;
        case 'fechou':
          compareceram++;
          fechamentosDiretos++;
          break;
        case 'nao_fechou':
        case 'ja_possui':
          compareceram++;
          perdidosPossSessao++;
          break;
        case 'em_negociacao':
          compareceram++;
          emRecuperacao++;
          break;
        case 'perdido':
          perdidosSemSessao++;
          break;
      }
    });

    const totalFechamentos = fechamentosDiretos + fechamentosRecuperacao;
    const totalLeads = leadEntries.length;
    const leadsValidos = totalLeads - mentorados;
    const taxaComparecimento = compareceram + naoCompareceram > 0
      ? Number(((compareceram / (compareceram + naoCompareceram)) * 100).toFixed(2))
      : 0;
    const taxaConversao = compareceram > 0
      ? Number(((totalFechamentos / compareceram) * 100).toFixed(2))
      : 0;

    // 5. Get financial data from orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        closer,
        valor_total,
        deal_id,
        lead_id,
        data_venda,
        deals!inner(recorrente, produto_id, data_fechamento),
        leads!inner(origem)
      `)
      .eq("status_pagamento", "pago")
      .gte("created_at", `${dataInicio}T00:00:00`)
      .lte("created_at", `${dataFim}T23:59:59`);

    if (ordersError) {
      console.error("[comercial-metrics] Erro ao buscar orders:", ordersError);
    }

    console.log(`[comercial-metrics] ${orders?.length || 0} orders encontrados`);

    // Get lead responsibles for order lead_ids (batched)
    const orderLeadIds = [...new Set((orders || []).map((o: any) => o.lead_id).filter(Boolean))];
    const allOrderResponsibles: any[] = [];
    for (let i = 0; i < orderLeadIds.length; i += CHUNK_SIZE) {
      const chunk = orderLeadIds.slice(i, i + CHUNK_SIZE);
      const { data, error } = await supabase
        .from("lead_responsibles")
        .select(`
          lead_id,
          is_primary,
          profiles!lead_responsibles_user_id_fkey(nome, full_name)
        `)
        .in("lead_id", chunk)
        .eq("is_primary", true);
      if (error) {
        console.error(`[comercial-metrics] Erro ao buscar order responsibles (chunk ${i / CHUNK_SIZE + 1}):`, error);
      }
      if (data) allOrderResponsibles.push(...data);
    }

    const orderCloserMap = new Map<string, string>();
    allOrderResponsibles.forEach((r: any) => {
      const name = r.profiles?.nome || r.profiles?.full_name || null;
      if (name) {
        orderCloserMap.set(r.lead_id, name);
      }
    });

    // Get products for orders
    const orderIds = (orders || []).map((o: any) => o.id);
    const { data: orderItems } = orderIds.length > 0 ? await supabase
      .from("order_items")
      .select("pedido_id, produto_id, products(nome)")
      .in("pedido_id", orderIds) : { data: [] };

    const orderProductMap = new Map<string, string>();
    (orderItems || []).forEach((item: any) => {
      if (item.products?.nome && !orderProductMap.has(item.pedido_id)) {
        orderProductMap.set(item.pedido_id, item.products.nome);
      }
    });

    const processedOrders: OrderData[] = (orders || []).map((o: any) => ({
      id: o.id,
      closer: orderCloserMap.get(o.lead_id) || o.closer || null,
      valor_total: Number(o.valor_total) || 0,
      lead_origem: o.leads?.origem || "Outro",
      recorrente: o.deals?.recorrente || false,
      produto_nome: orderProductMap.get(o.id) || null,
      data_venda: o.data_venda || o.deals?.data_fechamento || null,
    }));

    // Calculate financial metrics
    const receitaTotal = processedOrders.reduce((sum, o) => sum + o.valor_total, 0);
    const ticketMedio = processedOrders.length > 0 ? receitaTotal / processedOrders.length : 0;

    const vendasRecorrente = processedOrders.filter((o) => o.recorrente);
    const vendasAvista = processedOrders.filter((o) => !o.recorrente);

    const porTipoVenda = {
      recorrente: {
        vendas: vendasRecorrente.length,
        receita: vendasRecorrente.reduce((sum, o) => sum + o.valor_total, 0),
      },
      avista: {
        vendas: vendasAvista.length,
        receita: vendasAvista.reduce((sum, o) => sum + o.valor_total, 0),
      },
    };

    // 6. Group by closer
    const closerStats = new Map<string, {
      leads: number; compareceu: number; fechou: number; receita: number;
      recorrente: number; avista: number; receita_recorrente: number; receita_avista: number;
    }>();

    const compareceuStatuses = ['atendido', 'ligacao_realizada', 'fechou', 'nao_fechou', 'ja_possui', 'em_negociacao'];

    leadEntries.forEach((e) => {
      if (!e.closer) return;
      if (!closerStats.has(e.closer)) {
        closerStats.set(e.closer, {
          leads: 0, compareceu: 0, fechou: 0, receita: 0,
          recorrente: 0, avista: 0, receita_recorrente: 0, receita_avista: 0
        });
      }
      const stats = closerStats.get(e.closer)!;
      stats.leads++;
      const status = e.status_geral || 'lead';
      if (compareceuStatuses.includes(status)) stats.compareceu++;
      if (status === 'fechou') stats.fechou++;
    });

    processedOrders.forEach((o) => {
      if (!o.closer) return;
      if (!closerStats.has(o.closer)) {
        closerStats.set(o.closer, {
          leads: 0, compareceu: 0, fechou: 0, receita: 0,
          recorrente: 0, avista: 0, receita_recorrente: 0, receita_avista: 0
        });
      }
      const stats = closerStats.get(o.closer)!;
      stats.receita += o.valor_total;
      if (o.recorrente) {
        stats.recorrente++;
        stats.receita_recorrente += o.valor_total;
      } else {
        stats.avista++;
        stats.receita_avista += o.valor_total;
      }
    });

    const porCloser = Array.from(closerStats.entries()).map(([closer, stats]) => ({
      closer,
      ...stats,
      taxa_conversao: stats.compareceu > 0
        ? Number(((stats.fechou / stats.compareceu) * 100).toFixed(2))
        : 0,
    })).sort((a, b) => b.receita - a.receita);

    // 7. Group by origem (com normalização)
    const normalizeOrigem = (s: string) => s?.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[´`'']/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() || 'OUTRO';

    const origemStats = new Map<string, { leads: number; compareceu: number; fechou: number; receita: number; displayName: string }>();

    leadEntries.forEach((e) => {
      const rawOrigem = e.origem || "Outro";
      const key = normalizeOrigem(rawOrigem);
      if (!origemStats.has(key)) {
        origemStats.set(key, { leads: 0, compareceu: 0, fechou: 0, receita: 0, displayName: rawOrigem });
      }
      const stats = origemStats.get(key)!;
      stats.leads++;
      const status = e.status_geral || 'lead';
      if (compareceuStatuses.includes(status)) stats.compareceu++;
      if (status === 'fechou') stats.fechou++;
    });

    processedOrders.forEach((o) => {
      const rawOrigem = o.lead_origem || "Outro";
      const key = normalizeOrigem(rawOrigem);
      if (!origemStats.has(key)) {
        origemStats.set(key, { leads: 0, compareceu: 0, fechou: 0, receita: 0, displayName: rawOrigem });
      }
      origemStats.get(key)!.receita += o.valor_total;
    });

    const porOrigem = Array.from(origemStats.entries()).map(([_, stats]) => ({
      origem: stats.displayName,
      leads: stats.leads,
      compareceu: stats.compareceu,
      fechou: stats.fechou,
      receita: stats.receita,
    })).sort((a, b) => b.leads - a.leads);

    // 8. Group by produto
    const produtoStats = new Map<string, { vendas: number; receita: number }>();

    processedOrders.forEach((o) => {
      const produto = o.produto_nome || "Sem produto";
      if (!produtoStats.has(produto)) {
        produtoStats.set(produto, { vendas: 0, receita: 0 });
      }
      const stats = produtoStats.get(produto)!;
      stats.vendas++;
      stats.receita += o.valor_total;
    });

    const porProduto = Array.from(produtoStats.entries()).map(([produto, stats]) => ({
      produto,
      ...stats,
    })).sort((a, b) => b.receita - a.receita);

    // 9. Cross-tabulations
    const closerOrigemStats = new Map<string, Map<string, { leads: number; compareceu: number; fechou: number; receita: number }>>();

    leadEntries.forEach((e) => {
      if (!e.closer) return;
      const origem = e.origem || "Outro";
      if (!closerOrigemStats.has(e.closer)) {
        closerOrigemStats.set(e.closer, new Map());
      }
      const origemMap = closerOrigemStats.get(e.closer)!;
      if (!origemMap.has(origem)) {
        origemMap.set(origem, { leads: 0, compareceu: 0, fechou: 0, receita: 0 });
      }
      const stats = origemMap.get(origem)!;
      stats.leads++;
      const status = e.status_geral || 'lead';
      if (compareceuStatuses.includes(status)) stats.compareceu++;
      if (status === 'fechou') stats.fechou++;
    });

    processedOrders.forEach((o) => {
      if (!o.closer) return;
      const origem = o.lead_origem || "Outro";
      if (!closerOrigemStats.has(o.closer)) {
        closerOrigemStats.set(o.closer, new Map());
      }
      const origemMap = closerOrigemStats.get(o.closer)!;
      if (!origemMap.has(origem)) {
        origemMap.set(origem, { leads: 0, compareceu: 0, fechou: 0, receita: 0 });
      }
      origemMap.get(origem)!.receita += o.valor_total;
    });

    const closerXOrigem = Array.from(closerOrigemStats.entries()).flatMap(([closer, origemMap]) =>
      Array.from(origemMap.entries()).map(([origem, stats]) => ({
        closer,
        origem,
        ...stats,
        taxa_conversao: stats.compareceu > 0
          ? Number(((stats.fechou / stats.compareceu) * 100).toFixed(2))
          : 0,
      }))
    );

    const closerProdutoStats = new Map<string, Map<string, { vendas: number; receita: number; recorrente: number; avista: number }>>();

    processedOrders.forEach((o) => {
      if (!o.closer) return;
      const produto = o.produto_nome || "Sem produto";
      if (!closerProdutoStats.has(o.closer)) {
        closerProdutoStats.set(o.closer, new Map());
      }
      const produtoMap = closerProdutoStats.get(o.closer)!;
      if (!produtoMap.has(produto)) {
        produtoMap.set(produto, { vendas: 0, receita: 0, recorrente: 0, avista: 0 });
      }
      const stats = produtoMap.get(produto)!;
      stats.vendas++;
      stats.receita += o.valor_total;
      if (o.recorrente) {
        stats.recorrente++;
      } else {
        stats.avista++;
      }
    });

    const closerXProduto = Array.from(closerProdutoStats.entries()).flatMap(([closer, produtoMap]) =>
      Array.from(produtoMap.entries()).map(([produto, stats]) => ({
        closer,
        produto,
        ...stats,
      }))
    );

    const closerXTipoVenda = Array.from(closerStats.entries()).map(([closer, stats]) => ({
      closer,
      recorrente: stats.recorrente,
      avista: stats.avista,
      receita_recorrente: stats.receita_recorrente,
      receita_avista: stats.receita_avista,
    })).filter((c) => c.recorrente > 0 || c.avista > 0);

    // Build response
    const response = {
      periodo: {
        tipo: periodo,
        inicio: dataInicio,
        fim: dataFim,
        dias_totais: diasTotais,
      },
      fonte: "leads",
      metricas: {
        resumo: {
          total_leads: totalLeads,
          mentorados,
          leads_validos: leadsValidos,
        },
        sessoes: {
          pendentes,
          compareceram,
          nao_compareceram: naoCompareceram,
          no_show: noShow,
          taxa_comparecimento: taxaComparecimento,
        },
        vendas: {
          fechamentos_diretos: fechamentosDiretos,
          fechamentos_recuperacao: fechamentosRecuperacao,
          total_fechamentos: totalFechamentos,
          taxa_conversao: taxaConversao,
          em_recuperacao: emRecuperacao,
          perdidos_pos_sessao: perdidosPossSessao,
          perdidos_sem_sessao: perdidosSemSessao,
        },
        financeiro: {
          receita_total: receitaTotal,
          receita_recorrente: porTipoVenda.recorrente.receita,
          receita_avista: porTipoVenda.avista.receita,
          ticket_medio: Number(ticketMedio.toFixed(2)),
          ticket_medio_recorrente: porTipoVenda.recorrente.vendas > 0
            ? Number((porTipoVenda.recorrente.receita / porTipoVenda.recorrente.vendas).toFixed(2))
            : 0,
          ticket_medio_avista: porTipoVenda.avista.vendas > 0
            ? Number((porTipoVenda.avista.receita / porTipoVenda.avista.vendas).toFixed(2))
            : 0,
          vendas_recorrente: porTipoVenda.recorrente.vendas,
          vendas_avista: porTipoVenda.avista.vendas,
        },
        por_tipo_venda: porTipoVenda,
        por_status: Object.entries(porStatus).map(([status, total]) => ({ status, total })).sort((a, b) => b.total - a.total),
        por_closer: porCloser,
        por_origem: porOrigem,
        por_produto: porProduto,
        cruzamentos: {
          closer_x_origem: closerXOrigem,
          closer_x_produto: closerXProduto,
          closer_x_tipo_venda: closerXTipoVenda,
        },
        lista_vendas: processedOrders.map(o => ({
          id: o.id,
          closer: o.closer,
          valor: o.valor_total,
          origem: o.lead_origem,
          recorrente: o.recorrente,
          produto: o.produto_nome,
          data_venda: o.data_venda,
        })),
      },
      gerado_em: new Date().toISOString(),
    };

    console.log(`[comercial-metrics] v3.0 Resposta gerada com sucesso`);

    return new Response(JSON.stringify(response, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[comercial-metrics] Erro:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar métricas", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
