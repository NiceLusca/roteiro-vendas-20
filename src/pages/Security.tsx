import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { RoleManager } from '@/components/security/RoleManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Settings, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Security() {
  const securityFeatures = [
    {
      name: 'Content Security Policy (CSP)',
      status: 'ativo',
      description: 'Previne ataques XSS e injeção de código malicioso'
    },
    {
      name: 'Row Level Security (RLS)',
      status: 'ativo', 
      description: 'Controle de acesso granular aos dados'
    },
    {
      name: 'Sanitização de Dados',
      status: 'ativo',
      description: 'Remove informações sensíveis dos logs automaticamente'
    },
    {
      name: 'Monitoramento de Atividades',
      status: 'ativo',
      description: 'Detecção automática de atividades suspeitas'
    },
    {
      name: 'Validação de Entrada',
      status: 'ativo',
      description: 'Validação rigorosa de todos os dados de entrada'
    },
    {
      name: 'Proteção Contra Senhas Vazadas',
      status: 'pendente',
      description: 'Verificação automática de senhas comprometidas'
    }
  ];

  const getStatusBadge = (status: string) => {
    return status === 'ativo' 
      ? <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 border-emerald-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      : <Badge variant="destructive" className="text-amber-600 bg-amber-50 border-amber-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Pendente
        </Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Centro de Segurança</h1>
            <p className="text-muted-foreground">
              Monitoramento, configuração e gestão de segurança do sistema
            </p>
          </div>
        </div>

        {/* Status Geral de Segurança */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Status de Segurança: Bom</AlertTitle>
          <AlertDescription>
            A maioria das medidas de segurança estão ativas. 
            Existem 1 item pendente que requer atenção administrativa.
          </AlertDescription>
        </Alert>

        {/* Resumo de Recursos de Segurança */}
        <Card>
          <CardHeader>
            <CardTitle>Recursos de Segurança Implementados</CardTitle>
            <CardDescription>
              Visão geral das medidas de segurança ativas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{feature.name}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs principais */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManager />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Segurança</CardTitle>
                <CardDescription>
                  Ajustes avançados e configurações do sistema de segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Seção de CSP */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Content Security Policy</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Política de segurança de conteúdo configurada para prevenir ataques XSS
                    </p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      default-src 'self'; script-src 'self' 'strict-dynamic'; 
                      style-src 'self' 'unsafe-inline'; connect-src 'self' https://vowcctjqbwndmdxfuqjd.supabase.co;
                    </div>
                  </div>

                  {/* Seção de RLS */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Row Level Security</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Políticas de segurança em nível de linha implementadas para todas as tabelas
                    </p>
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      16 políticas ativas
                    </Badge>
                  </div>

                  {/* Seção de Monitoramento */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Monitoramento de Atividades</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Sistema de detecção automática de atividades suspeitas
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Limite de tentativas de login</span>
                        <Badge variant="outline">5 tentativas / 15min</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Retenção de logs de segurança</span>
                        <Badge variant="outline">6 meses</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Limpeza automática de logs</span>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Alertas Pendentes */}
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ações Administrativas Pendentes</AlertTitle>
                    <AlertDescription className="mt-2">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Habilitar proteção contra senhas vazadas no painel do Supabase</li>
                        <li>Agendar upgrade do PostgreSQL para aplicar patches de segurança</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}