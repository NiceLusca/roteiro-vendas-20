import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';

import { Product } from '@/types/crm';

export function useSupabaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch products
  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setProducts((data as Product[]) || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save product
  const saveProduct = async (productData: Partial<Product> & { id?: string }) => {
    if (!user) return null;

    try {
      const isUpdate = !!productData.id;
      
      const payload: any = {};
      
      Object.keys(productData).forEach(key => {
        if (key !== 'id' && productData[key as keyof typeof productData] !== undefined) {
          payload[key] = productData[key as keyof typeof productData];
        }
      });
      
      payload.user_id = user.id;
      payload.updated_at = new Date().toISOString();
      
      if (!isUpdate) {
        payload.created_at = new Date().toISOString();
      }

      let result;
      if (isUpdate) {
        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', productData.id!)
          .select()
          .single();
        
        result = { data, error };
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select()
          .single();
        
        result = { data, error };
      }

      if (result.error) {
        console.error('Erro ao salvar produto:', result.error);
        toast({
          title: `Erro ao ${isUpdate ? 'atualizar' : 'criar'} produto`,
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: `Produto ${isUpdate ? 'atualizado' : 'criado'} com sucesso`,
        description: `Produto ${result.data.nome} foi ${isUpdate ? 'atualizado' : 'criado'}`
      });

      fetchProducts();
      
      return result.data;
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      return null;
    }
  };

  // Get product by ID
  const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
  };

  // Delete product
  const deleteProduct = async (productId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Erro ao excluir produto:', error);
        toast({
          title: "Erro ao excluir produto",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Produto excluído",
        description: "O produto foi removido com sucesso"
      });
      
      await fetchProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast({
        title: "Erro ao excluir produto", 
        description: "Erro inesperado ao excluir produto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  return {
    products,
    loading,
    saveProduct,
    deleteProduct,
    getProductById,
    refetch: fetchProducts
  };
}