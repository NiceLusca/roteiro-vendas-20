import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Package, Bell } from 'lucide-react';
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

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configure pipelines, produtos e preferências do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="pipelines" className="gap-2">
            <Package className="w-4 h-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          <PipelineManager />
        </TabsContent>

        <TabsContent value="products">
          <ProductManager />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsCard />
        </TabsContent>

        <TabsContent value="users">
          <Card className="card-interactive relative overflow-hidden">
            <div className="card-header-gradient absolute top-0 left-0 right-0" />
            <CardHeader className="pt-4">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Gerenciamento de Usuários e Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RoleManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}