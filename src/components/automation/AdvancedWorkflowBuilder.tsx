import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  Settings, 
  Zap, 
  GitBranch, 
  Clock, 
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Workflow
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  name: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections: string[];
}

interface AdvancedWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'support' | 'operational';
  nodes: WorkflowNode[];
  isActive: boolean;
  complexity: 'simple' | 'medium' | 'complex';
  aiOptimized: boolean;
  executionCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'intelligent-followup',
    name: 'Follow-up Inteligente',
    description: 'Sistema adaptativo de follow-up baseado em comportamento do lead',
    category: 'sales' as const,
    complexity: 'complex' as const,
    aiOptimized: true,
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger' as const,
        name: 'Lead sem interação há 24h',
        config: { type: 'inactivity', duration: 24, unit: 'hours' },
        position: { x: 100, y: 100 },
        connections: ['condition-1']
      },
      {
        id: 'condition-1',
        type: 'condition' as const,
        name: 'Verificar engajamento anterior',
        config: { field: 'engagement_score', operator: 'greater_than', value: 50 },
        position: { x: 300, y: 100 },
        connections: ['action-1', 'action-2']
      },
      {
        id: 'action-1',
        type: 'action' as const,
        name: 'WhatsApp personalizado',
        config: { type: 'send_whatsapp', template: 'high_engagement', personalized: true },
        position: { x: 500, y: 50 },
        connections: []
      },
      {
        id: 'action-2',
        type: 'action' as const,
        name: 'Email educativo',
        config: { type: 'send_email', template: 'low_engagement', content_type: 'educational' },
        position: { x: 500, y: 150 },
        connections: []
      }
    ]
  },
  {
    id: 'smart-qualification',
    name: 'Qualificação Inteligente',
    description: 'Qualifica leads automaticamente usando IA e move para etapas apropriadas',
    category: 'sales' as const,
    complexity: 'complex' as const,
    aiOptimized: true,
    nodes: [
      {
        id: 'trigger-2',
        type: 'trigger' as const,
        name: 'Nova interação registrada',
        config: { type: 'interaction_created' },
        position: { x: 100, y: 100 },
        connections: ['condition-2']
      },
      {
        id: 'condition-2',
        type: 'condition' as const,
        name: 'Análise IA de qualificação',
        config: { type: 'ai_analysis', model: 'qualification', threshold: 0.7 },
        position: { x: 300, y: 100 },
        connections: ['action-3', 'delay-1']
      },
      {
        id: 'action-3',
        type: 'action' as const,
        name: 'Mover para "Qualificado"',
        config: { type: 'move_stage', target_stage: 'qualified' },
        position: { x: 500, y: 50 },
        connections: []
      },
      {
        id: 'delay-1',
        type: 'delay' as const,
        name: 'Aguardar 2 dias',
        config: { duration: 2, unit: 'days' },
        position: { x: 500, y: 150 },
        connections: ['action-4']
      },
      {
        id: 'action-4',
        type: 'action' as const,
        name: 'Agendar chamada de qualificação',
        config: { type: 'create_appointment', duration: 30, appointmentType: 'qualification_call' },
        position: { x: 700, y: 150 },
        connections: []
      }
    ]
  }
];

