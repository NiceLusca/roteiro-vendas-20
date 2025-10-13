import { z } from 'zod';

/**
 * Schema de validação completo para leads
 * Usado em formulários e imports para garantir integridade dos dados
 */

// Validação de WhatsApp brasileiro
const whatsappSchema = z.string()
  .min(1, 'WhatsApp é obrigatório')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    return digits.length === 13 || digits.length === 11;
  }, 'WhatsApp deve ter formato válido (+55DDDNÚMERO)')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 13 && !digits.startsWith('55')) {
      return false;
    }
    return true;
  }, 'WhatsApp deve começar com +55')
  .refine((val) => {
    const digits = val.replace(/\D/g, '');
    const ddd = digits.length === 13 
      ? parseInt(digits.substring(2, 4))
      : parseInt(digits.substring(0, 2));
    return ddd >= 11 && ddd <= 99;
  }, 'DDD inválido');

// Email validation
const emailSchema = z.string()
  .email('Email inválido')
  .max(255, 'Email muito longo')
  .optional()
  .or(z.literal(''));

// Texto com limite
const textFieldSchema = (maxLength: number, fieldName: string) => 
  z.string()
    .max(maxLength, `${fieldName} deve ter no máximo ${maxLength} caracteres`)
    .optional()
    .or(z.literal(''));

// Schema principal do Lead
export const leadSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .transform(val => {
      if (typeof document === 'undefined') return val;
      const textArea = document.createElement('textarea');
      textArea.innerHTML = val;
      return textArea.value;
    }),
  
  whatsapp: whatsappSchema,
  
  email: emailSchema,
  
  origem: z.enum([
    'Facebook',
    'Instagram', 
    'Google',
    'Indicação',
    'Orgânico',
    'WhatsApp',
    'LinkedIn',
    'Evento',
    'Outro'
  ]),
  
  segmento: textFieldSchema(100, 'Segmento'),
  
  status_geral: z.enum(['Ativo', 'Cliente', 'Perdido', 'Inativo']),
  
  closer: textFieldSchema(100, 'Closer'),
  
  desejo_na_sessao: textFieldSchema(500, 'Desejo na Sessão'),
  
  objecao_principal: z.enum([
    'Preço',
    'Tempo',
    'Prioridade',
    'Confiança',
    'Sem Fit',
    'Orçamento',
    'Decisor',
    'Concorrente',
    'Outro'
  ]).optional(),
  
  objecao_obs: textFieldSchema(500, 'Observações da Objeção'),
  
  observacoes: textFieldSchema(1000, 'Observações'),
  
  ja_vendeu_no_digital: z.boolean().default(false),
  
  seguidores: z.number()
    .int('Seguidores deve ser um número inteiro')
    .min(0, 'Seguidores não pode ser negativo')
    .max(10000000, 'Valor de seguidores muito alto')
    .default(0),
  
  faturamento_medio: z.number()
    .min(0, 'Faturamento não pode ser negativo')
    .max(999999999, 'Faturamento muito alto')
    .default(0),
  
  meta_faturamento: z.number()
    .min(0, 'Meta não pode ser negativa')
    .max(999999999, 'Meta muito alta')
    .default(0),
  
  valor_lead: z.number()
    .int('Valor do lead deve ser um número inteiro')
    .min(0, 'Valor do lead não pode ser negativo')
    .max(110, 'Valor do lead deve ser no máximo 110')
    .default(0),
  
  resultado_sessao_ultimo: textFieldSchema(200, 'Resultado da Última Sessão'),
  
  resultado_obs_ultima_sessao: textFieldSchema(500, 'Observações do Resultado'),
});

// Type inference
export type LeadValidation = z.infer<typeof leadSchema>;

// Schema parcial para updates
export const leadUpdateSchema = leadSchema.partial();

// Schema para bulk import (mais permissivo)
export const leadBulkImportSchema = leadSchema.extend({
  // Permite campos vazios no import
  email: z.string().optional().or(z.literal('')),
  segmento: z.string().optional().or(z.literal('')),
  closer: z.string().optional().or(z.literal('')),
}).partial({
  status_geral: true,
  origem: true,
});

/**
 * Valida dados de lead e retorna erros formatados
 */
export function validateLead(data: unknown): { success: true; data: LeadValidation } | { success: false; errors: Record<string, string> } {
  const result = leadSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const field = err.path.join('.');
    errors[field] = err.message;
  });
  
  return { success: false, errors };
}

/**
 * Decodifica entidades HTML (ex: &aacute; → á, &Aacute; → Á)
 */
function decodeHTMLEntities(text: string): string {
  if (typeof document === 'undefined') return text; // SSR safety
  const textArea = document.createElement('textarea');
  textArea.innerHTML = text;
  return textArea.value;
}

/**
 * Sanitiza entrada de texto para prevenir XSS e decodificar HTML entities
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  
  return decodeHTMLEntities(text)
    .trim()
    .replace(/[<>]/g, '') // Remove < e > para prevenir tags HTML
    .substring(0, 1000); // Limite de segurança
}

/**
 * Sanitiza entrada de número
 */
export function sanitizeNumber(value: any, defaultValue = 0, max = 999999999): number {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num) || num < 0) return defaultValue;
  if (num > max) return max;
  
  return num;
}
