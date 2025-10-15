import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock, 
  Edit, 
  Trash2, 
  Copy,
  Send,
  Calendar,
  Bot,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Template schemas
const templateSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['whatsapp', 'email', 'sms', 'ligacao']),
  categoria: z.enum(['entrada_etapa', 'saida_etapa', 'lembrete', 'followup', 'personalizado']),
  assunto: z.string().optional(),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  variaveis: z.array(z.string()).default([]),
  ativo: z.boolean().default(true),
  stage_id: z.string().optional(),
  pipeline_id: z.string().optional(),
  delay_minutes: z.number().default(0),
  auto_send: z.boolean().default(false),
});

const automationRuleSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome da regra é obrigatório'),
  template_id: z.string().min(1, 'Template é obrigatório'),
  trigger_type: z.enum(['entrada_etapa', 'saida_etapa', 'tempo_etapa', 'inatividade']),
  conditions: z.object({
    stage_id: z.string().optional(),
    delay_minutes: z.number().default(0),
    days_in_stage: z.number().optional(),
    lead_score_min: z.number().optional(),
  }),
  ativo: z.boolean().default(true),
});

type CommunicationTemplate = z.infer<typeof templateSchema>;
type AutomationRule = z.infer<typeof automationRuleSchema>;

interface CommunicationTemplatesManagerProps {
  stageId?: string;
  stageName?: string;
  pipelineId?: string;
  onClose?: () => void;
}

// Mock data - seria substituído por hooks do Supabase
const mockTemplates: CommunicationTemplate[] = [
  {
    id: '1',
    nome: 'Boas-vindas WhatsApp',
    tipo: 'whatsapp',
    categoria: 'entrada_etapa',
    conteudo: 'Olá {{nome}}! 👋 Bem-vindo(a) ao nosso processo. Em breve entraremos em contato para agendar sua consulta.',
    variaveis: ['nome'],
    ativo: true,
    auto_send: true,
    delay_minutes: 5
  },
  {
    id: '2',
    nome: 'Email de Qualificação',
    tipo: 'email',
    categoria: 'entrada_etapa',
    assunto: 'Próximos passos - {{nome}}',
    conteudo: 'Olá {{nome}},\n\nObrigado pelo seu interesse. Para darmos continuidade, preciso de algumas informações:\n\n1. Qual seu principal desafio?\n2. Qual seu faturamento atual?\n3. Quando gostaria de começar?\n\nAguardo seu retorno!\n\nAtenciosamente,\n{{closer}}',
    variaveis: ['nome', 'closer'],
    ativo: true,
    auto_send: false,
    delay_minutes: 30
  }
];

const mockAutomationRules: AutomationRule[] = [
  {
    id: '1',
    nome: 'Boas-vindas Automático',
    template_id: '1',
    trigger_type: 'entrada_etapa',
    conditions: { delay_minutes: 5 },
    ativo: true
  }
];

