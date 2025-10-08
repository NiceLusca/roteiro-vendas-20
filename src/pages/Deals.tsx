import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, DollarSign, User, Calendar, TrendingUp } from 'lucide-react';
import { useSupabaseDeals } from '@/hooks/useSupabaseDeals';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { DealForm } from '@/components/forms/DealForm';
import { DealLossDialog } from '@/components/deals/DealLossDialog';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Deal, StatusDeal, DealLostReason } from '@/types/crm';
import { useLeadData } from '@/hooks/useLeadData';

export default function Deals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [lossDialogDeal, setLossDialogDeal] = useState<Deal | null>(null);
  const { saveDeal } = useLeadData();

  const { deals } = useSupabaseDeals();
  const { leads } = useSupabaseLeads();
  const { products } = useSupabaseProducts();

  const filteredDeals = deals.filter(deal => {
    const lead = leads.find(l => l.id === deal.lead_id);
    const matchesSearch = !searchTerm || 
      lead?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.closer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || deal.closer === closerFilter;
    
    return matchesSearch && matchesStatus && matchesCloser;
  });

  const uniqueClosers = [...new Set(deals.map(d => d.closer).filter(Boolean))];

  const getStatusBadgeClass = (status: StatusDeal) => {
    switch (status) {
      case 'Aberta': return 'bg-blue-100 text-blue-800';
      case 'Ganha': return 'bg-success text-success-foreground';
      case 'Perdida': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const calculateMetrics = () => {
    const total = deals.length;
    const abertas = deals.filter(d => d.status === 'Aberta').length;
    const ganhas = deals.filter(d => d.status === 'Ganha').length;
    const perdidas = deals.filter(d => d.status === 'Perdida').length;
    const valorTotal = deals.reduce((sum, d) => sum + d.valor_proposto, 0);
    const valorGanho = deals.filter(d => d.status === 'Ganha').reduce((sum, d) => sum + d.valor_proposto, 0);
    const conversao = total > 0 ? (ganhas / total) * 100 : 0;

    return { total, abertas, ganhas, perdidas, valorTotal, valorGanho, conversao };
  };

  const metrics = calculateMetrics();

  const renderDealsByStatus = (status: StatusDeal) => {
    const statusDeals = filteredDeals.filter(d => d.status === status);
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{status}</span>
            <Badge variant="secondary">{statusDeals.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusDeals.map((deal) => {
            const lead = leads.find(l => l.id === deal.lead_id);
            const product = products.find(p => p.id === deal.product_id);
            
            return (
              <div
                key={deal.id}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedDeal(deal as any)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{lead?.nome}</span>
                  <span className="font-semibold text-primary">
                    {formatCurrency(deal.valor_proposto)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{product?.nome}</span>
                  <span>{deal.closer}</span>
                </div>
                {deal.fase_negociacao && (
                  <p className="text-xs text-muted-foreground mt-1">{deal.fase_negociacao}</p>
                )}
              </div>
            );
          })}
          {statusDeals.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma negociação {status.toLowerCase()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Negociações</h1>
          <p className="text-muted-foreground">Gerencie suas oportunidades de venda</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Negociação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Negociação</DialogTitle>
            </DialogHeader>
            <DealForm
              onSave={() => {
                setIsCreateDialogOpen(false);
                // TODO: Implement save logic
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.valorTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Ganhas</p>
                <p className="text-2xl font-bold">{metrics.ganhas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-warning" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversao.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por lead ou closer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Ganha">Ganha</SelectItem>
                <SelectItem value="Perdida">Perdida</SelectItem>
              </SelectContent>
            </Select>
            <Select value={closerFilter} onValueChange={setCloserFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Closer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Closers</SelectItem>
                {uniqueClosers.map((closer) => (
                  <SelectItem key={closer} value={closer!}>
                    {closer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderDealsByStatus('Aberta')}
        {renderDealsByStatus('Ganha')}
        {renderDealsByStatus('Perdida')}
      </div>

      {/* Deal Detail Dialog */}
      {selectedDeal && (
        <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Negociação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lead</p>
                  <p className="text-sm">
                    {leads.find(l => l.id === selectedDeal.lead_id)?.nome || 'Lead não encontrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Produto</p>
                  <p className="text-sm">
                    {products.find(p => p.id === selectedDeal.produto_id)?.nome || 'Produto não encontrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Proposto</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(selectedDeal.valor_proposto)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeClass(selectedDeal.status)}>
                    {selectedDeal.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closer</p>
                  <p className="text-sm">{selectedDeal.closer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                  <p className="text-sm">{formatDate(selectedDeal.created_at)}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button size="sm">Editar</Button>
                {selectedDeal.status === 'Aberta' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        saveDeal({ ...selectedDeal, status: 'Ganha' });
                        setSelectedDeal(null);
                      }}
                    >
                      Marcar como Ganha
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setLossDialogDeal(selectedDeal);
                        setSelectedDeal(null);
                      }}
                    >
                      Marcar como Perdida
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Deal Loss Dialog */}
      {lossDialogDeal && (
        <DealLossDialog
          open={!!lossDialogDeal}
          onOpenChange={() => setLossDialogDeal(null)}
          dealId={lossDialogDeal.id}
          onConfirm={(lossReason: Omit<DealLostReason, 'id' | 'timestamp'>) => {
            // Update deal status and save loss reason
            saveDeal({ ...lossDialogDeal, status: 'Perdida' });
            // TODO: Save loss reason to database
            if (process.env.NODE_ENV === 'development') {
              console.log('Deal lost reason:', lossReason);
            }
            setLossDialogDeal(null);
          }}
        />
      )}
    </div>
  );
}