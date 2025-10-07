import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Bot, 
  Settings, 
  Play, 
  Pause, 
  Clock, 
  MessageSquare, 
  Calendar, 
  Mail, 
  Phone,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'time_based' | 'stage_entry' | 'stage_timeout' | 'lead_score' | 'custom';
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: 'send_email' | 'create_appointment' | 'send_whatsapp' | 'move_stage' | 'update_score' | 'create_task';
    config: Record<string, any>;
  }>;
  isActive: boolean;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'followup' | 'nurturing' | 'qualification' | 'closing';
  rules: Omit<AutomationRule, 'id' | 'isActive' | 'lastExecuted' | 'executionCount' | 'successRate'>[];
}

const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'followup-sequence',
    name: 'Sequência de Follow-up',
    description: 'Automatiza follow-ups baseados em tempo e interações',
    category: 'followup',
    rules: [
      {
        name: 'Follow-up 24h',
        description: 'Envia mensagem automática após 24h sem interação',
        trigger: {
          type: 'time_based',
          conditions: { hours: 24, noInteraction: true }
        },
        actions: [
          {
            type: 'send_whatsapp',
            config: { template: 'followup_24h', personalized: true }
          }
        ]
      }
    ]
  },
  {
    id: 'lead-nurturing',
    name: 'Nutrição de Leads',
    description: 'Nutri leads com conteúdo relevante baseado no perfil',
    category: 'nurturing',
    rules: [
      {
        name: 'Conteúdo Educativo',
        description: 'Envia conteúdo baseado no segmento do lead',
        trigger: {
          type: 'stage_entry',
          conditions: { stageId: 'any', minDays: 2 }
        },
        actions: [
          {
            type: 'send_email',
            config: { template: 'educational_content', segmentBased: true }
          }
        ]
      }
    ]
  },
  {
    id: 'qualification-scoring',
    name: 'Qualificação Inteligente',
    description: 'Atualiza score automaticamente baseado em comportamento',
    category: 'qualification',
    rules: [
      {
        name: 'Score Dinâmico',
        description: 'Ajusta score baseado em interações e tempo',
        trigger: {
          type: 'custom',
          conditions: { event: 'interaction_logged' }
        },
        actions: [
          {
            type: 'update_score',
            config: { algorithm: 'behavioral', weight: 0.3 }
          }
        ]
      }
    ]
  }
];

