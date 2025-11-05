/**
 * Centralized message dictionary for consistent user feedback
 * Organized by feature/module for easy maintenance
 */

export const messages = {
  // Authentication
  auth: {
    loginSuccess: 'Login realizado com sucesso',
    loginError: 'Erro ao fazer login',
    logoutSuccess: 'Logout realizado com sucesso',
    sessionExpired: 'Sua sessão expirou. Por favor, faça login novamente.',
    unauthorized: 'Você não tem permissão para acessar este recurso',
    invalidCredentials: 'Email ou senha inválidos',
  },

  // Leads
  leads: {
    createSuccess: 'Lead criado com sucesso',
    createError: 'Erro ao criar lead',
    updateSuccess: 'Lead atualizado com sucesso',
    updateError: 'Erro ao atualizar lead',
    deleteSuccess: 'Lead excluído com sucesso',
    deleteError: 'Erro ao excluir lead',
    loadError: 'Erro ao carregar leads',
    mergeSuccess: 'Lead atualizado com novos dados',
    mergeDescription: (name: string) => `Lead ${name} já existia e foi atualizado com as novas informações`,
    duplicateFound: 'Lead duplicado encontrado',
    invalidData: 'Dados do lead inválidos',
    required: {
      name: 'Nome é obrigatório',
      whatsapp: 'WhatsApp é obrigatório',
      email: 'Email deve ter formato válido',
      whatsappFormat: 'WhatsApp deve ter formato válido (+55DDDNÚMERO)',
      whatsappPrefix: 'WhatsApp deve começar com +55',
      dddInvalid: 'DDD inválido',
    },
  },

  // Pipeline
  pipeline: {
    createSuccess: (name: string) => `Pipeline "${name}" criado com sucesso`,
    createError: 'Erro ao criar pipeline',
    updateSuccess: (name: string) => `Pipeline "${name}" atualizado com sucesso`,
    updateError: 'Erro ao atualizar pipeline',
    deleteSuccess: 'Pipeline excluído com sucesso',
    deleteError: 'Erro ao excluir pipeline',
    deleteWithLeads: 'Este pipeline possui leads ativos. Transfira ou arquive os leads antes de excluir o pipeline.',
    loadError: 'Erro ao carregar pipelines',
    duplicateSuccess: 'Pipeline duplicado com sucesso',
    duplicateError: 'Erro ao duplicar pipeline',
    required: {
      name: 'Nome do pipeline é obrigatório',
      userId: 'ID do usuário inválido. Faça login novamente.',
    },
  },

  // Stages
  stages: {
    createSuccess: (name: string) => `Etapa "${name}" criada com sucesso`,
    createError: (name: string) => `Erro ao criar etapa "${name}"`,
    updateSuccess: (name: string) => `Etapa "${name}" atualizada com sucesso`,
    updateError: 'Erro ao atualizar etapa',
    deleteSuccess: 'Etapa excluída com sucesso',
    deleteError: 'Erro ao excluir etapa',
    loadError: 'Erro ao carregar etapas',
    reorderSuccess: 'Ordem atualizada com sucesso',
    reorderError: 'Erro ao reordenar etapas',
    required: {
      name: (index: number) => `Nome da etapa ${index + 1} é obrigatório`,
      deadline: (name: string) => `Prazo da etapa "${name}" deve ser pelo menos 1 dia`,
    },
  },

  // Checklist
  checklist: {
    createSuccess: (title: string) => `Item "${title}" criado com sucesso`,
    createError: 'Erro ao criar item',
    updateSuccess: (title: string) => `Item "${title}" atualizado com sucesso`,
    updateError: 'Erro ao atualizar item',
    deleteSuccess: 'Item excluído com sucesso',
    deleteError: 'Erro ao excluir item',
    loadError: 'Erro ao carregar checklist',
    reorderSuccess: 'Ordem dos itens atualizada com sucesso',
    reorderError: 'Erro ao reordenar itens',
  },

  // Deals
  deals: {
    createSuccess: 'Deal criado com sucesso',
    createError: 'Erro ao criar deal',
    updateSuccess: 'Deal atualizado com sucesso',
    updateError: 'Erro ao atualizar deal',
    deleteSuccess: 'Deal excluído com sucesso',
    deleteError: 'Erro ao excluir deal',
    loadError: 'Erro ao carregar deals',
    lossSuccess: 'Motivo da perda registrado',
    lossError: 'Erro ao registrar perda',
  },

  // Orders
  orders: {
    createSuccess: 'Pedido criado com sucesso',
    createError: 'Erro ao criar pedido',
    updateSuccess: 'Pedido atualizado com sucesso',
    updateError: 'Erro ao atualizar pedido',
    deleteSuccess: 'Pedido excluído com sucesso',
    deleteError: 'Erro ao excluir pedido',
    loadError: 'Erro ao carregar pedidos',
    itemsLoadError: 'Erro ao carregar itens dos pedidos',
    refundSuccess: 'Reembolso processado com sucesso',
    refundError: 'Erro ao processar reembolso',
  },

  // Products
  products: {
    createSuccess: (name: string) => `Produto "${name}" criado com sucesso`,
    createError: 'Erro ao criar produto',
    updateSuccess: (name: string) => `Produto "${name}" atualizado com sucesso`,
    updateError: 'Erro ao atualizar produto',
    deleteSuccess: 'Produto excluído com sucesso',
    deleteError: 'Erro ao excluir produto',
    loadError: 'Erro ao carregar produtos',
  },

  // Appointments
  appointments: {
    createSuccess: 'Agendamento criado com sucesso',
    createError: 'Erro ao criar agendamento',
    updateSuccess: 'Agendamento atualizado com sucesso',
    updateError: 'Erro ao atualizar agendamento',
    cancelSuccess: 'Agendamento cancelado com sucesso',
    cancelError: 'Erro ao cancelar agendamento',
    loadError: 'Erro ao carregar agendamentos',
    reminder: (time: string) => `Lembrete: Você tem um agendamento em ${time}`,
  },

  // Interactions
  interactions: {
    createSuccess: 'Interação registrada com sucesso',
    createError: 'Erro ao registrar interação',
    loadError: 'Erro ao carregar interações',
  },

  // Tags
  tags: {
    createSuccess: 'Tag criada com sucesso',
    createError: 'Erro ao criar tag',
    updateSuccess: 'Tag atualizada com sucesso',
    updateError: 'Erro ao atualizar tag',
    deleteSuccess: 'Tag excluída com sucesso',
    deleteError: 'Erro ao excluir tag',
    loadError: 'Erro ao carregar tags',
    assignSuccess: 'Tags atualizadas com sucesso',
    assignError: 'Erro ao atualizar tags',
  },

  // Notes
  notes: {
    createSuccess: 'Nota criada com sucesso',
    createError: 'Erro ao criar nota',
    updateSuccess: 'Nota atualizada com sucesso',
    updateError: 'Erro ao atualizar nota',
    deleteSuccess: 'Nota excluída com sucesso',
    deleteError: 'Erro ao excluir nota',
    loadError: 'Erro ao carregar notas',
  },

  // Attachments
  attachments: {
    uploadSuccess: 'Arquivo enviado com sucesso',
    uploadError: 'Erro ao enviar arquivo',
    deleteSuccess: 'Arquivo excluído com sucesso',
    deleteError: 'Erro ao excluir arquivo',
    loadError: 'Erro ao carregar anexos',
    tooLarge: 'Arquivo muito grande. Tamanho máximo: 5MB',
    invalidType: 'Tipo de arquivo não permitido',
  },

  // Bulk Operations
  bulk: {
    importSuccess: (count: number) => `${count} leads importados com sucesso`,
    importError: 'Erro ao importar leads',
    importPartial: (success: number, total: number) => 
      `${success} de ${total} leads importados com sucesso`,
    deleteSuccess: (count: number) => `${count} leads excluídos com sucesso`,
    deleteError: 'Erro ao excluir leads',
    updateSuccess: (count: number) => `${count} leads atualizados com sucesso`,
    updateError: 'Erro ao atualizar leads',
    tagSuccess: (count: number) => `Tags atualizadas em ${count} leads`,
    tagError: 'Erro ao atualizar tags',
  },

  // Analytics
  analytics: {
    loadError: 'Erro ao carregar relatórios',
    refreshSuccess: 'Dados atualizados com sucesso',
    exportSuccess: 'Relatório exportado com sucesso',
    exportError: 'Erro ao exportar relatório',
  },

  // General
  general: {
    saveSuccess: 'Salvo com sucesso',
    saveError: 'Erro ao salvar',
    loadError: 'Erro ao carregar dados',
    deleteConfirm: 'Tem certeza que deseja excluir?',
    deleteWarning: 'Esta ação não pode ser desfeita',
    offline: 'Sem conexão',
    offlineDescription: 'Verifique sua conexão com a internet e tente novamente.',
    timeout: 'Carregando...',
    timeoutDescription: 'Isso está demorando mais que o esperado.',
    unexpectedError: 'Ocorreu um erro inesperado',
    tryAgain: 'Tentar novamente',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Fechar',
    save: 'Salvar',
    saving: 'Salvando...',
    loading: 'Carregando...',
    noData: 'Nenhum dado encontrado',
    noResults: 'Nenhum resultado encontrado',
    search: 'Buscar...',
    filter: 'Filtrar',
    clear: 'Limpar',
    apply: 'Aplicar',
    reset: 'Resetar',
  },

  // Validation
  validation: {
    required: (field: string) => `${field} é obrigatório`,
    invalid: (field: string) => `${field} inválido`,
    min: (field: string, min: number) => `${field} deve ter no mínimo ${min} caracteres`,
    max: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
    email: 'Email inválido',
    phone: 'Telefone inválido',
    number: 'Deve ser um número válido',
    positive: 'Deve ser um número positivo',
    url: 'URL inválida',
    date: 'Data inválida',
    future: 'Data deve ser futura',
    past: 'Data deve ser passada',
  },

  // Security
  security: {
    eventLogged: 'Evento de segurança registrado',
    eventError: 'Erro ao registrar evento de segurança',
    unauthorizedAction: 'Ação não autorizada',
    suspiciousActivity: 'Atividade suspeita detectada',
  },
} as const;

// Helper function to get nested messages
export function getMessage(path: string, ...args: any[]): string {
  const keys = path.split('.');
  let value: any = messages;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Message not found: ${path}`);
      return path;
    }
  }
  
  if (typeof value === 'function') {
    return value(...args);
  }
  
  return value;
}

// Utility type for autocomplete
export type MessagePath = 
  | keyof typeof messages
  | `${keyof typeof messages}.${string}`;
