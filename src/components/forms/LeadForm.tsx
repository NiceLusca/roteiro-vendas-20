import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lead, OrigemLead, ObjecaoPrincipal, StatusGeral } from '@/types/crm';
import { formatCurrency, normalizeWhatsApp, calculateLeadScore } from '@/utils/formatters';
import { X, User, Phone, Mail, Building2, Target, Star, AlertCircle, Save } from 'lucide-react';

interface LeadFormProps {
  lead?: Partial<Lead>;
  onSubmit: (lead: Partial<Lead>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const origemOptions: OrigemLead[] = [
  'Facebook', 'Instagram', 'Google', 'Indicação', 'Orgânico', 'WhatsApp', 'LinkedIn', 'Evento', 'Outro'
];

const objecaoOptions: ObjecaoPrincipal[] = [
  'Preço', 'Tempo', 'Prioridade', 'Confiança', 'Sem Fit', 'Orçamento', 'Decisor', 'Concorrente', 'Outro'
];

const statusOptions: StatusGeral[] = ['Ativo', 'Cliente', 'Perdido', 'Inativo'];

export function LeadForm({ lead, onSubmit, onCancel, loading = false }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    nome: '',
    email: '',
    whatsapp: '',
    origem: 'Outro',
    segmento: '',
    status_geral: 'Ativo',
    closer: '',
    desejo_na_sessao: '',
    objecao_principal: undefined,
    objecao_obs: '',
    observacoes: '',
    ja_vendeu_no_digital: false,
    seguidores: 0,
    faturamento_medio: 0,
    meta_faturamento: 0,
    ...lead
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular score em tempo real
  const { score, classification } = calculateLeadScore({
    ja_vendeu_no_digital: formData.ja_vendeu_no_digital || false,
    seguidores: formData.seguidores || 0,
    faturamento_medio: formData.faturamento_medio || 0,
    meta_faturamento: formData.meta_faturamento || 0,
    origem: formData.origem || 'Outro',
    objecao_principal: formData.objecao_principal
  });

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleWhatsAppChange = (value: string) => {
    const normalized = normalizeWhatsApp(value);
    handleInputChange('whatsapp', normalized);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.whatsapp?.trim()) {
      newErrors.whatsapp = 'WhatsApp é obrigatório';
    } else if (!/^\+55\d{10,11}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
      newErrors.whatsapp = 'WhatsApp deve ter formato válido (+55DDDNÚMERO)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const finalData = {
      ...formData,
      lead_score: score,
      lead_score_classification: classification,
      updated_at: new Date(),
      ...(lead?.id ? {} : { created_at: new Date() })
    };

    onSubmit(finalData);
  };

  const getScoreColor = (classification: string) => {
    switch (classification) {
      case 'Alto': return 'score-alto';
      case 'Médio': return 'score-medio';
      default: return 'score-baixo';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {lead?.id ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <p className="text-muted-foreground">
            Preencha as informações do lead
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getScoreColor(classification)}>
            Score: {score} ({classification})
          </Badge>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome || ''}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome completo do lead"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive mt-1">{errors.nome}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemplo.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp *</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp || ''}
                onChange={(e) => handleWhatsAppChange(e.target.value)}
                placeholder="+55 11 99999-9999"
                className={errors.whatsapp ? 'border-destructive' : ''}
              />
              {errors.whatsapp && (
                <p className="text-sm text-destructive mt-1">{errors.whatsapp}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origem">Origem</Label>
                <Select
                  value={formData.origem}
                  onValueChange={(value: OrigemLead) => handleInputChange('origem', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {origemOptions.map(origem => (
                      <SelectItem key={origem} value={origem}>
                        {origem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status_geral}
                  onValueChange={(value: StatusGeral) => handleInputChange('status_geral', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="segmento">Segmento</Label>
              <Input
                id="segmento"
                value={formData.segmento || ''}
                onChange={(e) => handleInputChange('segmento', e.target.value)}
                placeholder="Ex: E-commerce, Consultoria, Freelancer"
              />
            </div>

            <div>
              <Label htmlFor="closer">Closer Responsável</Label>
              <Input
                id="closer"
                value={formData.closer || ''}
                onChange={(e) => handleInputChange('closer', e.target.value)}
                placeholder="Nome do vendedor responsável"
              />
            </div>
          </CardContent>
        </Card>

        {/* Perfil e Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Perfil e Scoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ja_vendeu">Já vendeu no digital?</Label>
              <Switch
                id="ja_vendeu"
                checked={formData.ja_vendeu_no_digital || false}
                onCheckedChange={(checked) => handleInputChange('ja_vendeu_no_digital', checked)}
              />
            </div>

            <div>
              <Label htmlFor="seguidores">Seguidores</Label>
              <Input
                id="seguidores"
                type="number"
                value={formData.seguidores || ''}
                onChange={(e) => handleInputChange('seguidores', parseInt(e.target.value) || 0)}
                placeholder="Número de seguidores"
              />
            </div>

            <div>
              <Label htmlFor="faturamento">Faturamento Médio (R$)</Label>
              <Input
                id="faturamento"
                type="number"
                step="0.01"
                value={formData.faturamento_medio || ''}
                onChange={(e) => handleInputChange('faturamento_medio', parseFloat(e.target.value) || 0)}
                placeholder="Faturamento mensal médio"
              />
              {formData.faturamento_medio && formData.faturamento_medio > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(formData.faturamento_medio)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="meta">Meta de Faturamento (R$)</Label>
              <Input
                id="meta"
                type="number"
                step="0.01"
                value={formData.meta_faturamento || ''}
                onChange={(e) => handleInputChange('meta_faturamento', parseFloat(e.target.value) || 0)}
                placeholder="Meta de faturamento mensal"
              />
              {formData.meta_faturamento && formData.meta_faturamento > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(formData.meta_faturamento)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="desejo">Desejo na Sessão</Label>
              <Textarea
                id="desejo"
                value={formData.desejo_na_sessao || ''}
                onChange={(e) => handleInputChange('desejo_na_sessao', e.target.value)}
                placeholder="O que o lead espera alcançar com a sessão?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="objecao">Objeção Principal</Label>
              <Select
                value={formData.objecao_principal || ''}
                onValueChange={(value: ObjecaoPrincipal) => handleInputChange('objecao_principal', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma objeção" />
                </SelectTrigger>
                <SelectContent>
                  {objecaoOptions.map(objecao => (
                    <SelectItem key={objecao} value={objecao}>
                      {objecao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.objecao_principal && (
              <div>
                <Label htmlFor="objecao_obs">Detalhes da Objeção</Label>
                <Textarea
                  id="objecao_obs"
                  value={formData.objecao_obs || ''}
                  onChange={(e) => handleInputChange('objecao_obs', e.target.value)}
                  placeholder="Descreva mais detalhes sobre a objeção"
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Observações Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.observacoes || ''}
            onChange={(e) => handleInputChange('observacoes', e.target.value)}
            placeholder="Observações gerais sobre o lead..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Salvando...' : 'Salvar Lead'}
        </Button>
      </div>
    </form>
  );
}