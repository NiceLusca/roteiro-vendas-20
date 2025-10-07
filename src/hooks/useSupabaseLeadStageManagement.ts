import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useSupabaseLeadStageManagement() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const advanceStage = async () => {
    toast({
      title: "Funcionalidade indisponível",
      description: "O avanço de etapas está temporariamente indisponível.",
      variant: "destructive"
    });
    return { success: false, message: "Indisponível" };
  };

  return {
    loading,
    advanceStage
  };
}
