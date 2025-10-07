import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { Order } from '@/types/crm';

export function useSupabaseOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('data_pedido', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (orderData: Partial<Order> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, ...dataToSave } = orderData;
      
      if (id) {
        const { data, error } = await supabase
          .from('orders')
          .update(dataToSave as any)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar pedido:', error);
          toast({
            title: "Erro ao atualizar pedido",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Pedido atualizado",
          description: "Pedido foi atualizado com sucesso"
        });

        fetchOrders();
        return data;
      } else {
        const { data, error } = await supabase
          .from('orders')
          .insert(dataToSave as any)
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar pedido:', error);
          toast({
            title: "Erro ao criar pedido",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Pedido criado",
          description: "Pedido foi criado com sucesso"
        });

        fetchOrders();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  return {
    orders,
    loading,
    saveOrder,
    refetch: fetchOrders
  };
}
