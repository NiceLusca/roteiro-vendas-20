import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAutomationEngine } from '@/hooks/useAutomationEngine';
import { Play, Pause, Plus, Settings, Zap, Clock, Target, AlertTriangle } from 'lucide-react';

export function WorkflowOrchestrator() {
  const { rules, loading, createRule, updateRule, deleteRule } = useAutomationEngine();
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: {
      type: 'stage_change' as const,
      conditions: {}
    },
    actions: [],
    enabled: true,
    priority: 1
  });

  const triggerTypes = [
    { value: 'stage_change', label: 'Mudança de Etapa', icon: Target },
    { value: 'time_elapsed', label: 'Tempo Decorrido', icon: Clock },
    { value: 'field_change', label: 'Campo Alterado', icon: Settings },
    { value: 'lead_score', label: 'Score do Lead', icon: Zap },
    { value: 'inactivity', label: 'Inatividade', icon: AlertTriangle }
  ];

  const actionTypes = [
    { value: 'move_stage', label: 'Mover para Etapa' },
    { value: 'create_appointment', label: 'Criar Agendamento' },
    { value: 'send_notification', label: 'Enviar Notificação' },
    { value: 'update_field', label: 'Atualizar Campo' },
    { value: 'assign_user', label: 'Atribuir Usuário' }
  ];

  const handleCreateRule = async () => {
    try {
      await createRule(newRule);
      setIsCreating(false);
      setNewRule({
        name: '',
        trigger: { type: 'stage_change', conditions: {} },
        actions: [],
        enabled: true,
        priority: 1
      });
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando automações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orquestrador de Workflows</h2>
          <p className="text-muted-foreground">
            Gerencie automações e fluxos de trabalho do pipeline
          </p>
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Automação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Nome da Regra</Label>
                <Input
                  id="rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Ex: Auto-agendar após 3 dias"
                />
              </div>

              <div>
                <Label>Gatilho</Label>
                <Select 
                  value={newRule.trigger.type}
                  onValueChange={(value: any) => 
                    setNewRule({ 
                      ...newRule, 
                      trigger: { ...newRule.trigger, type: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="flex items-center gap-2">
                          <trigger.icon className="h-4 w-4" />
                          {trigger.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="enabled">Ativar Regra</Label>
                <Switch
                  id="enabled"
                  checked={newRule.enabled}
                  onCheckedChange={(checked) => 
                    setNewRule({ ...newRule, enabled: checked })
                  }
                />
              </div>

              <Button onClick={handleCreateRule} className="w-full">
                Criar Automação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {rules.filter(r => r.enabled).length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Regras Ativas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/20">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {rules.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total de Regras
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/20">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  85%
                </p>
                <p className="text-sm text-muted-foreground">
                  Taxa de Sucesso
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/20">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  24
                </p>
                <p className="text-sm text-muted-foreground">
                  Execuções Hoje
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Regras de Automação</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Nenhuma automação configurada
              </p>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira regra de automação para otimizar seus processos
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map(rule => {
                const TriggerIcon = triggerTypes.find(t => t.value === rule.trigger.type)?.icon || Zap;
                
                return (
                  <div 
                    key={rule.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TriggerIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Gatilho: {triggerTypes.find(t => t.value === rule.trigger.type)?.label}
                          • {rule.actions.length} ação(ões)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.enabled ? "default" : "secondary"}>
                        {rule.enabled ? 'Ativa' : 'Inativa'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRule(rule.id, { enabled: !rule.enabled })}
                      >
                        {rule.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}