export function CommunicationTemplatesManager({ 
  stageId, 
  stageName, 
  pipelineId, 
  onClose 
}: CommunicationTemplatesManagerProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(mockTemplates);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>(mockAutomationRules);
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAutomationDialogOpen, setIsAutomationDialogOpen] = useState(false);
  const { toast } = useToast();

  // Template form
  const templateForm = useForm<CommunicationTemplate>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      nome: '',
      tipo: 'whatsapp',
      categoria: 'entrada_etapa',
      conteudo: '',
      variaveis: [],
      ativo: true,
      stage_id: stageId,
      pipeline_id: pipelineId,
      delay_minutes: 0,
      auto_send: false,
    },
  });

  // Automation form
  const automationForm = useForm<AutomationRule>({
    resolver: zodResolver(automationRuleSchema),
    defaultValues: {
      nome: '',
      template_id: '',
      trigger_type: 'entrada_etapa',
      conditions: { delay_minutes: 0 },
      ativo: true,
    },
  });

  const handleSaveTemplate = useCallback(async (data: CommunicationTemplate) => {
    try {
      if (selectedTemplate) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplate.id ? { ...data, id: selectedTemplate.id } : t));
        toast({ title: "Template atualizado", description: "Template de comunicação foi atualizado com sucesso" });
      } else {
        const newTemplate = { ...data, id: Date.now().toString() };
        setTemplates(prev => [...prev, newTemplate]);
        toast({ title: "Template criado", description: "Template de comunicação foi criado com sucesso" });
      }
      
      setIsTemplateDialogOpen(false);
      setSelectedTemplate(null);
      templateForm.reset();
    } catch (error) {
      toast({ 
        title: "Erro ao salvar template", 
        description: "Não foi possível salvar o template. Tente novamente.",
        variant: "destructive" 
      });
    }
  }, [selectedTemplate, templateForm, toast]);

  const handleSaveAutomation = useCallback(async (data: AutomationRule) => {
    try {
      const newRule = { ...data, id: Date.now().toString() };
      setAutomationRules(prev => [...prev, newRule]);
      
      toast({ 
        title: "Automação criada", 
        description: "Regra de automação foi criada com sucesso" 
      });
      
      setIsAutomationDialogOpen(false);
      automationForm.reset();
    } catch (error) {
      toast({ 
        title: "Erro ao criar automação", 
        description: "Não foi possível criar a automação. Tente novamente.",
        variant: "destructive" 
      });
    }
  }, [automationForm, toast]);

  const handleEditTemplate = useCallback((template: CommunicationTemplate) => {
    setSelectedTemplate(template);
    templateForm.reset(template);
    setIsTemplateDialogOpen(true);
  }, [templateForm]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast({ title: "Template removido", description: "Template foi removido com sucesso" });
  }, [toast]);

  const handleToggleTemplateStatus = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ativo: !t.ativo } : t
    ));
  }, []);

  const handleDuplicateTemplate = useCallback((template: CommunicationTemplate) => {
    const duplicated = {
      ...template,
      id: Date.now().toString(),
      nome: `${template.nome} - Cópia`,
      ativo: false
    };
    setTemplates(prev => [...prev, duplicated]);
    toast({ title: "Template duplicado", description: "Template foi duplicado com sucesso" });
  }, [toast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'ligacao': return <Phone className="h-4 w-4 text-orange-600" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'entrada_etapa': return <Zap className="h-4 w-4 text-green-600" />;
      case 'saida_etapa': return <Send className="h-4 w-4 text-blue-600" />;
      case 'tempo_etapa': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'inatividade': return <Calendar className="h-4 w-4 text-red-600" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const filteredTemplates = stageId 
    ? templates.filter(t => !t.stage_id || t.stage_id === stageId)
    : templates;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Templates de Comunicação</h3>
          {stageName && (
            <p className="text-sm text-muted-foreground">Etapa: {stageName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? 'Editar Template' : 'Criar Template de Comunicação'}
                </DialogTitle>
              </DialogHeader>
              
              <Form {...templateForm}>
                <form onSubmit={templateForm.handleSubmit(handleSaveTemplate)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Template</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Boas-vindas WhatsApp" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Comunicação</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">E-mail</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="ligacao">Ligação (script)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={templateForm.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="entrada_etapa">Entrada na Etapa</SelectItem>
                              <SelectItem value="saida_etapa">Saída da Etapa</SelectItem>
                              <SelectItem value="lembrete">Lembrete</SelectItem>
                              <SelectItem value="followup">Follow-up</SelectItem>
                              <SelectItem value="personalizado">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={templateForm.control}
                      name="delay_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay (minutos)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {templateForm.watch('tipo') === 'email' && (
                    <FormField
                      control={templateForm.control}
                      name="assunto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assunto do E-mail</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Próximos passos - {{nome}}" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={templateForm.control}
                    name="conteudo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conteúdo da Mensagem</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Digite o conteúdo... Use {{variavel}} para inserir dados do lead"
                            className="min-h-32"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-muted/20 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">Variáveis Disponíveis:</h4>
                     <div className="flex flex-wrap gap-2 text-xs">
                       {['{{nome}}', '{{email}}', '{{whatsapp}}', '{{closer}}', '{{empresa}}', '{{segmento}}'].map(variable => (
                         <Badge 
                           key={variable} 
                           variant="secondary" 
                           className="cursor-pointer"
                           onClick={() => {
                             const currentContent = templateForm.getValues('conteudo');
                             templateForm.setValue('conteudo', currentContent + ' ' + variable);
                           }}
                         >
                           {variable}
                         </Badge>
                       ))}
                     </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <FormField
                      control={templateForm.control}
                      name="auto_send"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Envio Automático</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Enviar automaticamente quando ativado por regra
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={templateForm.control}
                      name="ativo"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Ativo</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Template disponível para uso
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {selectedTemplate ? 'Atualizar' : 'Criar'} Template
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Templates ({filteredTemplates.length})</TabsTrigger>
          <TabsTrigger value="automations">Automações ({automationRules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {filteredTemplates.length > 0 ? (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(template.tipo)}
                        <div>
                          <CardTitle className="text-base">{template.nome}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {template.categoria.replace('_', ' ')}
                            </Badge>
                            <Badge variant={template.ativo ? "secondary" : "outline"} className="text-xs">
                              {template.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {template.auto_send && (
                              <Badge variant="outline" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                Auto
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTemplateStatus(template.id!)}
                          className="h-8 w-8 p-0"
                        >
                          <Switch 
                            checked={template.ativo} 
                            onChange={() => handleToggleTemplateStatus(template.id!)}
                            className="pointer-events-none"
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id!)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {template.assunto && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Assunto:</p>
                          <p className="text-sm">{template.assunto}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Conteúdo:</p>
                        <p className="text-sm bg-muted/20 p-2 rounded mt-1 line-clamp-3">
                          {template.conteudo}
                        </p>
                      </div>
                      
                      {template.delay_minutes > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Delay de {template.delay_minutes} minutos
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">Nenhum template encontrado</h4>
                <p className="text-muted-foreground mb-6">
                  Crie templates de comunicação para automatizar mensagens em suas etapas.
                </p>
                <Button onClick={() => setIsTemplateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="automations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAutomationDialogOpen} onOpenChange={setIsAutomationDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Nova Automação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Criar Regra de Automação</DialogTitle>
                </DialogHeader>
                
                <Form {...automationForm}>
                  <form onSubmit={automationForm.handleSubmit(handleSaveAutomation)} className="space-y-4">
                    <FormField
                      control={automationForm.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Regra</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Boas-vindas Automático" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={automationForm.control}
                      name="template_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um template" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id!}>
                                  {template.nome} ({template.tipo})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={automationForm.control}
                      name="trigger_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disparador</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="entrada_etapa">Entrada na Etapa</SelectItem>
                              <SelectItem value="saida_etapa">Saída da Etapa</SelectItem>
                              <SelectItem value="tempo_etapa">Tempo na Etapa</SelectItem>
                              <SelectItem value="inatividade">Inatividade</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={automationForm.control}
                      name="conditions.delay_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay (minutos)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAutomationDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Criar Automação</Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {automationRules.length > 0 ? (
            <div className="grid gap-4">
              {automationRules.map((rule) => {
                const template = templates.find(t => t.id === rule.template_id);
                return (
                  <Card key={rule.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTriggerIcon(rule.trigger_type)}
                          <div>
                            <CardTitle className="text-base">{rule.nome}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {rule.trigger_type.replace('_', ' ')}
                              </Badge>
                              <Badge variant={rule.ativo ? "secondary" : "outline"} className="text-xs">
                                {rule.ativo ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Switch checked={rule.ativo} />
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Template:</p>
                          <p className="text-sm">{template?.nome} ({template?.tipo})</p>
                        </div>
                        
                        {rule.conditions.delay_minutes > 0 && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Executar após {rule.conditions.delay_minutes} minutos
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="p-12 text-center">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium mb-2">Nenhuma automação configurada</h4>
                <p className="text-muted-foreground mb-6">
                  Configure automações para enviar templates automaticamente baseado em regras.
                </p>
                <Button onClick={() => setIsAutomationDialogOpen(true)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Criar Primeira Automação
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}