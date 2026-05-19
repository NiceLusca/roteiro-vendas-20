Diagnóstico:
- No banco, a Cintia de S Villas Boas existe e está ativa em Mentoria Society, na etapa AGUARDANDO ACESSO DO LOVABLE.
- A mesma etapa tem 2 leads ativos: Cintia de S Villas Boas e Gleides Maria silva.
- Yan tem acesso edit ao pipeline Mentoria Society nas duas contas.
- Portanto, o problema não parece ser permissão/RLS nem URL/filtros. O sintoma da coluna mostrar apenas 1 lead aponta para falha silenciosa no carregamento client-side do Kanban.

Causa provável:
- O hook `useSupabaseLeadPipelineEntries` pode iniciar uma busca antes do `pipelineId` estar resolvido e depois bloquear/atrasar a busca correta por causa do guard `isFetching`.
- Também há risco de uma resposta antiga sobrescrever os dados corretos quando o usuário entra direto pela URL do pipeline.
- Isso explica um cenário em que a coluna carrega parcialmente e a contagem fica menor que o total real.

Plano de implementação:
1. Corrigir `useSupabaseLeadPipelineEntries`
   - Garantir que, quando um `pipelineId` específico existe, a busca desse pipeline sempre tenha prioridade.
   - Evitar que uma resposta antiga ou de outro escopo sobrescreva os dados atuais.
   - Usar controle por `requestId`/pipeline atual para descartar respostas obsoletas.
   - Manter busca sem paginação quando estiver em um pipeline específico, para não depender do limite padrão.

2. Ajustar o comportamento inicial em `/pipelines/:slug`
   - Evitar carregar inscrições globais enquanto o pipeline da URL ainda está sendo resolvido.
   - Só renderizar/considerar entradas depois que o `pipelineId` correto estiver definido.

3. Adicionar diagnóstico seguro no frontend
   - Logar quando a busca do pipeline retornar menos dados do que o esperado por etapa, sem expor dados sensíveis ao usuário comum.
   - Isso ajuda a detectar rapidamente se outra coluna voltar a carregar incompleta.

4. Validar especificamente o caso da Cintia
   - Confirmar que a etapa AGUARDANDO ACESSO DO LOVABLE renderiza 2 cards no pipeline Mentoria Society.
   - Confirmar que filtros vazios continuam mostrando todos os leads ativos.
   - Confirmar que busca, responsáveis e tags continuam funcionando.