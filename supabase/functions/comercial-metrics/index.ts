import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PipelineStage {
  id: string;
  nome: string;
  ordem: number;
  grupo: string | null;
}

interface LeadEntry {
  lead_id: string;
  etapa_nome: string;
  etapa_ordem: number;
  etapa_grupo: string | null;
  origem: string | null;
  closer: string | null;
}

interface OrderData {
  id: string;
  closer: string | null;
  valor_total: number;
  lead_origem: string | null;
  recorrente: boolean | null;
  produto_nome: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Calculate date range based on periodo
    const now = new Date();
    if (periodo === "mes_atual" && !dataInicio) {
      dataInicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      dataFim = now.toISOString().split("T")[0];
    } else if (periodo === "mes_anterior" && !dataInicio) {
      dataInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
      dataFim = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];
    } else if (periodo === "ultimos_30_dias" && !dataInicio) {
      dataInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dataFim = now.toISOString().split("T")[0];
    } else if (periodo === "ultimos_7_dias" && !dataInicio) {
      dataInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      dataFim = now.toISOString().split("T")[0];
    }

    console.log(`[comercial-metrics] Período: ${periodo}, Início: ${dataInicio}, Fim: ${dataFim}`);

    // 1. Get comercial pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select("id, nome, slug")
      .eq("slug", "comercial")
      .single();

    if (pipelineError || !pipeline) {
      console.error("[comercial-metrics] Pipeline não encontrado:", pipelineError);
      return new Response(
        JSON.stringify({ error: "Pipeline comercial não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[comercial-metrics] Pipeline encontrado: ${pipeline.nome} (${pipeline.id})`);

    // 2. Get all stages
    const { data: stages, error: stagesError } = await supabase
      .from("pipeline_stages")
      .select("id, nome, ordem, grupo")
      .eq("pipeline_id", pipeline.id)
      .eq("ativo", true)
      .order("ordem");

    if (stagesError) {
      console.error("[comercial-metrics] Erro ao buscar etapas:", stagesError);
      throw stagesError;
    }

    console.log(`[comercial-metrics] ${stages?.length || 0} etapas encontradas`);

    // Create stage lookup map
    const stageMap = new Map<string, PipelineStage>();
    stages?.forEach((s) => stageMap.set(s.id, s));

    // 3. Get lead pipeline entries with lead data
    const { data: entries, error: entriesError } = await supabase
      .from("lead_pipeline_entries")
      .select(`
        id,
        lead_id,
        etapa_atual_id,
        leads!inner(origem, closer)
      `)
      .eq("pipeline_id", pipeline.id)
      .eq("status_inscricao", "Ativo");

    if (entriesError) {
      console.error("[comercial-metrics] Erro ao buscar entries:", entriesError);
      throw entriesError;
    }

    console.log(`[comercial-metrics] ${entries?.length || 0} entries ativos`);

    // Process entries with stage info
    const leadEntries: LeadEntry[] = (entries || []).map((e: any) => {
      const stage = e.etapa_atual_id ? stageMap.get(e.etapa_atual_id) : null;
      return {
        lead_id: e.lead_id,
        etapa_nome: stage?.nome || "Sem etapa",
        etapa_ordem: stage?.ordem || 0,
        etapa_grupo: stage?.grupo || null,
        origem: e.leads?.origem || "Outro",
        closer: e.leads?.closer || null,
      };
    });

    // 4. Calculate metrics by stage
    const porEtapa: Record<string, { etapa: string; grupo: string | null; ordem: number; total: number }> = {};
    stages?.forEach((s) => {
      porEtapa[s.nome] = { etapa: s.nome, grupo: s.grupo, ordem: s.ordem, total: 0 };
    });

    leadEntries.forEach((e) => {
      if (porEtapa[e.etapa_nome]) {
        porEtapa[e.etapa_nome].total++;
      }
    });

    // 5. Calculate attendance metrics based on stage progression
    // Compareceu = ordem >= 6 AND nome != 'Perdido sem sessão' AND nome != 'Mentorado'
    // Não compareceu = 'No-Show' OR 'Perdido sem sessão'
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

    leadEntries.forEach((e) => {
      const nome = e.etapa_nome.toLowerCase();
      const ordem = e.etapa_ordem;

      if (nome === "mentorado") {
        mentorados++;
      } else if (nome === "agendado") {
        pendentes.agendado++;
        pendentes.total++;
      } else if (nome === "confirmado") {
        pendentes.confirmado++;
        pendentes.total++;
      } else if (nome === "remarcou") {
        pendentes.remarcou++;
        pendentes.total++;
      } else if (nome === "no-show" || nome === "no show") {
        noShow++;
        naoCompareceram++;
      } else if (nome.includes("perdido sem sessão") || nome.includes("perdido sem sessao")) {
        perdidosSemSessao++;
        naoCompareceram++;
      } else if (ordem >= 6) {
        compareceram++;
        
        if (nome === "fechou" && !nome.includes("recuperação") && !nome.includes("recuperacao")) {
          fechamentosDiretos++;
        } else if (nome.includes("fechou") && (nome.includes("recuperação") || nome.includes("recuperacao") || nome.includes("pós"))) {
          fechamentosRecuperacao++;
        } else if (nome.includes("perdido") && nome.includes("sessão") || nome.includes("perdido pós") || nome.includes("perdido pos")) {
          perdidosPossSessao++;
        } else if (nome.includes("recuperação") || nome.includes("recuperacao") || nome.includes("d+")) {
          emRecuperacao++;
        }
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

    // 6. Get financial data from orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        closer,
        valor_total,
        deal_id,
        lead_id,
        deals!inner(recorrente, produto_id),
        leads!inner(origem)
      `)
      .eq("status_pagamento", "pago")
      .gte("created_at", `${dataInicio}T00:00:00`)
      .lte("created_at", `${dataFim}T23:59:59`);

    if (ordersError) {
      console.error("[comercial-metrics] Erro ao buscar orders:", ordersError);
    }

    console.log(`[comercial-metrics] ${orders?.length || 0} orders encontrados`);

    // Get products for orders
    const orderIds = (orders || []).map((o: any) => o.id);
    const { data: orderItems } = orderIds.length > 0 ? await supabase
      .from("order_items")
      .select("pedido_id, produto_id, products(nome)")
      .in("pedido_id", orderIds) : { data: [] };

    // Map order items to products
    const orderProductMap = new Map<string, string>();
    (orderItems || []).forEach((item: any) => {
      if (item.products?.nome && !orderProductMap.has(item.pedido_id)) {
        orderProductMap.set(item.pedido_id, item.products.nome);
      }
    });

    // Process order data
    const processedOrders: OrderData[] = (orders || []).map((o: any) => ({
      id: o.id,
      closer: o.closer,
      valor_total: Number(o.valor_total) || 0,
      lead_origem: o.leads?.origem || "Outro",
      recorrente: o.deals?.recorrente || false,
      produto_nome: orderProductMap.get(o.id) || null,
    }));

    // Calculate financial metrics
    const receitaTotal = processedOrders.reduce((sum, o) => sum + o.valor_total, 0);
    const ticketMedio = processedOrders.length > 0 ? receitaTotal / processedOrders.length : 0;

    // Por tipo de venda
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

    // 7. Group by closer
    const closerStats = new Map<string, {
      leads: number;
      compareceu: number;
      fechou: number;
      receita: number;
      recorrente: number;
      avista: number;
      receita_recorrente: number;
      receita_avista: number;
    }>();

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
      
      const nome = e.etapa_nome.toLowerCase();
      if (e.etapa_ordem >= 6 && nome !== "mentorado" && !nome.includes("perdido sem sessão")) {
        stats.compareceu++;
      }
      if (nome.includes("fechou")) {
        stats.fechou++;
      }
    });

    // Add order data to closer stats
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

    // 8. Group by origem
    const origemStats = new Map<string, { leads: number; fechou: number; receita: number }>();
    
    leadEntries.forEach((e) => {
      const origem = e.origem || "Outro";
      if (!origemStats.has(origem)) {
        origemStats.set(origem, { leads: 0, fechou: 0, receita: 0 });
      }
      const stats = origemStats.get(origem)!;
      stats.leads++;
      if (e.etapa_nome.toLowerCase().includes("fechou")) {
        stats.fechou++;
      }
    });

    processedOrders.forEach((o) => {
      const origem = o.lead_origem || "Outro";
      if (!origemStats.has(origem)) {
        origemStats.set(origem, { leads: 0, fechou: 0, receita: 0 });
      }
      origemStats.get(origem)!.receita += o.valor_total;
    });

    const porOrigem = Array.from(origemStats.entries()).map(([origem, stats]) => ({
      origem,
      ...stats,
    })).sort((a, b) => b.leads - a.leads);

    // 9. Group by produto
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

    // 10. Cross-tabulations
    // Closer x Origem
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
      
      const nome = e.etapa_nome.toLowerCase();
      if (e.etapa_ordem >= 6 && nome !== "mentorado" && !nome.includes("perdido sem sessão")) {
        stats.compareceu++;
      }
      if (nome.includes("fechou")) {
        stats.fechou++;
      }
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

    // Closer x Produto
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

    // Closer x Tipo Venda
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
        inicio: dataInicio,
        fim: dataFim,
      },
      pipeline: {
        id: pipeline.id,
        nome: pipeline.nome,
      },
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
          ticket_medio: Number(ticketMedio.toFixed(2)),
        },
        por_tipo_venda: porTipoVenda,
        por_etapa: Object.values(porEtapa).sort((a, b) => a.ordem - b.ordem),
        por_closer: porCloser,
        por_origem: porOrigem,
        por_produto: porProduto,
        cruzamentos: {
          closer_x_origem: closerXOrigem,
          closer_x_produto: closerXProduto,
          closer_x_tipo_venda: closerXTipoVenda,
        },
      },
      gerado_em: new Date().toISOString(),
    };

    console.log(`[comercial-metrics] Resposta gerada com sucesso`);

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
