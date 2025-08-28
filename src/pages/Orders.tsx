import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, DollarSign, ShoppingBag, CreditCard, RefreshCw } from 'lucide-react';
import { mockLeads, mockProducts } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { StatusPedido, Order } from '@/types/crm';
import { OrderForm } from '@/components/orders/OrderForm';
import { RefundDialog } from '@/components/orders/RefundDialog';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'order-1',
    lead_id: 'lead-5',
    closer: 'Maria Costa',
    total: 997.00,
    forma_pagamento: 'Cartão de Crédito',
    data_venda: new Date('2024-01-18T14:30:00'),
    status: 'Pago',
    observacao: 'Pagamento aprovado no Stripe'
  },
  {
    id: 'order-2',
    lead_id: 'lead-1',
    closer: 'João Santos',
    total: 2500.00,
    forma_pagamento: 'PIX',
    data_venda: new Date('2024-01-22T10:15:00'),
    status: 'Pendente',
    observacao: 'Aguardando confirmação do PIX'
  }
];

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [closerFilter, setCloserFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    order?: Order;
  }>({ open: false });

  const { logChange } = useAudit();
  const { toast } = useToast();

  const filteredOrders = mockOrders.filter(order => {
    const lead = mockLeads.find(l => l.id === order.lead_id);
    const matchesSearch = !searchTerm || 
      lead?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.closer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesCloser = closerFilter === 'all' || order.closer === closerFilter;
    
    return matchesSearch && matchesStatus && matchesCloser;
  });

  const uniqueClosers = [...new Set(mockOrders.map(o => o.closer).filter(Boolean))];

  const getStatusBadgeClass = (status: StatusPedido) => {
    switch (status) {
      case 'Pago': return 'bg-success text-success-foreground';
      case 'Pendente': return 'bg-warning text-warning-foreground';
      case 'Reembolsado': return 'bg-blue-100 text-blue-800';
      case 'Estornado': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const calculateMetrics = () => {
    const total = mockOrders.length;
    const pago = mockOrders.filter(o => o.status === 'Pago').length;
    const pendente = mockOrders.filter(o => o.status === 'Pendente').length;
    const valorTotal = mockOrders.reduce((sum, o) => sum + o.total, 0);
    const valorPago = mockOrders.filter(o => o.status === 'Pago').reduce((sum, o) => sum + o.total, 0);
    const ticketMedio = total > 0 ? valorTotal / total : 0;

    return { total, pago, pendente, valorTotal, valorPago, ticketMedio };
  };

  const metrics = calculateMetrics();

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Vendas</h1>
          <p className="text-muted-foreground">Gerencie pedidos e receitas</p>
        </div>
        <Button onClick={() => setShowOrderForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-success" />
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
              <CreditCard className="h-8 w-8 text-success" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Pedidos Pagos</p>
                <p className="text-2xl font-bold">{metrics.pago}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</p>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Closer</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const lead = mockLeads.find(l => l.id === order.lead_id);
                return (
                  <TableRow 
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell className="font-medium">{lead?.nome}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>{order.forma_pagamento}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.closer}</TableCell>
                    <TableCell>{formatDate(order.data_venda)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {order.status === 'Pago' && (
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-3 h-3 mr-1" />
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
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
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
                    {mockLeads.find(l => l.id === selectedOrder.lead_id)?.nome}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(selectedOrder.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Forma de Pagamento</p>
                  <p className="text-sm">{selectedOrder.forma_pagamento}</p>
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
                  <p className="text-sm">{formatDate(selectedOrder.data_venda)}</p>
                </div>
              </div>
              
              {selectedOrder.observacao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm">{selectedOrder.observacao}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button size="sm">Editar</Button>
                {selectedOrder.status === 'Pago' && (
                  <Button size="sm" variant="destructive">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Reembolsar
                  </Button>
                )}
                {selectedOrder.status === 'Pendente' && (
                  <Button size="sm" variant="outline">
                    Marcar como Pago
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}