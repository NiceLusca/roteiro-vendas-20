import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { Order, OrderItem, Product } from '@/types/crm';
import { formatCurrency } from '@/utils/formatters';

interface OrderFormProps {
  leadId: string;
  leadName: string;
  products: Product[];
  onSave: (order: Omit<Order, 'id'>, items: Omit<OrderItem, 'id'>[]) => void;
  onCancel: () => void;
}

interface OrderItemForm {
  tempId: string;
  produto_id?: string;
  preco_unitario: number;
  quantidade: number;
  recorrencia?: string;
}

export function OrderForm({ leadId, leadName, products, onSave, onCancel }: OrderFormProps) {
  const [closer, setCloser] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([
    { tempId: '1', produto_id: '', preco_unitario: 0, quantidade: 1, recorrencia: '' }
  ]);

  const activeProducts = products.filter(p => p.ativo);

  const addItem = () => {
    const newItem: OrderItemForm = {
      tempId: Date.now().toString(),
      produto_id: '',
      preco_unitario: 0,
      quantidade: 1,
      recorrencia: ''
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeItem = (tempId: string) => {
    setOrderItems(orderItems.filter(item => item.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof OrderItemForm, value: any) => {
    setOrderItems(orderItems.map(item => {
      if (item.tempId === tempId) {
        if (field === 'produto_id' && value) {
          const selectedProduct = products.find(p => p.id === value);
          if (selectedProduct) {
            return { ...item, produto_id: value, preco_unitario: selectedProduct.preco };
          }
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = (): number => {
    return orderItems.reduce((sum, item) => {
      if (item.produto_id) {
        return sum + (item.preco_unitario * item.quantidade);
      }
      return sum;
    }, 0);
  };

  const handleSave = async () => {
    const orderData = {
      lead_id: leadId,
      closer,
      valor_total: calculateTotal(),
      status_pagamento: 'pendente' as const,
      data_pedido: new Date().toISOString(),
      deal_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const validItems = orderItems
      .filter(item => item.produto_id)
      .map(({ tempId, ...item }) => ({
        produto_id: item.produto_id,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade || 1,
        recorrencia: item.recorrencia,
        pedido_id: '',
        created_at: new Date().toISOString()
      }));

    await onSave(orderData as any, validItems as any);
  };

  const isValid = closer && orderItems.length > 0 && 
    orderItems.some(item => item.produto_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Novo Pedido - {leadName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do pedido */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Closer</Label>
              <Input
                value={closer}
                onChange={(e) => setCloser(e.target.value)}
                placeholder="Nome do closer"
              />
            </div>
          </div>

          {/* Itens do pedido */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Itens do Pedido</Label>
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {orderItems.map((item, index) => (
              <Card key={item.tempId} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label>Produto</Label>
                    <Select
                      value={item.produto_id || ''}
                      onValueChange={(value) => updateItem(item.tempId, 'produto_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.nome} - R$ {product.preco}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => updateItem(item.tempId, 'quantidade', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label>Preço Unitário</Label>
                    <Input
                      type="number"
                      value={item.preco_unitario}
                      onChange={(e) => updateItem(item.tempId, 'preco_unitario', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Subtotal: R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                  </div>
                  {orderItems.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.tempId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total do Pedido</div>
              <div className="text-2xl font-bold">{formatCurrency(calculateTotal())}</div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid}
            >
              Criar Pedido
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