export function AdvancedWorkflowBuilder() {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<AdvancedWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AdvancedWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  useEffect(() => {
    // Load workflows from storage/API
    const savedWorkflows = localStorage.getItem('advanced_workflows');
    if (savedWorkflows) {
      setWorkflows(JSON.parse(savedWorkflows));
    }
  }, []);

  const saveWorkflows = (newWorkflows: AdvancedWorkflow[]) => {
    localStorage.setItem('advanced_workflows', JSON.stringify(newWorkflows));
    setWorkflows(newWorkflows);
  };

  const createWorkflowFromTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const newWorkflow: AdvancedWorkflow = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      category: template.category,
      nodes: template.nodes.map(node => ({ ...node, id: crypto.randomUUID() })),
      isActive: false,
      complexity: template.complexity,
      aiOptimized: template.aiOptimized,
      executionCount: 0,
      successRate: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedWorkflows = [...workflows, newWorkflow];
    saveWorkflows(updatedWorkflows);
    setSelectedWorkflow(newWorkflow);
    setIsBuilderOpen(true);

    toast({
      title: "Workflow Criado",
      description: `Workflow "${template.name}" foi criado com sucesso.`
    });
  };

  const toggleWorkflowStatus = (workflowId: string) => {
    const updatedWorkflows = workflows.map(workflow =>
      workflow.id === workflowId
        ? { ...workflow, isActive: !workflow.isActive, updatedAt: new Date() }
        : workflow
    );
    saveWorkflows(updatedWorkflows);

    toast({
      title: "Status Atualizado",
      description: "Workflow foi ativado/desativado com sucesso."
    });
  };

  const deleteWorkflow = (workflowId: string) => {
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    saveWorkflows(updatedWorkflows);

    toast({
      title: "Workflow Removido",
      description: "Workflow foi removido com sucesso."
    });
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300';
      case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return Target;
      case 'marketing': return MessageSquare;
      case 'support': return Phone;
      case 'operational': return Settings;
      default: return Workflow;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Construtor de Workflows Avançados</h2>
          <p className="text-muted-foreground">
            Crie workflows inteligentes com IA e lógica condicional avançada
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Novo Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Workflow</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Templates Inteligentes</h3>
                  {WORKFLOW_TEMPLATES.map(template => {
                    const CategoryIcon = getCategoryIcon(template.category);
                    return (
                      <Card 
                        key={template.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          createWorkflowFromTemplate(template.id);
                          setIsCreating(false);
                        }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-base">{template.name}</CardTitle>
                            </div>
                            <div className="flex gap-1">
                              <Badge className={getComplexityColor(template.complexity)}>
                                {template.complexity}
                              </Badge>
                              {template.aiOptimized && (
                                <Badge variant="secondary">
                                  <Brain className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{template.nodes.length} etapas</span>
                            <span>Categoria: {template.category}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Workflow Personalizado</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">Construtor Visual</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Crie workflows personalizados usando nossa interface visual
                        </p>
                        <Button
                          onClick={() => {
                            setIsCreating(false);
                            setIsBuilderOpen(true);
                          }}
                        >
                          <GitBranch className="h-4 w-4 mr-2" />
                          Abrir Construtor
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Brain className="h-4 w-4 mr-2" />
            Otimizar com IA
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">Insights IA</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Workflow className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhum workflow configurado</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie seu primeiro workflow inteligente para automatizar processos
                  </p>
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map(workflow => {
                const CategoryIcon = getCategoryIcon(workflow.category);
                return (
                  <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <CategoryIcon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{workflow.name}</CardTitle>
                            <div className="flex gap-1">
                              <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                                {workflow.isActive ? 'Ativo' : 'Inativo'}
                              </Badge>
                              <Badge className={getComplexityColor(workflow.complexity)}>
                                {workflow.complexity}
                              </Badge>
                              {workflow.aiOptimized && (
                                <Badge variant="secondary">
                                  <Brain className="h-3 w-3 mr-1" />
                                  IA
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={workflow.isActive}
                            onCheckedChange={() => toggleWorkflowStatus(workflow.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkflow(workflow);
                              setIsBuilderOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Etapas</p>
                          <p className="font-medium">{workflow.nodes.length}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Execuções</p>
                          <p className="font-medium">{workflow.executionCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taxa de Sucesso</p>
                          <p className="font-medium">{workflow.successRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Atualizado</p>
                          <p className="font-medium">{workflow.updatedAt.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workflows.length}</p>
                    <p className="text-sm text-muted-foreground">Workflows Totais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg dark:bg-green-800/20">
                    <Play className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workflows.filter(w => w.isActive).length}</p>
                    <p className="text-sm text-muted-foreground">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg dark:bg-purple-800/20">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{workflows.filter(w => w.aiOptimized).length}</p>
                    <p className="text-sm text-muted-foreground">Com IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-800/20">
                    <CheckCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(workflows.reduce((acc, w) => acc + w.successRate, 0) / workflows.length || 0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taxa Média</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              A IA está analisando seus workflows para identificar oportunidades de otimização...
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sugestões de Otimização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg dark:bg-blue-800/10">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Timing de Follow-up</p>
                    <p className="text-xs text-muted-foreground">
                      Ajustar intervalo para 36h aumentaria conversão em 12%
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg dark:bg-orange-800/10">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Gargalo Identificado</p>
                    <p className="text-xs text-muted-foreground">
                      Etapa de qualificação apresenta alta taxa de abandono
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Padrões Detectados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg dark:bg-green-800/10">
                  <Target className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Horário Ótimo</p>
                    <p className="text-xs text-muted-foreground">
                      Terças às 14h apresentam maior taxa de resposta
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg dark:bg-purple-800/10">
                  <MessageSquare className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Canal Preferido</p>
                    <p className="text-xs text-muted-foreground">
                      WhatsApp tem 3x mais engajamento que email
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}