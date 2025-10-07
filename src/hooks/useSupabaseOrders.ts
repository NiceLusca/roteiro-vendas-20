import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

interface Order {
  id: string;
  lead_id: string;
  total: number;
  status: 'Pendente' | 'Pago' | 'Reembolsado' | 'Estornado';
  data_venda: string;
  forma_pagamento?: string;
  observacao?: string;
  closer?: string;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantidade: number;
  valor: number;
  recorrencia?: 'Nenhuma' | 'Mensal' | 'Trimestral' | 'Anual';
  created_at: string;
}

export function useSupabaseOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Erro ao buscar pedidos:', ordersError);
        toast({
          title: "Erro ao carregar pedidos",
          description: ordersError.message,
          variant: "destructive"
        });
        return;
      }

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) {
        console.error('Erro ao buscar itens dos pedidos:', itemsError);
        toast({
          title: "Erro ao carregar itens dos pedidos",
          description: itemsError.message,
          variant: "destructive"
        });
        return;
      }

      setOrders(ordersData?.map(order => ({
        ...order,
        data_venda: new Date(order.data_venda).toISOString(),
        created_at: new Date(order.created_at).toISOString(),
        updated_at: new Date(order.updated_at).toISOString()
      })) || []);

      setOrderItems(itemsData?.map(item => ({
        ...item,
        created_at: new Date(item.created_at).toISOString()
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (orderData: Partial<Order> & { id?: string }, items: Partial<OrderItem>[] = []) => {
    if (!user) return null;

    try {
      const isUpdate = !!orderData.id;
      
      const orderPayload: any = {};
      
      Object.keys(orderData).forEach(key => {
        if (key !== 'id' && orderData[key as keyof typeof orderData] !== undefined) {
          orderPayload[key] = orderData[key as keyof typeof orderData];
        }
      });
      
      orderPayload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        orderPayload.created_at = new Date().toISOString();
        orderPayload.data_venda = new Date().toISOString();
      }

      let orderResult;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('orders')
          .update(orderPayload)
          .eq('id', orderData.id!)
          .select()
          .single();
        
        orderResult = { data, error };
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single();
        
        orderResult = { data, error };
      }

      if (orderResult.error) {
        console.error('Erro ao salvar pedido:', orderResult.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} pedido`,
          description: orderResult.error.message,
          variant: "destructive"
        });
        return null;
      }

      // Handle order items if provided
      if (items.length > 0 && orderResult.data) {
        const itemsPayload = items
          .filter(item => item.product_id) // Only include items with product_id
          .map(item => ({
            order_id: orderResult.data!.id,
            product_id: item.product_id!,
            quantidade: item.quantidade || 1,
            valor: item.valor || 0,
            recorrencia: item.recorrencia || 'Nenhuma',
            created_at: new Date().toISOString()
          }));

        if (itemsPayload.length > 0) {
          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsPayload);

          if (itemsError) {
            console.error('Erro ao salvar itens do pedido:', itemsError);
            toast({
              title: "Erro ao salvar itens do pedido",
              description: itemsError.message,
              variant: "destructive"
            });
          }
        }
      }

      toast({
        title: `Pedido ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Pedido foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchOrders();
      
      return orderResult.data;
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      return null;
    }
  };

  const getOrderById = (id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  };

  const getOrdersByStatus = (status: Order['status']): Order[] => {
    return orders.filter(order => order.status === status);
  };

  const getOrdersByLeadId = (leadId: string): Order[] => {
    return orders.filter(order => order.lead_id === leadId);
  };

  const getOrderItems = (orderId: string): OrderItem[] => {
    return orderItems.filter(item => item.order_id === orderId);
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  return {
    orders,
    orderItems,
    loading,
    saveOrder,
    getOrderById,
    getOrdersByStatus,
    getOrdersByLeadId,
    getOrderItems,
    refetch: fetchOrders
  };
}