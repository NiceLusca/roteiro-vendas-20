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

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (productData: Partial<Product> & { id?: string }) => {
    if (!user) return null;

    try {
      const { id, created_at, updated_at, ...dataToSave } = productData;
      
      if (id) {
        const { data, error } = await supabase
          .from('products')
          .update(dataToSave as any)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao atualizar produto",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Produto atualizado",
          description: `${data.nome} foi atualizado`
        });

        fetchProducts();
        return data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(dataToSave as any)
          .select()
          .single();

        if (error) {
          toast({
            title: "Erro ao criar produto",
            description: error.message,
            variant: "destructive"
          });
          return null;
        }

        toast({
          title: "Produto criado",
          description: `${data.nome} foi criado`
        });

        fetchProducts();
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      return null;
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
    refetch: fetchProducts
  };
}
