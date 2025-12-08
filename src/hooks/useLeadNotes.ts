import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContextSecure';
import { toast } from 'sonner';
import { useLeadActivityLog } from './useLeadActivityLog';

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export function useLeadNotes(leadId?: string) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { logActivity } = useLeadActivityLog();

  const fetchNotes = async () => {
    if (!leadId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_notes')
        .select(`
          *,
          profiles:user_id (
            nome,
            full_name,
            email
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedData = (data || []).map((note: any) => ({
        ...note,
        user_name: note.profiles?.nome || note.profiles?.full_name || note.profiles?.email || 'Usuário',
        user_email: note.profiles?.email,
        profiles: undefined
      }));

      setNotes(mappedData);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
      toast.error('Erro ao carregar comentários');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteText: string) => {
    if (!leadId || !user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: leadId,
          user_id: user.id,
          note_text: noteText
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar atividade
      await logActivity({
        leadId,
        activityType: 'note_added',
        details: {
          note_preview: noteText.substring(0, 100),
          note_id: data.id
        }
      });

      toast.success('Comentário adicionado');
      await fetchNotes();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar comentário');
    }
  };

  const updateNote = async (noteId: string, noteText: string) => {
    try {
      const { data, error } = await supabase
        .from('lead_notes')
        .update({ note_text: noteText, updated_at: new Date().toISOString() })
        .eq('id', noteId)
        .eq('user_id', user?.id) // Apenas o criador pode editar
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => prev.map(note => note.id === noteId ? data : note));
      toast.success('Comentário atualizado');
      return data;
    } catch (error) {
      console.error('Erro ao atualizar nota:', error);
      toast.error('Erro ao atualizar comentário');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('lead_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      toast.error('Erro ao remover comentário');
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchNotes();
    }
  }, [leadId]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes
  };
}
