import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { useSupabaseOrders } from '@/hooks/useSupabaseOrders';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { OrderForm } from '@/components/orders/OrderForm';
import { RefundDialog } from '@/components/orders/RefundDialog';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Order, StatusPedido } from '@/types/crm';
import { CRMProviderWrapper } from '@/contexts/CRMProviderWrapper';
import { useLeadData } from '@/hooks/useLeadData';

type StatusOrder = StatusPedido;

function OrdersContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refundDialogOrder, setRefundDialogOrder] = useState<Order | null>(null);
  
  const { saveOrder } = useLeadData();
  const { orders, orderItems } = useSupabaseOrders();
  const { leads } = useSupabaseLeads();
  const { products } = useSupabaseProducts();

  const filteredOrders = orders.filter(order => {
    const lead = leads.find(l => l.id === order.lead_id);
    const matchesSearch = !searchTerm || 
      lead?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.closer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || order.closer === closerFilter;
    
    return matchesSearch && matchesStatus && matchesCloser;
  });

  const uniqueClosers = [...new Set(orders.map(o => o.closer).filter(Boolean))];

  const getStatusBadgeClass = (status: StatusOrder) => {
    switch (status) {
      case 'Pago': return 'bg-success text-success-foreground';
      case 'Pendente': return 'bg-warning text-warning-foreground';
      case 'Reembolsado': return 'bg-destructive text-destructive-foreground';
      case 'Estornado': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const calculateMetrics = () => {
    const total = orders.length;
    const valorTotal = orders.reduce((sum, o) => sum + o.total, 0);
    const ticketMedio = total > 0 ? valorTotal / total : 0;
    const pagos = orders.filter(o => o.status === 'Pago').length;

    return { total, valorTotal, ticketMedio, pagos };
  };

  const metrics = calculateMetrics();

  const handleSaveOrder = (orderData: any, items: any[]) => {
    saveOrder(orderData);
    setIsCreateDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie seus pedidos e vendas</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Pedido</DialogTitle>
            </DialogHeader>
            <OrderForm
              leadId={leads[0]?.id || ""}
              leadName={leads[0]?.nome || "Cliente"}
              products={products}
              onSave={handleSaveOrder}
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
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total Pedidos</p>
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
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
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
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Pedidos Pagos</p>
                <p className="text-2xl font-bold">{metrics.pagos}</p>
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
                  placeholder="Buscar por cliente ou closer..."
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
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Reembolsado">Reembolsado</SelectItem>
                <SelectItem value="Estornado">Estornado</SelectItem>
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

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const lead = leads.find(l => l.id === order.lead_id);
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{lead?.nome || 'Lead não encontrado'}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.closer}</TableCell>
                      <TableCell>{formatDate(new Date(order.data_venda))}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order as any)}
                          >
                            Ver Detalhes
                          </Button>
                          {order.status === 'Pago' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRefundDialogOrder(order as any)}
                            >
                              Reembolsar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                  <p className="text-sm">
                    {leads.find(l => l.id === selectedOrder.lead_id)?.nome || 'Lead não encontrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusBadgeClass(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closer</p>
                  <p className="text-sm">{selectedOrder.closer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data da Venda</p>
                  <p className="text-sm">{formatDate(new Date(selectedOrder.data_venda))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                  <p className="text-sm">{selectedOrder.forma_pagamento || 'Não informado'}</p>
                </div>
              </div>
              
              {selectedOrder.observacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedOrder.observacao}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Itens do Pedido</h4>
                {orderItems.filter(item => item.order_id === selectedOrder.id).map((item) => {
                  const product = products.find(p => p.id === item.product_id);
                  return (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{product?.nome || 'Produto não encontrado'}</p>
                        <p className="text-xs text-muted-foreground">
                          Qtd: {item.quantidade} × {formatCurrency(item.valor)}
                          {item.recorrencia !== 'Nenhuma' && ` (${item.recorrencia})`}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatCurrency(item.valor * item.quantidade)}
                      </p>
                    </div>
                  );
                })}
                {orderItems.filter(item => item.order_id === selectedOrder.id).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum item encontrado</p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Refund Dialog */}
      {refundDialogOrder && (
        <RefundDialog
          open={!!refundDialogOrder}
          onOpenChange={() => setRefundDialogOrder(null)}
          order={refundDialogOrder}
          onConfirm={(refund) => {
            // TODO: Implement refund logic
            setRefundDialogOrder(null);
          }}
        />
      )}
    </div>
  );
}

export default function Orders() {
  return (
    <CRMProviderWrapper>
      <OrdersContent />
    </CRMProviderWrapper>
  );
}