export function SmartWorkflowAutomation({ pipelineId }: { pipelineId: string }) {
  const { stages } = useSupabasePipelineStages(pipelineId);
  const { toast } = useToast();
  
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('rules');

  // Load existing automation rules
  useEffect(() => {
    // Simular carregamento de regras existentes
    const mockRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Follow-up Automático',
        description: 'Envia WhatsApp após 48h sem interação',
        trigger: {
          type: 'time_based',
          conditions: { hours: 48, noInteraction: true }
        },
        actions: [
          {
            type: 'send_whatsapp',
            config: { message: 'Olá! Como posso ajudar você hoje?' }
          }
        ],
        isActive: true,
        executionCount: 142,
        successRate: 87,
        lastExecuted: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        name: 'Agendamento Automático',
        description: 'Cria agendamento quando lead entra em estágio específico',
        trigger: {
          type: 'stage_entry',
          conditions: { stageId: stages[1]?.id || '' }
        },
        actions: [
          {
            type: 'create_appointment',
            config: { duration: 30, type: 'call' }
          }
        ],
        isActive: true,
        executionCount: 67,
        successRate: 94,
        lastExecuted: new Date(Date.now() - 172800000)
      }
    ];
    
    setAutomationRules(mockRules);
  }, [stages]);

  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
    
    toast({
      title: "Status Atualizado",
      description: "Regra de automação foi ativada/desativada com sucesso."
    });
  };

  const createRuleFromTemplate = (template: AutomationTemplate) => {
    const newRules = template.rules.map((rule, index) => ({
      ...rule,
      id: `${template.id}-${index}-${Date.now()}`,
      isActive: false,
      executionCount: 0,
      successRate: 0
    }));

    setAutomationRules(prev => [...prev, ...newRules]);
    setSelectedTemplate(null);
    
    toast({
      title: "Automação Criada",
      description: `${newRules.length} regra(s) criada(s) a partir do template "${template.name}".`
    });
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'send_email': return Mail;
      case 'send_whatsapp': return MessageSquare;
      case 'create_appointment': return Calendar;
      case 'create_task': return CheckCircle;
      case 'move_stage': return Play;
      case 'update_score': return Bot;
      default: return Zap;
    }
  };

  const getTriggerDescription = (trigger: AutomationRule['trigger']) => {
    switch (trigger.type) {
      case 'time_based':
        return `Após ${trigger.conditions.hours}h ${trigger.conditions.noInteraction ? 'sem interação' : ''}`;
      case 'stage_entry':
        const stage = stages.find(s => s.id === trigger.conditions.stageId);
        return `Ao entrar na etapa "${stage?.nome || 'Desconhecida'}"`;
      case 'stage_timeout':
        return `Ao exceder prazo da etapa`;
      case 'lead_score':
        return `Score ${trigger.conditions.operator} ${trigger.conditions.value}`;
      default:
        return 'Trigger personalizado';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Automação Inteligente</h2>
          <p className="text-muted-foreground">
            Workflows automatizados para otimizar processos
          </p>
        </div>
        <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Automação</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Templates Disponíveis</h3>
                <div className="space-y-3">
                  {AUTOMATION_TEMPLATES.map(template => (
                    <Card 
                      key={template.id} 
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedTemplate?.id === template.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
              
              {selectedTemplate && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Detalhes do Template</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedTemplate.description}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">Regras incluídas:</p>
                        <ul className="space-y-2">
                          {selectedTemplate.rules.map((rule, index) => (
                            <li key={index} className="text-sm">
                              <strong>{rule.name}:</strong> {rule.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button 
                        onClick={() => createRuleFromTemplate(selectedTemplate)}
                        className="w-full"
                      >
                        Criar Automação
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Regras Ativas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {automationRules.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma automação configurada ainda
                  </p>
                  <Button onClick={() => setIsCreatingRule(true)}>
                    Criar Primeira Automação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {automationRules.map(rule => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRuleStatus(rule.id)}
                        />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Trigger:</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {getTriggerDescription(rule.trigger)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Ações:</p>
                        <div className="flex flex-wrap gap-2">
                          {rule.actions.map((action, index) => {
                            const Icon = getActionIcon(action.type);
                            return (
                              <div key={index} className="flex items-center gap-1 text-sm">
                                <Icon className="h-4 w-4" />
                                <span>{action.type.replace('_', ' ')}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                      <span>Execuções: {rule.executionCount}</span>
                      <span>Taxa de sucesso: {rule.successRate}%</span>
                      {rule.lastExecuted && (
                        <span>Última: {rule.lastExecuted.toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Total de Execuções</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {automationRules.reduce((acc, rule) => acc + rule.executionCount, 0)}
                </div>
                <p className="text-sm text-muted-foreground">nas últimas 30 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Taxa de Sucesso Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {Math.round(automationRules.reduce((acc, rule) => acc + rule.successRate, 0) / automationRules.length || 0)}%
                </div>
                <p className="text-sm text-muted-foreground">todas as automações</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Regras Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">
                  {automationRules.filter(rule => rule.isActive).length}
                </div>
                <p className="text-sm text-muted-foreground">
                  de {automationRules.length} total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance por Automação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automationRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {rule.executionCount} execuções
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {rule.successRate}%
                      </div>
                      <Badge variant={rule.successRate > 80 ? 'default' : 'secondary'}>
                        {rule.successRate > 80 ? 'Excelente' : 'Regular'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Globais</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure comportamentos gerais das automações
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Automações Ativas</Label>
                  <p className="text-sm text-muted-foreground">
                    Ativar/desativar todas as automações
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Logs Detalhados</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar logs detalhados de execução
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Limite de Execuções por Hora</Label>
                <Input type="number" defaultValue="100" className="w-32" />
                <p className="text-sm text-muted-foreground">
                  Evita spam e controla recursos
                </p>
              </div>

              <div className="space-y-2">
                <Label>Horário de Funcionamento</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Início</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div>
                    <Label className="text-sm">Fim</Label>
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automações respeitam horário comercial
                </p>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Alterações nas configurações podem afetar 
              automações em execução. Teste sempre em ambiente controlado antes de aplicar em produção.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}