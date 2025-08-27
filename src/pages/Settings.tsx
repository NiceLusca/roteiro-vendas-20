import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Settings as SettingsIcon, Users, Workflow, Package } from 'lucide-react';
import { mockPipeline, mockPipelineStages, mockProducts, mockChecklistItems } from '@/data/mockData';
import { PipelineForm } from '@/components/forms/PipelineForm';
import { StageForm } from '@/components/forms/StageForm';
import { ProductForm } from '@/components/forms/ProductForm';
import { formatCurrency } from '@/utils/formatters';
import { Pipeline, PipelineStage, Product, StageChecklistItem } from '@/types/crm';

export default function Settings() {
  const [isPipelineDialogOpen, setIsPipelineDialogOpen] = useState(false);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const renderPipelinesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pipelines</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus pipelines de vendas</p>
        </div>
        <Dialog open={isPipelineDialogOpen} onOpenChange={setIsPipelineDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Pipeline</DialogTitle>
            </DialogHeader>
            <PipelineForm
              onSave={() => setIsPipelineDialogOpen(false)}
              onCancel={() => setIsPipelineDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{mockPipeline.nome}</h3>
                  {mockPipeline.primary && <Badge>Primário</Badge>}
                  {mockPipeline.ativo && <Badge variant="outline">Ativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{mockPipeline.descricao}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mockPipelineStages.length} etapas configuradas
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button size="sm" variant="outline">
                  Configurar Etapas
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStagesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Etapas do Pipeline</h2>
          <p className="text-sm text-muted-foreground">Configure as etapas do pipeline de vendas</p>
        </div>
        <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Etapa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Nova Etapa</DialogTitle>
            </DialogHeader>
            <StageForm
              onSave={() => setIsStageDialogOpen(false)}
              onCancel={() => setIsStageDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>SLA (dias)</TableHead>
                <TableHead>Próximo Passo</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPipelineStages
                .sort((a, b) => a.ordem - b.ordem)
                .map((stage) => {
                  const checklistCount = mockChecklistItems.filter(c => c.stage_id === stage.id).length;
                  return (
                    <TableRow key={stage.id}>
                      <TableCell className="font-medium">{stage.nome}</TableCell>
                      <TableCell>{stage.ordem}</TableCell>
                      <TableCell>{stage.prazo_em_dias}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{stage.proximo_passo_label}</p>
                          <Badge variant="outline" className="text-xs">
                            {stage.proximo_passo_tipo}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{checklistCount} itens</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const renderProductsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Produtos</h2>
          <p className="text-sm text-muted-foreground">Configure os produtos disponíveis para venda</p>
        </div>
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
            </DialogHeader>
            <ProductForm
              onSave={() => setIsProductDialogOpen(false)}
              onCancel={() => setIsProductDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Recorrência</TableHead>
                <TableHead>Preço Padrão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>{product.tipo}</TableCell>
                  <TableCell>{product.recorrencia}</TableCell>
                  <TableCell className="font-semibold text-primary">
                    {formatCurrency(product.preco_padrao)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.ativo ? 'default' : 'secondary'}>
                      {product.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="general">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          {renderPipelinesTab()}
        </TabsContent>

        <TabsContent value="stages">
          {renderStagesTab()}
        </TabsContent>

        <TabsContent value="products">
          {renderProductsTab()}
        </TabsContent>

        <TabsContent value="general">
          {renderGeneralTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}