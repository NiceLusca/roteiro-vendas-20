import {
  Rocket,
  GitBranch,
  Users,
  Kanban,
  Paperclip,
  Keyboard,
  Shield,
} from 'lucide-react';

export interface HelpItem {
  id: string;
  title: string;
  description: string;
  content: string;
  type: 'tutorial' | 'guide' | 'reference' | 'video';
  keywords?: string[];
  relatedLinks?: Array<{ title: string; url: string }>;
}

export interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  estimatedTime: string;
  audience: string;
  items?: HelpItem[];
}

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Primeiros Passos',
    description: 'Comece sua jornada na plataforma com este guia completo',
    icon: Rocket,
    difficulty: 'Iniciante',
    estimatedTime: '15-30 minutos',
    audience: 'Novos usuários',
    items: [
      {
        id: 'welcome-tour',
        title: 'Tour Guiado da Plataforma',
        description: 'Conheça as principais funcionalidades e navegue pela interface',
        type: 'tutorial',
        content: `
          <h3>Bem-vindo ao Lúmen CRM!</h3>
          <p>Este tour guiado irá apresentar as principais áreas da plataforma:</p>
          
          <h4>📊 Dashboard Principal</h4>
          <p>Seu centro de controle com métricas importantes, gráficos de performance e resumo das atividades recentes.</p>
          
          <h4>🔄 Pipelines</h4>
          <p>Gerencie seus processos de vendas criando pipelines personalizados com etapas específicas para seu negócio.</p>
          
          <h4>👥 Leads</h4>
          <p>Cadastre, qualifique e acompanhe todos seus prospects em um local centralizado.</p>
          
          <h4>📅 Agenda</h4>
          <p>Organize compromissos, reuniões e follow-ups com integração ao seu calendário.</p>
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Dica:</strong> Use os atalhos de teclado para navegar mais rapidamente pela plataforma!
          </div>
        `,
        keywords: ['tour', 'início', 'navegação', 'interface', 'dashboard'],
        relatedLinks: [
          { title: 'Atalhos de teclado', url: '#keyboard-shortcuts' },
          { title: 'Configurações iniciais', url: '#initial-setup' }
        ]
      },
      {
        id: 'initial-setup',
        title: 'Configuração Inicial',
        description: 'Configure sua conta, empresa e preferências básicas',
        type: 'guide',
        content: `
          <h3>Configuração Inicial da Sua Conta</h3>
          
          <h4>1️⃣ Perfil da Empresa</h4>
          <p>Acesse <strong>Configurações > Empresa</strong> e complete:</p>
          <ul>
            <li>Nome e logo da empresa</li>
            <li>Informações de contato</li>
            <li>Fuso horário e moeda</li>
          </ul>
          
          <h4>2️⃣ Usuários e Permissões</h4>
          <p>Configure sua equipe em <strong>Configurações > Usuários</strong>:</p>
          <ul>
            <li>Adicione membros da equipe</li>
            <li>Defina níveis de acesso</li>
            <li>Configure notificações</li>
          </ul>
          
          <h4>3️⃣ Personalização</h4>
          <p>Ajuste a plataforma às suas necessidades:</p>
          <ul>
            <li>Campos personalizados</li>
            <li>Etiquetas e categorias</li>
            <li>Templates de email</li>
          </ul>
          
          <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>✅ Checklist de Configuração:</strong><br>
            ☐ Perfil da empresa completo<br>
            ☐ Pelo menos um pipeline criado<br>
            ☐ Equipe adicionada<br>
            ☐ Campos personalizados configurados
          </div>
        `,
        keywords: ['configuração', 'setup', 'empresa', 'usuários', 'personalização'],
      },
      {
        id: 'first-pipeline',
        title: 'Criando seu Primeiro Pipeline',
        description: 'Passo a passo para criar e configurar seu primeiro processo de vendas',
        type: 'tutorial',
        content: `
          <h3>Criando seu Primeiro Pipeline</h3>
          
          <h4>📋 Planejamento</h4>
          <p>Antes de criar, defina:</p>
          <ul>
            <li>Etapas do seu processo de vendas</li>
            <li>Critérios para avanço entre etapas</li>
            <li>SLAs e tempos esperados</li>
            <li>Responsáveis por cada etapa</li>
          </ul>
          
          <h4>⚙️ Criação Passo a Passo</h4>
          <p><strong>1.</strong> Acesse <em>Pipelines > Novo Pipeline</em></p>
          <p><strong>2.</strong> Defina nome e descrição</p>
          <p><strong>3.</strong> Configure as etapas:</p>
          <ul>
            <li>Prospecção</li>
            <li>Qualificação</li>
            <li>Proposta</li>
            <li>Negociação</li>
            <li>Fechamento</li>
          </ul>
          
          <p><strong>4.</strong> Configure critérios de avanço</p>
          <p><strong>5.</strong> Defina SLAs por etapa</p>
          <p><strong>6.</strong> Ative o pipeline</p>
          
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>⚠️ Importante:</strong> Um pipeline bem estruturado é fundamental para o sucesso da sua operação de vendas.
          </div>
        `,
        keywords: ['pipeline', 'vendas', 'etapas', 'processo', 'criação'],
        relatedLinks: [
          { title: 'Melhores práticas para pipelines', url: '#pipeline-best-practices' },
          { title: 'Configurando SLAs', url: '#sla-configuration' }
        ]
      }
    ]
  },
  {
    id: 'pipeline-management',
    title: 'Gestão de Pipelines',
    description: 'Domine a criação e gestão de processos de vendas eficientes',
    icon: GitBranch,
    difficulty: 'Intermediário',
    estimatedTime: '45-60 minutos',
    audience: 'Gestores e vendedores',
    items: [
      {
        id: 'advanced-pipeline-setup',
        title: 'Configuração Avançada de Pipelines',
        description: 'Técnicas avançadas para otimizar seus processos de vendas',
        type: 'guide',
        content: `
          <h3>Configuração Avançada de Pipelines</h3>
          
          <h4>🎯 Segmentação por Tipo de Cliente</h4>
          <p>Crie pipelines específicos para:</p>
          <ul>
            <li>Clientes enterprise vs. SMB</li>
            <li>Vendas inbound vs. outbound</li>
            <li>Diferentes produtos/serviços</li>
            <li>Canais de vendas distintos</li>
          </ul>
          
          <h4>⏱️ Configuração de SLAs Inteligentes</h4>
          <p>Defina tempos realistas baseados em:</p>
          <ul>
            <li>Histórico de conversões</li>
            <li>Complexidade do produto</li>
            <li>Valor do negócio</li>
            <li>Sazonalidade do mercado</li>
          </ul>
          
          <h4>🔄 Automações de Pipeline</h4>
          <p>Configure ações automáticas:</p>
          <ul>
            <li>Notificações de SLA próximo ao vencimento</li>
            <li>Atribuição automática de responsáveis</li>
            <li>Envio de templates por etapa</li>
            <li>Criação de tarefas de follow-up</li>
          </ul>
        `,
        keywords: ['pipeline', 'avançado', 'segmentação', 'SLA', 'automação'],
      },
      {
        id: 'pipeline-analytics',
        title: 'Analytics de Pipeline',
        description: 'Como interpretar métricas e otimizar performance',
        type: 'guide',
        content: `
          <h3>Analytics de Pipeline</h3>
          
          <h4>📊 Métricas Essenciais</h4>
          <p><strong>Taxa de Conversão por Etapa:</strong></p>
          <ul>
            <li>Identifique gargalos no processo</li>
            <li>Compare performance entre vendedores</li>
            <li>Monitore tendências temporais</li>
          </ul>
          
          <p><strong>Tempo Médio por Etapa:</strong></p>
          <ul>
            <li>Otimize processos lentos</li>
            <li>Identifique leads estagnados</li>
            <li>Ajuste SLAs baseados em dados reais</li>
          </ul>
          
          <p><strong>Velocity Score:</strong></p>
          <ul>
            <li>Número de oportunidades × Taxa de conversão × Ticket médio ÷ Ciclo de vendas</li>
            <li>Métrica única para comparar pipelines</li>
          </ul>
          
          <h4>📈 Relatórios Customizados</h4>
          <p>Crie dashboards específicos para:</p>
          <ul>
            <li>Reuniões de vendas</li>
            <li>Análises executivas</li>
            <li>Coaching individual</li>
            <li>Previsões de receita</li>
          </ul>
        `,
        keywords: ['analytics', 'métricas', 'performance', 'conversão', 'relatórios'],
      }
    ]
  },
  {
    id: 'lead-management',
    title: 'Gerenciamento de Leads',
    description: 'Capture, qualifique e converta leads eficientemente',
    icon: Users,
    difficulty: 'Iniciante',
    estimatedTime: '30-45 minutos',
    audience: 'Todos os usuários',
    items: [
      {
        id: 'lead-qualification',
        title: 'Qualificação de Leads',
        description: 'Técnicas para identificar e priorizar leads de qualidade',
        type: 'guide',
        content: `
          <h3>Qualificação Eficaz de Leads</h3>
          
          <h4>🎯 Framework BANT</h4>
          <p>Qualifique leads usando os critérios:</p>
          <ul>
            <li><strong>Budget:</strong> Orçamento disponível</li>
            <li><strong>Authority:</strong> Poder de decisão</li>
            <li><strong>Need:</strong> Necessidade real do produto</li>
            <li><strong>Timeline:</strong> Cronograma de compra</li>
          </ul>
          
          <h4>🔍 Lead Scoring</h4>
          <p>Configure pontuações baseadas em:</p>
          <ul>
            <li>Perfil demográfico (empresa, cargo, setor)</li>
            <li>Comportamento (página visitada, conteúdo baixado)</li>
            <li>Engajamento (emails abertos, reuniões aceitas)</li>
            <li>Fit com ICP (Ideal Customer Profile)</li>
          </ul>
          
          <h4>📞 Processo de Qualificação</h4>
          <p><strong>1. Pesquisa Prévia:</strong></p>
          <ul>
            <li>LinkedIn da empresa e contato</li>
            <li>Site da empresa</li>
            <li>Notícias recentes do setor</li>
          </ul>
          
          <p><strong>2. Primeira Conversa:</strong></p>
          <ul>
            <li>Entenda a dor atual</li>
            <li>Identifique o processo de decisão</li>
            <li>Confirme orçamento e timeline</li>
          </ul>
        `,
        keywords: ['qualificação', 'BANT', 'scoring', 'leads', 'conversão'],
      }
    ]
  },
  {
    id: 'kanban-board',
    title: 'Board Kanban',
    description: 'Domine a visualização e gestão visual dos seus processos',
    icon: Kanban,
    difficulty: 'Iniciante',
    estimatedTime: '20-30 minutos',
    audience: 'Todos os usuários',
    items: [
      {
        id: 'kanban-navigation',
        title: 'Navegação no Board Kanban',
        description: 'Como usar eficientemente a visualização Kanban',
        type: 'tutorial',
        content: `
          <h3>Dominando o Board Kanban</h3>
          
          <h4>🎮 Controles Básicos</h4>
          <p><strong>Arrastar e Soltar:</strong></p>
          <ul>
            <li>Clique e arraste cards entre colunas</li>
            <li>Cards mudam automaticamente de etapa</li>
            <li>Validações de critérios são aplicadas</li>
          </ul>
          
          <p><strong>Ações Rápidas:</strong></p>
          <ul>
            <li>Clique no card para abrir detalhes</li>
            <li>Menu de contexto para ações rápidas</li>
            <li>Hover para ver informações adicionais</li>
          </ul>
          
          <h4>🔍 Filtros e Visualização</h4>
          <p>Personalize sua visualização:</p>
          <ul>
            <li>Filtre por responsável</li>
            <li>Agrupe por prioridade</li>
            <li>Ordene por data ou valor</li>
            <li>Pesquise por termos específicos</li>
          </ul>
          
          <h4>⚡ Ações em Massa</h4>
          <p>Selecione múltiplos cards para:</p>
          <ul>
            <li>Alterar responsável</li>
            <li>Aplicar tags</li>
            <li>Mover para outra etapa</li>
            <li>Agendar follow-ups</li>
          </ul>
          
          <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Dica Pro:</strong> Use os atalhos de teclado para navegar ainda mais rapidamente pelo Kanban!
          </div>
        `,
        keywords: ['kanban', 'board', 'arrastar', 'navegação', 'filtros'],
      },
      {
        id: 'kanban-stage-groups',
        title: 'Grupos de Etapas',
        description: 'Organize etapas do Kanban em grupos colapsáveis',
        type: 'guide',
        content: `
          <h3>Usando Grupos de Etapas</h3>
          
          <p>Grupos de etapas permitem organizar seu Kanban de forma mais eficiente, agrupando etapas relacionadas para uma visualização mais limpa.</p>
          
          <h4>📦 O que são Grupos?</h4>
          <p>Grupos reúnem etapas que fazem parte de uma mesma fase do processo:</p>
          <ul>
            <li><strong>Captação:</strong> etapas iniciais de entrada de leads</li>
            <li><strong>Qualificação:</strong> etapas de análise e triagem</li>
            <li><strong>Negociação:</strong> etapas de proposta e fechamento</li>
            <li><strong>Pós-venda:</strong> etapas de onboarding e suporte</li>
          </ul>
          
          <h4>🎨 Identificação Visual</h4>
          <p>Etapas de um mesmo grupo compartilham:</p>
          <ul>
            <li>Barra colorida no topo da coluna</li>
            <li>Ícone de toggle para colapsar/expandir</li>
            <li>Cor consistente entre todas as etapas do grupo</li>
          </ul>
          
          <h4>📌 Como Colapsar/Expandir</h4>
          <p><strong>Para colapsar um grupo:</strong></p>
          <ol>
            <li>Localize a barra colorida no topo de qualquer coluna do grupo</li>
            <li>Clique no ícone <code>⇄</code> ao lado da barra</li>
            <li>Todas as etapas do grupo serão substituídas por um card resumo</li>
          </ol>
          
          <p><strong>Para expandir um grupo:</strong></p>
          <ol>
            <li>Clique no card de grupo colapsado</li>
            <li>As etapas voltarão às suas posições originais</li>
          </ol>
          
          <h4>📊 Card de Grupo Colapsado</h4>
          <p>Quando colapsado, o card exibe:</p>
          <ul>
            <li>Nome do grupo</li>
            <li>Número total de leads no grupo</li>
            <li>Quantidade de etapas agrupadas</li>
            <li>Lista de nomes das etapas</li>
          </ul>
          
          <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Dica:</strong> O estado de colapso é salvo automaticamente por pipeline. Ao retornar, você verá a mesma configuração de antes.
          </div>
          
          <h4>⚙️ Configurando Grupos</h4>
          <p>Para configurar quais etapas pertencem a qual grupo:</p>
          <ol>
            <li>Acesse <strong>Configurações → Pipelines</strong></li>
            <li>Clique em "🎨 Configurar Grupos" no pipeline desejado</li>
            <li>Atribua cada etapa a um grupo e cor</li>
            <li>Use os filtros para gerenciar etapas sem grupo</li>
          </ol>
        `,
        keywords: ['grupos', 'etapas', 'colapsar', 'expandir', 'organização', 'kanban'],
        relatedLinks: [
          { title: 'Navegação no Kanban', url: '#kanban-navigation' },
          { title: 'Personalização do Kanban', url: '#kanban-customization' }
        ]
      },
      {
        id: 'kanban-customization',
        title: 'Personalização do Kanban',
        description: 'Configure o board para atender suas necessidades específicas',
        type: 'guide',
        content: `
          <h3>Personalizando seu Board Kanban</h3>
          
          <h4>🎨 Layout e Aparência</h4>
          <p>Customize a visualização:</p>
          <ul>
            <li>Cores por etapa ou grupo</li>
            <li>Tamanho dos cards</li>
            <li>Campos exibidos nos cards</li>
            <li>Grupos de etapas colapsáveis</li>
          </ul>
          
          <h4>📋 Campos nos Cards</h4>
          <p>Configure quais informações mostrar:</p>
          <ul>
            <li>Dados do lead/empresa</li>
            <li>Valor da oportunidade</li>
            <li>Data de criação/atualização</li>
            <li>Próxima ação planejada</li>
            <li>Tempo na etapa atual</li>
          </ul>
          
          <h4>🚨 Indicadores Visuais</h4>
          <p>Configure alertas visuais para:</p>
          <ul>
            <li>SLAs próximos ao vencimento</li>
            <li>Oportunidades de alto valor</li>
            <li>Leads sem interação recente</li>
            <li>Tarefas pendentes</li>
          </ul>
          
          <h4>⚙️ Configurações por Pipeline</h4>
          <p>Cada pipeline pode ter:</p>
          <ul>
            <li>Configuração de exibição personalizada</li>
            <li>Grupos de etapas específicos</li>
            <li>Cores e identidade visual próprias</li>
            <li>Campos visíveis diferentes</li>
          </ul>
        `,
        keywords: ['personalização', 'customização', 'layout', 'campos', 'grupos'],
      }
    ]
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Atalhos e Produtividade',
    description: 'Trabalhe mais rápido com atalhos e dicas de produtividade',
    icon: Keyboard,
    difficulty: 'Iniciante',
    estimatedTime: '15-20 minutos',
    audience: 'Todos os usuários',
    items: [
      {
        id: 'essential-shortcuts',
        title: 'Atalhos Essenciais',
        description: 'Os atalhos mais importantes para usar diariamente',
        type: 'reference',
        content: `
          <h3>Atalhos de Teclado Essenciais</h3>
          
          <h4>⌨️ Navegação Geral</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Atalho</td>
              <td style="padding: 8px; font-weight: bold;">Ação</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Ctrl + K</code></td>
              <td style="padding: 8px;">Abrir busca global</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Ctrl + /</code></td>
              <td style="padding: 8px;">Mostrar atalhos disponíveis</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Alt + 1-9</code></td>
              <td style="padding: 8px;">Navegar para páginas principais</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Esc</code></td>
              <td style="padding: 8px;">Fechar diálogos/modais</td>
            </tr>
          </table>
          
          <h4>📋 Kanban Board</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Atalho</td>
              <td style="padding: 8px; font-weight: bold;">Ação</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>N</code></td>
              <td style="padding: 8px;">Criar novo lead</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>F</code></td>
              <td style="padding: 8px;">Focar na busca/filtros</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>R</code></td>
              <td style="padding: 8px;">Atualizar dados</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Setas</code></td>
              <td style="padding: 8px;">Navegar entre cards</td>
            </tr>
          </table>
          
          <h4>📝 Formulários</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px; font-weight: bold;">Atalho</td>
              <td style="padding: 8px; font-weight: bold;">Ação</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Ctrl + Enter</code></td>
              <td style="padding: 8px;">Salvar formulário</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Ctrl + S</code></td>
              <td style="padding: 8px;">Salvar rascunho</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Tab</code></td>
              <td style="padding: 8px;">Próximo campo</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;"><code>Shift + Tab</code></td>
              <td style="padding: 8px;">Campo anterior</td>
            </tr>
          </table>
          
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Dica:</strong> Pressione <code>Ctrl + /</code> em qualquer página para ver os atalhos específicos disponíveis!
          </div>
        `,
        keywords: ['atalhos', 'teclado', 'produtividade', 'navegação', 'shortcuts'],
      }
    ]
  },
  {
    id: 'security-access',
    title: 'Segurança e Acessos',
    description: 'Configure permissões e controle quem pode acessar cada pipeline',
    icon: Shield,
    difficulty: 'Intermediário',
    estimatedTime: '20-30 minutos',
    audience: 'Administradores',
    items: [
      {
        id: 'access-overview',
        title: 'Visão Geral de Permissões',
        description: 'Entenda como funciona o sistema de permissões e acessos',
        type: 'guide',
        content: `
          <h3>Sistema de Permissões do Lúmen CRM</h3>
          
          <h4>🔑 Conceitos Fundamentais</h4>
          <p>O sistema de acesso opera em <strong>duas camadas</strong>:</p>
          
          <p><strong>1. Roles (Papéis Globais):</strong></p>
          <ul>
            <li><strong>Admin:</strong> Acesso total ao sistema, incluindo configurações e segurança</li>
            <li><strong>Moderador:</strong> Acesso a configurações, mas não a segurança</li>
            <li><strong>Usuário:</strong> Acesso operacional baseado em permissões de pipeline</li>
          </ul>
          
          <p><strong>2. Acesso por Pipeline:</strong></p>
          <ul>
            <li>Cada usuário pode ter níveis diferentes de acesso para cada pipeline</li>
            <li>Administradores têm acesso automático a todos os pipelines</li>
            <li>Usuários sem acesso a nenhum pipeline verão "Acesso Negado"</li>
          </ul>
          
          <div style="background: #e3f2fd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Importante:</strong> Novos usuários com role "Usuário" começam sem acesso a pipelines. Um administrador deve atribuir manualmente.
          </div>
        `,
        keywords: ['permissões', 'roles', 'acesso', 'segurança', 'admin', 'usuário'],
      },
      {
        id: 'pipeline-access-control',
        title: 'Atribuindo Acesso a Pipelines',
        description: 'Como configurar quem pode ver e editar cada pipeline',
        type: 'tutorial',
        content: `
          <h3>Controle de Acesso por Pipeline</h3>
          
          <h4>📍 Onde Configurar</h4>
          <p>Acesse: <strong>Segurança → Aba "Acessos"</strong></p>
          <p><em>Apenas administradores têm acesso a esta área.</em></p>
          
          <h4>🎯 Passo a Passo</h4>
          <ol>
            <li>Acesse o menu <strong>Segurança</strong> na barra lateral</li>
            <li>Clique na aba <strong>Acessos</strong></li>
            <li>Localize o usuário na primeira coluna da matriz</li>
            <li>Encontre o pipeline desejado nas colunas</li>
            <li>Clique no dropdown e selecione o nível de acesso</li>
            <li>A alteração é salva automaticamente</li>
          </ol>
          
          <h4>🔐 Níveis de Acesso</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">
              <td style="padding: 12px; font-weight: bold;">Nível</td>
              <td style="padding: 12px; font-weight: bold;">Permissões</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 12px;">🚫 Sem acesso</td>
              <td style="padding: 12px;">Não pode ver o pipeline</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 12px;">👁️ Visualizar</td>
              <td style="padding: 12px;">Pode ver pipeline e leads, mas não editar</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 12px;">✏️ Editar</td>
              <td style="padding: 12px;">Pode editar leads e mover entre etapas</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 12px;">⚙️ Gerenciar</td>
              <td style="padding: 12px;">Pode configurar etapas, SLAs e critérios</td>
            </tr>
          </table>
          
          <h4>⚠️ Pontos Importantes</h4>
          <ul>
            <li><strong>Administradores:</strong> Aparecem em seção separada pois têm acesso total automático</li>
            <li><strong>Novos usuários:</strong> Começam sem acesso - configure manualmente</li>
            <li><strong>Acesso Negado:</strong> Usuários sem pipelines verão mensagem explicativa</li>
            <li><strong>Alterações imediatas:</strong> As mudanças entram em vigor instantaneamente</li>
          </ul>
          
          <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>⚠️ Atenção:</strong> Remover acesso de um usuário não afeta os leads que ele já trabalhou - apenas impede novos acessos.
          </div>
        `,
        keywords: ['atribuir', 'acesso', 'pipeline', 'permissão', 'visualizar', 'editar', 'gerenciar'],
        relatedLinks: [
          { title: 'Entendendo Roles', url: '#roles-permissions' },
          { title: 'Melhores Práticas', url: '#security-best-practices' }
        ]
      },
      {
        id: 'roles-permissions',
        title: 'Entendendo Roles e Permissões',
        description: 'Diferenças entre Admin, Moderador e Usuário',
        type: 'reference',
        content: `
          <h3>Roles do Sistema</h3>
          
          <h4>👑 Administrador (Admin)</h4>
          <p>Acesso completo ao sistema:</p>
          <ul>
            <li>✅ Todas as configurações do sistema</li>
            <li>✅ Gerenciamento de usuários e roles</li>
            <li>✅ Área de Segurança (Acessos, Logs, Eventos)</li>
            <li>✅ Todos os pipelines automaticamente</li>
            <li>✅ Todos os leads e dados</li>
          </ul>
          
          <h4>🛡️ Moderador</h4>
          <p>Acesso administrativo parcial:</p>
          <ul>
            <li>✅ Configurações gerais (Pipelines, Produtos)</li>
            <li>❌ Área de Segurança</li>
            <li>⚠️ Pipelines conforme permissões atribuídas</li>
            <li>⚠️ Leads dos pipelines com acesso</li>
          </ul>
          
          <h4>👤 Usuário</h4>
          <p>Acesso operacional:</p>
          <ul>
            <li>❌ Configurações</li>
            <li>❌ Área de Segurança</li>
            <li>⚠️ Apenas pipelines com acesso atribuído</li>
            <li>⚠️ Apenas leads dos pipelines acessíveis</li>
          </ul>
          
          <h4>📊 Comparativo de Acessos</h4>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #e0e0e0; background: #f5f5f5;">
              <td style="padding: 8px; font-weight: bold;">Área</td>
              <td style="padding: 8px; font-weight: bold; text-align: center;">Admin</td>
              <td style="padding: 8px; font-weight: bold; text-align: center;">Moderador</td>
              <td style="padding: 8px; font-weight: bold; text-align: center;">Usuário</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Dashboard</td>
              <td style="padding: 8px; text-align: center;">✅</td>
              <td style="padding: 8px; text-align: center;">✅</td>
              <td style="padding: 8px; text-align: center;">✅</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Pipelines</td>
              <td style="padding: 8px; text-align: center;">Todos</td>
              <td style="padding: 8px; text-align: center;">Atribuídos</td>
              <td style="padding: 8px; text-align: center;">Atribuídos</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Leads</td>
              <td style="padding: 8px; text-align: center;">Todos</td>
              <td style="padding: 8px; text-align: center;">Dos pipelines</td>
              <td style="padding: 8px; text-align: center;">Dos pipelines</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Configurações</td>
              <td style="padding: 8px; text-align: center;">✅</td>
              <td style="padding: 8px; text-align: center;">✅</td>
              <td style="padding: 8px; text-align: center;">❌</td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
              <td style="padding: 8px;">Segurança</td>
              <td style="padding: 8px; text-align: center;">✅</td>
              <td style="padding: 8px; text-align: center;">❌</td>
              <td style="padding: 8px; text-align: center;">❌</td>
            </tr>
          </table>
        `,
        keywords: ['roles', 'admin', 'moderador', 'usuário', 'permissões', 'hierarquia'],
      },
      {
        id: 'security-best-practices',
        title: 'Melhores Práticas de Segurança',
        description: 'Recomendações para manter seu CRM seguro',
        type: 'guide',
        content: `
          <h3>Melhores Práticas de Segurança</h3>
          
          <h4>✅ Checklist de Configuração Inicial</h4>
          <ul>
            <li>☐ Revise todos os usuários com role Admin</li>
            <li>☐ Atribua acessos de pipeline a cada usuário</li>
            <li>☐ Configure o menor nível de acesso necessário</li>
            <li>☐ Documente quem tem acesso a quê</li>
          </ul>
          
          <h4>🔐 Princípio do Menor Privilégio</h4>
          <p>Conceda apenas o acesso mínimo necessário:</p>
          <ul>
            <li>Use "Visualizar" para quem só precisa consultar</li>
            <li>Use "Editar" para quem trabalha ativamente com leads</li>
            <li>Use "Gerenciar" apenas para gestores de pipeline</li>
            <li>Limite o número de Administradores</li>
          </ul>
          
          <h4>📋 Revisão Periódica</h4>
          <p>Agende revisões regulares:</p>
          <ul>
            <li>Revise acessos ao desligar funcionários</li>
            <li>Audite permissões trimestralmente</li>
            <li>Verifique logs de segurança mensalmente</li>
            <li>Atualize acessos ao mudar funções</li>
          </ul>
          
          <h4>⚠️ Erros Comuns a Evitar</h4>
          <ul>
            <li>❌ Dar acesso Admin a todos os gestores</li>
            <li>❌ Esquecer de remover acesso de ex-funcionários</li>
            <li>❌ Não configurar acesso para novos usuários</li>
            <li>❌ Usar "Gerenciar" quando "Editar" é suficiente</li>
          </ul>
          
          <div style="background: #e8f5e8; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <strong>💡 Dica:</strong> Mantenha uma planilha documentando quem tem acesso a cada pipeline e por quê. Isso facilita auditorias futuras.
          </div>
        `,
        keywords: ['segurança', 'boas práticas', 'auditoria', 'privilégio', 'revisão'],
      }
    ]
  }
];