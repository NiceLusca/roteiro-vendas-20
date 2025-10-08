import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadAttachment {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any>;
  publicUrl?: string;
}

export function useLeadAttachments(leadId?: string) {
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async () => {
    if (!leadId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .storage
        .from('lead-attachments')
        .list(leadId, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Obter URLs públicas para cada arquivo
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = await supabase
            .storage
            .from('lead-attachments')
            .createSignedUrl(`${leadId}/${file.name}`, 3600); // URL válida por 1 hora

          return {
            ...file,
            publicUrl: urlData?.signedUrl
          };
        })
      );

      setAttachments(attachmentsWithUrls);
    } catch (error) {
      console.error('Erro ao buscar anexos:', error);
      toast.error('Erro ao carregar anexos');
    } finally {
      setLoading(false);
    }
  };

  const uploadAttachment = async (file: File) => {
    if (!leadId) {
      toast.error('Lead ID não fornecido');
      return;
    }

    try {
      setUploading(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${leadId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('lead-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      toast.success('Arquivo enviado com sucesso');
      await fetchAttachments();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (fileName: string) => {
    if (!leadId) return;

    try {
      const { error } = await supabase
        .storage
        .from('lead-attachments')
        .remove([`${leadId}/${fileName}`]);

      if (error) throw error;

      toast.success('Arquivo removido');
      await fetchAttachments();
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const downloadAttachment = async (fileName: string) => {
    if (!leadId) return;

    try {
      const { data, error } = await supabase
        .storage
        .from('lead-attachments')
        .download(`${leadId}/${fileName}`);

      if (error) throw error;

      // Criar URL temporária e iniciar download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  useEffect(() => {
    if (leadId) {
      fetchAttachments();
    }
  }, [leadId]);

  return {
    attachments,
    loading,
    uploading,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    refetch: fetchAttachments
  };
}
