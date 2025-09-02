import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Settings, 
  Zap, 
  ArrowRight, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Activity
} from 'lucide-react';
import { useAutomationEngine } from '@/hooks/useAutomationEngine';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: string;
  conditions: string[];
  actions: string[];
  executionCount: number;
  lastExecuted?: Date;
  successRate: number;
}

interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  message: string;
  entryId?: string;
  duration: number;
}

interface WorkflowOrchestratorProps {
  pipelineId?: string;
  className?: string;
}

export function WorkflowOrchestrator({ pipelineId, className }: WorkflowOrchestratorProps) {
  const [isOrchestrationEnabled, setIsOrchestrationEnabled] = useState(true);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const { 
    automationRules, 
    isProcessing, 
    lastProcessed, 
    processAutomationRules,
    getAutomationStats 
  } = useAutomationEngine(pipelineId);
  
  const { entries } = useSupabaseLeadPipelineEntries(pipelineId);

  // Initialize workflow rules based on automation rules
  useEffect(() => {
    const workflowRules: WorkflowRule[] = automationRules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: getDescriptionForRule(rule),
      enabled: rule.active,
      trigger: getTriggerDescription(rule.trigger),
      conditions: getConditionsDescription(rule.conditions),
      actions: getActionsDescription(rule.actions),
      executionCount: Math.floor(Math.random() * 50), // Mock data
      lastExecuted: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      successRate: 85 + Math.random() * 15 // Mock success rate
    }));

    setWorkflowRules(workflowRules);
  }, [automationRules]);

  const getDescriptionForRule = (rule: any): string => {
    switch (rule.trigger) {
      case 'sla_violation':
        return 'Monitora violações de SLA e executa ações corretivas';
      case 'stage_duration':
        return 'Verifica tempo em etapa e executa automações';
      case 'checklist_complete':
        return 'Avança automaticamente quando checklist está completo';
      default:
        return 'Regra de automação personalizada';
    }
  };

  const getTriggerDescription = (trigger: string): string => {
    switch (trigger) {
      case 'sla_violation': return 'Violação de SLA';
      case 'stage_duration': return 'Tempo em etapa';
      case 'checklist_complete': return 'Checklist completo';
      default: return trigger;
    }
  };

  const getConditionsDescription = (conditions: Record<string, any>): string[] => {
    return Object.entries(conditions).map(([key, value]) => `${key}: ${value}`);
  };

  const getActionsDescription = (actions: any[]): string[] => {
    return actions.map(action => {
      switch (action.type) {
        case 'update_health': return 'Atualizar saúde do lead';
        case 'create_appointment': return 'Criar agendamento';
        case 'advance_stage': return 'Avançar etapa';
        case 'send_notification': return 'Enviar notificação';
        default: return action.type;
      }
    });
  };

  const runWorkflow = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    const startTime = Date.now();
    
    try {
      const result = await processAutomationRules();
      const duration = Date.now() - startTime;
      
      const execution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        ruleId: 'all',
        ruleName: 'Execução Manual Completa',
        timestamp: new Date(),
        status: result.success ? 'success' : result.errors.length > 0 ? 'error' : 'warning',
        message: result.success 
          ? `${result.actions.length} ação(ões) executada(s) com sucesso`
          : `Erros: ${result.errors.join(', ')}`,
        duration
      };
      
      setExecutions(prev => [execution, ...prev.slice(0, 49)]); // Keep last 50
      
    } catch (error) {
      const execution: WorkflowExecution = {
        id: `exec-${Date.now()}`,
        ruleId: 'all',
        ruleName: 'Execução Manual Completa',
        timestamp: new Date(),
        status: 'error',
        message: `Erro na execução: ${error}`,
        duration: Date.now() - startTime
      };
      
      setExecutions(prev => [execution, ...prev.slice(0, 49)]);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleRuleEnabled = (ruleId: string) => {
    setWorkflowRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const stats = getAutomationStats();
  const activeRulesCount = workflowRules.filter(rule => rule.enabled).length;
  const averageSuccessRate = workflowRules.length > 0 
    ? workflowRules.reduce((acc, rule) => acc + rule.successRate, 0) / workflowRules.length 
    : 0;

  const getStatusIcon = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'warning': return Clock;
      default: return Activity;
    }
  };

  const getStatusColor = (status: WorkflowExecution['status']) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'error': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Orquestração de Workflow
            {isOrchestrationEnabled && (
              <Badge variant="default" className="bg-success text-success-foreground">
                Ativo
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Configurações de Workflow</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orchestration">Orquestração Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Executa workflows automaticamente a cada 5 minutos
                      </p>
                    </div>
                    <Switch
                      id="orchestration"
                      checked={isOrchestrationEnabled}
                      onCheckedChange={setIsOrchestrationEnabled}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Regras de Workflow</h4>
                    {workflowRules.map(rule => (
                      <div key={rule.id} className="flex items-start justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium text-sm">{rule.name}</h5>
                            <Badge variant="outline">{rule.trigger}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rule.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Execuções: {rule.executionCount}</span>
                            <span>Taxa de sucesso: {Math.round(rule.successRate)}%</span>
                          </div>
                        </div>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleRuleEnabled(rule.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={runWorkflow}
              disabled={isRunning || isProcessing}
              size="sm"
            >
              {isRunning || isProcessing ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{activeRulesCount}</p>
            <p className="text-xs text-muted-foreground">Regras Ativas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{stats.eligibleEntries}</p>
            <p className="text-xs text-muted-foreground">Leads Elegíveis</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{executions.length}</p>
            <p className="text-xs text-muted-foreground">Execuções</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round(averageSuccessRate)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
          </div>
        </div>

        {/* Success Rate Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Taxa de Sucesso Geral</span>
            <span>{Math.round(averageSuccessRate)}%</span>
          </div>
          <Progress value={averageSuccessRate} />
        </div>

        {/* Last Execution Info */}
        {lastProcessed && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Última execução automática:</span>
            </div>
            <span className="text-sm font-medium">
              {lastProcessed.toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        <Separator />

        {/* Recent Executions */}
        <div className="space-y-3">
          <h4 className="font-medium">Execuções Recentes</h4>
          <ScrollArea className="h-48">
            {executions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma execução registrada
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {executions.map((execution, index) => {
                  const StatusIcon = getStatusIcon(execution.status);
                  
                  return (
                    <div key={execution.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <StatusIcon className={`h-4 w-4 ${getStatusColor(execution.status)}`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{execution.ruleName}</p>
                          <Badge 
                            variant={
                              execution.status === 'success' ? 'default' :
                              execution.status === 'error' ? 'destructive' : 'secondary'
                            }
                          >
                            {execution.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {execution.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {execution.timestamp.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {execution.duration}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}