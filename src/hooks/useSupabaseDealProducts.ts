import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { toast } from 'sonner';

interface DealProduct {
  id: string;
  deal_id: string;
  product_id: string;
  quantidade: number;
  valor_unitario: number | null;
  created_at: string;
  // Joined product data
  product_name?: string;
  product_price?: number;
}

export function useSupabaseDealProducts(dealId?: string) {
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchDealProducts = useCallback(async () => {
    if (!user || !dealId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deal_products')
        .select(`
          id,
          deal_id,
          product_id,
          quantidade,
          valor_unitario,
          created_at,
          products:product_id (
            nome,
            preco
          )
        `)
        .eq('deal_id', dealId);

      if (error) {
        console.error('Erro ao buscar produtos do deal:', error);
        return;
      }

      const formatted = (data || []).map((dp: any) => ({
        ...dp,
        product_name: dp.products?.nome,
        product_price: dp.products?.preco
      }));

      setDealProducts(formatted);
    } catch (error) {
      console.error('Erro ao buscar produtos do deal:', error);
    } finally {
      setLoading(false);
    }
  }, [user, dealId]);

  const addProductToDeal = async (productId: string, quantidade = 1, valorUnitario?: number) => {
    if (!user || !dealId) return null;

    try {
      const { data, error } = await supabase
        .from('deal_products')
        .upsert({
          deal_id: dealId,
          product_id: productId,
          quantidade,
          valor_unitario: valorUnitario || null
        }, {
          onConflict: 'deal_id,product_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar produto:', error);
        toast.error('Erro ao adicionar produto');
        return null;
      }

      await fetchDealProducts();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      return null;
    }
  };

  const removeProductFromDeal = async (productId: string) => {
    if (!user || !dealId) return;

    try {
      const { error } = await supabase
        .from('deal_products')
        .delete()
        .eq('deal_id', dealId)
        .eq('product_id', productId);

      if (error) {
        console.error('Erro ao remover produto:', error);
        toast.error('Erro ao remover produto');
        return;
      }

      await fetchDealProducts();
    } catch (error) {
      console.error('Erro ao remover produto:', error);
    }
  };

  const updateProductQuantity = async (productId: string, quantidade: number) => {
    if (!user || !dealId) return;

    try {
      const { error } = await supabase
        .from('deal_products')
        .update({ quantidade })
        .eq('deal_id', dealId)
        .eq('product_id', productId);

      if (error) {
        console.error('Erro ao atualizar quantidade:', error);
        return;
      }

      await fetchDealProducts();
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
    }
  };

  const setProducts = async (productIds: string[]) => {
    if (!user || !dealId) return;

    try {
      // Remove all existing products
      await supabase
        .from('deal_products')
        .delete()
        .eq('deal_id', dealId);

      // Add all selected products
      if (productIds.length > 0) {
        const inserts = productIds.map(productId => ({
          deal_id: dealId,
          product_id: productId,
          quantidade: 1
        }));

        const { error } = await supabase
          .from('deal_products')
          .insert(inserts);

        if (error) {
          console.error('Erro ao salvar produtos:', error);
          toast.error('Erro ao salvar produtos');
          return;
        }
      }

      await fetchDealProducts();
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
    }
  };

  useEffect(() => {
    if (dealId) {
      fetchDealProducts();
    } else {
      setDealProducts([]);
    }
  }, [dealId, fetchDealProducts]);

  return {
    dealProducts,
    loading,
    addProductToDeal,
    removeProductFromDeal,
    updateProductQuantity,
    setProducts,
    refetch: fetchDealProducts
  };
}
