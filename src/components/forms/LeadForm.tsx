import { useState, useEffect } from 'react';
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
import { X, User, Phone, Mail, Building2, Target, Star, AlertCircle, Save, Tag, Plus } from 'lucide-react';
import { useLeadTags } from '@/hooks/useLeadTags';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadFormProps {
  lead?: Partial<Lead>;
  onSubmit: (lead: Partial<Lead>, selectedTagIds?: string[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

const origemOptions: { value: OrigemLead; label: string }[] = [
  { value: 'evento', label: 'Evento' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'organico', label: 'Orgânico' },
  { value: 'outro', label: 'Outro' },
  { value: 'trafego_pago', label: 'Tráfego Pago' }
];

const objecaoOptions: { value: ObjecaoPrincipal; label: string }[] = [
  { value: 'confianca', label: 'Confiança' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'prioridade', label: 'Prioridade' },
  { value: 'tempo', label: 'Tempo' }
];

const statusOptions: StatusGeral[] = ['Ativo', 'Cliente', 'Perdido', 'Inativo'];

export function LeadForm({ lead, onSubmit, onCancel, loading = false }: LeadFormProps) {
  const { tags, loading: loadingTags, getLeadTags, createTag } = useLeadTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [openTagSelector, setOpenTagSelector] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [formData, setFormData] = useState<Partial<Lead>>({
    nome: '',
    email: '',
    whatsapp: '',
    origem: 'outro',
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

  // Load existing tags for the lead
  useEffect(() => {
    const loadLeadTags = async () => {
      if (lead?.id) {
        const leadTags = await getLeadTags(lead.id);
        setSelectedTagIds(leadTags.map(t => t.id));
      }
    };
    loadLeadTags();
  }, [lead?.id, getLeadTags]);

  // Normalize WhatsApp when lead is loaded
  useEffect(() => {
    if (lead?.whatsapp && lead.whatsapp !== formData.whatsapp) {
      const normalized = normalizeWhatsApp(lead.whatsapp);
      setFormData(prev => ({ ...prev, whatsapp: normalized }));
    }
  }, [lead?.whatsapp]);

  // Calcular score em tempo real
  const { score, classification } = calculateLeadScore({
    ja_vendeu_no_digital: formData.ja_vendeu_no_digital || false,
    seguidores: formData.seguidores || 0,
    faturamento_medio: formData.faturamento_medio || 0,
    meta_faturamento: formData.meta_faturamento || 0,
    origem: formData.origem || 'Outro',
    objecao_principal: formData.objecao_principal
  });

  // Sanitize lead data to keep only valid fields when editing
  useEffect(() => {
    if (lead) {
      const sanitized: Partial<Lead> = {
        nome: lead.nome || '',
        email: lead.email,
        whatsapp: lead.whatsapp || '',
        origem: lead.origem || 'outro',
        segmento: lead.segmento,
        status_geral: lead.status_geral || 'Ativo',
        closer: lead.closer,
        desejo_na_sessao: lead.desejo_na_sessao,
        objecao_principal: lead.objecao_principal,
        objecao_obs: lead.objecao_obs,
        observacoes: lead.observacoes,
        ja_vendeu_no_digital: lead.ja_vendeu_no_digital || false,
        seguidores: lead.seguidores || 0,
        faturamento_medio: lead.faturamento_medio || 0,
        meta_faturamento: lead.meta_faturamento || 0,
        resultado_sessao_ultimo: lead.resultado_sessao_ultimo,
        resultado_obs_ultima_sessao: lead.resultado_obs_ultima_sessao,
        valor_lead: lead.valor_lead || 0
      };
      setFormData(prev => ({ ...prev, ...sanitized }));
    }
  }, [lead]);

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
    } else {
      // Remove tudo exceto dígitos para validar
      const digits = formData.whatsapp.replace(/\D/g, '');
      
      // Deve ter 13 dígitos (55 + DDD + número) ou 11 (sem código do país)
      if (digits.length !== 13 && digits.length !== 11) {
        newErrors.whatsapp = 'WhatsApp deve ter formato válido (+55DDDNÚMERO)';
      } else if (digits.length === 13 && !digits.startsWith('55')) {
        newErrors.whatsapp = 'WhatsApp deve começar com +55';
      } else if (digits.length === 11) {
        // Validar DDD brasileiro (11-99)
        const ddd = parseInt(digits.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
          newErrors.whatsapp = 'DDD inválido';
        }
      } else if (digits.length === 13) {
        // Validar DDD brasileiro (11-99) após o código do país
        const ddd = parseInt(digits.substring(2, 4));
        if (ddd < 11 || ddd > 99) {
          newErrors.whatsapp = 'DDD inválido';
        }
      }
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

    onSubmit(finalData, selectedTagIds);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateNewTag = async () => {
    if (newTagName.trim()) {
      const newTag = await createTag(newTagName.trim());
      if (newTag) {
        setSelectedTagIds(prev => [...prev, newTag.id]);
        setNewTagName('');
      }
    }
  };

  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

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
                    {origemOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
              <Label htmlFor="valor_lead">Valor do Lead (0-110)</Label>
              <Input
                id="valor_lead"
                type="number"
                min="0"
                max="110"
                value={formData.valor_lead || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  handleInputChange('valor_lead', Math.min(110, Math.max(0, value)));
                }}
                placeholder="Valor potencial do lead"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Defina o valor potencial deste lead (0 a 110)
              </p>
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
                    {objecaoOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag.id}
                variant="outline"
                className="gap-2 cursor-pointer hover:bg-muted"
                style={{ borderColor: tag.cor, color: tag.cor }}
                onClick={() => handleToggleTag(tag.id)}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: tag.cor }}
                />
                {tag.nome}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            {selectedTags.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tag selecionada</p>
            )}
          </div>

          <Popover open={openTagSelector} onOpenChange={setOpenTagSelector}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Buscar ou criar tag..." 
                  value={newTagName}
                  onValueChange={setNewTagName}
                />
                <CommandEmpty>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full"
                    onClick={handleCreateNewTag}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar "{newTagName}"
                  </Button>
                </CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-auto">
                  {tags.map(tag => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        handleToggleTag(tag.id);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div 
                        className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: tag.cor }}
                      />
                      {tag.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

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