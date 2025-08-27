import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Users, Workflow, Package, Database } from 'lucide-react';
import { PipelineManager } from '@/components/settings/PipelineManager';
import { ProductManager } from '@/components/settings/ProductManager';

export default function Settings() {

  const renderDataTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Gerenciamento de Dados</h2>
        <p className="text-sm text-muted-foreground">Backup, exportação e auditoria de dados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Backup e Exportação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Faça backup dos seus dados ou exporte para análise externa
            </p>
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                Exportar Leads (CSV)
              </Button>
              <Button variant="outline" className="w-full">
                Exportar Pipelines (JSON)
              </Button>
              <Button variant="outline" className="w-full">
                Backup Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
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
                className="w-full"
                onClick={() => {
                  // Importar e abrir dialog de auditoria
                  import('@/components/audit/AuditLogsDialog').then(({ AuditLogsDialog }) => {
                    // Implementar abertura do dialog
                    console.log('Abrir logs de auditoria');
                  });
                }}
              >
                Ver Logs de Auditoria
              </Button>
              <Button variant="outline" className="w-full">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Usuários e Closers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gerencie os usuários e closers do sistema
            </p>
            <Button variant="outline" className="w-full">
              Gerenciar Usuários
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <SettingsIcon className="w-5 h-5 mr-2" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Workflow className="w-5 h-5 mr-2" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
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
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-muted-foreground">Configure pipelines, produtos e preferências do sistema</p>
      </div>

      <Tabs defaultValue="pipelines" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          <PipelineManager />
        </TabsContent>

        <TabsContent value="products">
          <ProductManager />
        </TabsContent>

        <TabsContent value="general">
          {renderGeneralTab()}
        </TabsContent>

        <TabsContent value="data">
          {renderDataTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}