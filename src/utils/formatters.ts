// Formatadores brasileiros para o CRM

// Formatar moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Formatar data brasileira (dd/MM/yyyy)
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

// Formatar data e hora brasileira (dd/MM/yyyy HH:mm)
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  }).format(date);
};

// Formatar WhatsApp
export const formatWhatsApp = (phone: string): string => {
  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se começar com 55, assume que já tem código do país
  if (cleaned.startsWith('55') && cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  
  // Se tem 11 dígitos, adiciona código do país
  if (cleaned.length === 11) {
    return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Retorna original se não conseguir formatar
};

// Normalizar WhatsApp para armazenamento
export const normalizeWhatsApp = (phone: string): string => {
  // Remove tudo que não for número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se vazio, retorna vazio
  if (cleaned.length === 0) return '';
  
  // Se tem 11 dígitos (número brasileiro sem código do país)
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  
  // Se tem 13 dígitos e começa com 55 (já tem código do país)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  // Se tem 12 dígitos e começa com 55, remove o primeiro 5 (provavelmente erro)
  if (cleaned.length === 12 && cleaned.startsWith('55')) {
    return `+${cleaned.slice(0, 13)}`;
  }
  
  // Para qualquer outro caso com 10+ dígitos, tenta adicionar +55
  if (cleaned.length >= 10) {
    const lastDigits = cleaned.slice(-11);
    return `+55${lastDigits}`;
  }
  
  // Se for muito curto, retorna com +55 mesmo assim
  return `+55${cleaned}`;
};

// Validar WhatsApp brasileiro
export const validateWhatsApp = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // Aceita números de 11 dígitos (DDD + 9 + número)
  if (cleaned.length === 11) {
    const ddd = cleaned.slice(0, 2);
    const nono = cleaned.slice(2, 3);
    // DDD válido (11-99) e nono dígito 9
    return parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && nono === '9';
  }
  
  // Aceita números de 13 dígitos com código do país (+55)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const ddd = cleaned.slice(2, 4);
    const nono = cleaned.slice(4, 5);
    return parseInt(ddd) >= 11 && parseInt(ddd) <= 99 && nono === '9';
  }
  
  return false;
};

// Calcular score do lead
export const calculateLeadScore = (lead: {
  ja_vendeu_no_digital: boolean;
  seguidores: number;
  faturamento_medio: number;
  meta_faturamento: number;
  origem: string;
  objecao_principal?: string;
}): { score: number; classification: 'Alto' | 'Médio' | 'Baixo' } => {
  let score = 0;
  
  // +30 se já vendeu no digital
  if (lead.ja_vendeu_no_digital) {
    score += 30;
  }
  
  // +1 por 1.000 seguidores (máx. +20)
  score += Math.min(Math.floor(lead.seguidores / 1000), 20);
  
  // +20 se faturamento >= 50% da meta
  if (lead.faturamento_medio >= (lead.meta_faturamento * 0.5)) {
    score += 20;
  }
  
  // +20 se origem é boa
  if (['Indicação', 'Orgânico'].includes(lead.origem)) {
    score += 20;
  }
  
  // -15 se objeção é preço
  if (lead.objecao_principal === 'Preço') {
    score -= 15;
  }
  
  // Classificação
  let classification: 'Alto' | 'Médio' | 'Baixo';
  if (score >= 60) {
    classification = 'Alto';
  } else if (score >= 30) {
    classification = 'Médio';
  } else {
    classification = 'Baixo';
  }
  
  return { score, classification };
};

// Calcular saúde da etapa baseado em atraso
export const calculateStageHealth = (diasEmAtraso: number): 'Verde' | 'Amarelo' | 'Vermelho' => {
  if (diasEmAtraso === 0) return 'Verde';
  if (diasEmAtraso <= 3) return 'Amarelo';
  return 'Vermelho';
};

// Calcular dias entre datas
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Formatar número compacto (1.2K, 3.4M)
export const formatCompactNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};