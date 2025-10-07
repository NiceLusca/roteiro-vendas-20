import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { Order, OrderItem, Product } from '@/types/crm';
import { formatCurrency } from '@/utils/formatters';

interface OrderFormProps {
  leadId: string;
  leadName: string;
  products: Product[];
  onSave: (order: Omit<Order, 'id' | 'data_venda'>, items: Omit<OrderItem, 'id' | 'order_id'>[]) => void;
  onCancel: () => void;
}

interface OrderItemForm extends Omit<OrderItem, 'id' | 'order_id'> {
  tempId: string;
}

export function OrderForm({ leadId, leadName, products, onSave, onCancel }: OrderFormProps) {
  const [closer, setCloser] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacao, setObservacao] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([]);

  const activeProducts = products.filter(p => p.ativo);

  const addItem = () => {
    const newItem: OrderItemForm = {
      tempId: `temp-${Date.now()}`,
      product_id: '',
      valor: 0,
      quantidade: 1,
      recorrencia: 'Nenhuma'
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeItem = (tempId: string) => {
    setOrderItems(orderItems.filter(item => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof Omit<OrderItemForm, 'tempId'>, value: any) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        
        // Se mudou o produto, atualizar valor padrão
        if (field === 'product_id') {
          const product = activeProducts.find(p => p.id === value);
          if (product) {
            updatedItem.valor = product.preco_padrao;
            updatedItem.recorrencia = product.recorrencia;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.valor * item.quantidade), 0);
  };

  const handleSave = () => {
    if (!closer || !formaPagamento || orderItems.length === 0) return;

    // Validar itens
    const validItems = orderItems.filter(item => 
      item.product_id && item.valor > 0 && item.quantidade > 0
    );

    if (validItems.length === 0) return;

    const order: Omit<Order, 'id' | 'data_venda'> = {
      lead_id: leadId,
      closer,
      total: calculateTotal(),
      forma_pagamento: formaPagamento,
      status: 'pendente',
      observacao: observacao || undefined
    };

    const items: Omit<OrderItem, 'id' | 'order_id'>[] = validItems.map(({ tempId, ...item }) => item);

    onSave(order, items);
  };

  const isValid = closer && formaPagamento && orderItems.length > 0 && 
    orderItems.every(item => item.product_id && item.valor > 0 && item.quantidade > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Pedido</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="font-medium">{leadName}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Closer Responsável</Label>
              <Select value={closer} onValueChange={setCloser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar closer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="João Santos">João Santos</SelectItem>
                  <SelectItem value="Maria Costa">Maria Costa</SelectItem>
                  <SelectItem value="Ana Pereira">Ana Pereira</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre o pedido..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens do Pedido</CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orderItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum item adicionado</p>
              <Button variant="outline" size="sm" onClick={addItem} className="mt-2">
                Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item) => {
                const product = activeProducts.find(p => p.id === item.product_id);
                
                return (
                  <div key={item.tempId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item #{orderItems.indexOf(item) + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.tempId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Produto</Label>
                        <Select 
                          value={item.product_id} 
                          onValueChange={(value) => updateItem(item.tempId, 'product_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {activeProducts.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center gap-2">
                                  <span>{product.nome}</span>
                                  <Badge variant="outline">{product.tipo}</Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor Unitário</Label>
                        <Input
                          type="number"
                          placeholder="0,00"
                          value={item.valor}
                          onChange={(e) => updateItem(item.tempId, 'valor', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          placeholder="1"
                          value={item.quantidade}
                          onChange={(e) => updateItem(item.tempId, 'quantidade', parseInt(e.target.value) || 1)}
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Recorrência</Label>
                        <Select 
                          value={item.recorrencia || 'Nenhuma'} 
                          onValueChange={(value) => updateItem(item.tempId, 'recorrencia', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                            <SelectItem value="Mensal">Mensal</SelectItem>
                            <SelectItem value="Trimestral">Trimestral</SelectItem>
                            <SelectItem value="Anual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {product && (
                      <div className="bg-muted/50 rounded p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Subtotal:</span>
                          <span className="font-medium">
                            {formatCurrency(item.valor * item.quantidade)}
                            {item.recorrencia !== 'Nenhuma' && (
                              <span className="text-muted-foreground ml-1">
                                ({item.recorrencia.toLowerCase()})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total do Pedido:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!isValid}>
          Criar Pedido
        </Button>
      </div>
    </div>
  );
}