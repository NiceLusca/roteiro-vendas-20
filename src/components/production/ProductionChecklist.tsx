import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'critical';
  link?: string;
}

const productionChecklist: ChecklistItem[] = [
  {
    id: 'security-rls',
    title: 'RLS Corrigido',
    description: 'Todas as políticas de segurança foram implementadas',
    status: 'completed'
  },
  {
    id: 'security-functions',
    title: 'Funções Seguras',
    description: 'search_path definido em todas as funções SECURITY DEFINER',
    status: 'completed'
  },
  {
    id: 'password-protection',
    title: 'Proteção de Senhas',
    description: 'Proteção contra senhas vazadas deve ser habilitada no Supabase',
    status: 'critical',
    link: 'https://supabase.com/dashboard/project/vowcctjqbwndmdxfuqjd/auth/providers'
  },
  {
    id: 'postgres-version',
    title: 'PostgreSQL Atualizado',
    description: 'Versão do PostgreSQL deve ser atualizada para última versão',
    status: 'critical',
    link: 'https://supabase.com/dashboard/project/vowcctjqbwndmdxfuqjd/settings/general'
  },
  {
    id: 'dashboard-metrics',
    title: 'Métricas do Dashboard',
    description: 'Cálculos reais de receita, deals e objeções implementados',
    status: 'completed'
  },
  {
    id: 'error-boundary',
    title: 'Error Boundaries',
    description: 'Sistema global de tratamento de erros implementado',
    status: 'completed'
  },
  {
    id: 'product-management',
    title: 'Gestão de Produtos',
    description: 'CRUD completo de produtos integrado com Supabase',
    status: 'pending'
  },
  {
    id: 'environment-vars',
    title: 'Variáveis de Ambiente',
    description: 'Arquivo .env.example criado para facilitar deploy',
    status: 'completed'
  },
  {
    id: 'performance-optimization',
    title: 'Otimização de Performance',
    description: 'Componentes otimizados e lazy loading implementado',
    status: 'pending'
  },
  {
    id: 'pwa-optimization',
    title: 'PWA Otimizado',
    description: 'Service Worker e manifest configurados para produção',
    status: 'pending'
  }
];

export function ProductionChecklist() {
  const completedCount = productionChecklist.filter(item => item.status === 'completed').length;
  const totalCount = productionChecklist.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const criticalItems = productionChecklist.filter(item => item.status === 'critical');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>;
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Checklist de Produção
            <Badge variant={progress === 100 ? "default" : "secondary"}>
              {completedCount}/{totalCount} ({progress}%)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalItems.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Ação Necessária</h4>
              <p className="text-sm text-red-700">
                Há {criticalItems.length} item(s) crítico(s) que devem ser corrigidos antes do deploy em produção.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {productionChecklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      {item.link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-6 w-6 p-0"
                        >
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="ml-3">
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}