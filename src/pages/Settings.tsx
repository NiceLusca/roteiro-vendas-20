import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings as SettingsIcon, Users, Workflow, Package, Database, Zap, Bell } from 'lucide-react';
import { PipelineManager } from '@/components/settings/PipelineManager';
import { ProductManager } from '@/components/settings/ProductManager';
import { NotificationSettingsCard } from '@/components/notifications/NotificationSettingsCard';
import { RoleManager } from '@/components/security/RoleManager';

export default function Settings() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'pipelines');
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Gerenciamento de Dados</h2>
        <p className="text-sm text-muted-foreground">Backup, exportação e auditoria de dados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2 text-primary" />
              Backup e Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça backup dos seus dados ou exporte para análise externa
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full hover:bg-primary/10">
                Exportar Leads (CSV)
              </Button>
              <Button variant="outline" className="w-full hover:bg-primary/10">
                Exportar Pipelines (JSON)
              </Button>
              <Button variant="outline" className="w-full hover:bg-primary/10">
                Backup Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
              Logs de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Visualize o histórico de alterações no sistema
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full hover:bg-primary/10"
                onClick={() => {
                  // Navigate to all logs page
                  window.location.href = '/audit-logs';
                }}
              >
                Ver Logs de Auditoria
              </Button>
              <Button variant="outline" className="w-full hover:bg-primary/10">
                Limpar Logs Antigos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Configurações Gerais</h2>
        <p className="text-sm text-muted-foreground">Configure as preferências do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Usuários e Closers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie os usuários e closers do sistema
            </p>
            <Button 
              variant="outline" 
              className="w-full hover:bg-primary/10"
              onClick={() => setIsUserManagerOpen(true)}
            >
              Gerenciar Usuários
            </Button>
          </CardContent>
        </Card>

        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2 text-primary" />
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure integrações externas (futuro)
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Breve
            </Button>
          </CardContent>
        </Card>

        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <Workflow className="w-5 h-5 mr-2 text-primary" />
              Automações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure regras de automação interna
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>

        <Card className="card-interactive relative overflow-hidden">
          <div className="card-header-gradient absolute top-0 left-0 right-0" />
          <CardHeader className="pt-4">
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" />
              Backup e Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie backups e exportação de dados
            </p>
            <Button variant="outline" className="w-full" disabled>
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Configure pipelines, produtos e preferências do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          <PipelineManager />
        </TabsContent>

        <TabsContent value="products">
          <ProductManager />
        </TabsContent>

        <TabsContent value="automation">
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">Automação em Desenvolvimento</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                O sistema de automação está sendo reconstruído para suportar maior escala. 
                Em breve você poderá configurar regras automatizadas aqui.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsCard />
        </TabsContent>

        <TabsContent value="general">
          {renderGeneralTab()}
        </TabsContent>

        <TabsContent value="data">
          {renderDataTab()}
        </TabsContent>
      </Tabs>

      {/* Dialog de Gerenciamento de Usuários */}
      <Dialog open={isUserManagerOpen} onOpenChange={setIsUserManagerOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciar Usuários e Roles
            </DialogTitle>
          </DialogHeader>
          <RoleManager />
        </DialogContent>
      </Dialog>
    </div>
  );
}