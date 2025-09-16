import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedWorkflowBuilder } from '@/components/automation/AdvancedWorkflowBuilder';
import { AIOptimizationEngine } from '@/components/automation/AIOptimizationEngine';
import { SmartNotificationCenter } from '@/components/automation/SmartNotificationCenter';
import { SmartWorkflowAutomation } from '@/components/intelligence/SmartWorkflowAutomation';

export default function Automation() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Automação Avançada</h1>
        <p className="text-muted-foreground">
          Workflows inteligentes, otimização com IA e notificações automáticas
        </p>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="ai-optimization">Otimização IA</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="legacy">Automação Simples</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6">
          <AdvancedWorkflowBuilder />
        </TabsContent>

        <TabsContent value="ai-optimization" className="space-y-6">
          <AIOptimizationEngine />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <SmartNotificationCenter />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <SmartWorkflowAutomation pipelineId="all" />
        </TabsContent>
      </Tabs>
    </div>
  );
}