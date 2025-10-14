import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadAttachment {
  id: string;
  name: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  uploader_name?: string;
  uploader_email?: string;
  created_at: string;
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
      
      // Buscar metadata do banco de dados com JOIN de profiles
      const { data, error } = await supabase
        .from('lead_attachments_metadata')
        .select(`
          *,
          profiles:uploaded_by (
            nome,
            full_name,
            email
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Gerar URLs assinadas para cada arquivo
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (attachment: any) => {
          const { data: urlData } = await supabase
            .storage
            .from('lead-attachments')
            .createSignedUrl(attachment.file_path, 3600);

          return {
            id: attachment.id,
            name: attachment.file_name,
            file_path: attachment.file_path,
            file_size: attachment.file_size,
            file_type: attachment.file_type,
            uploaded_by: attachment.uploaded_by,
            uploader_name: attachment.profiles?.nome || attachment.profiles?.full_name || 'Usuário',
            uploader_email: attachment.profiles?.email,
            created_at: attachment.created_at,
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

  const uploadAttachment = async (file: File, originalName?: string) => {
    if (!leadId) {
      toast.error('Lead ID não fornecido');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setUploading(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}_${randomString}.${fileExt}`;
      const filePath = `${leadId}/${fileName}`;

      // 1. Upload do arquivo para o storage
      const { error: uploadError } = await supabase
        .storage
        .from('lead-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // 2. Salvar metadata no banco de dados
      const { error: metadataError } = await supabase
        .from('lead_attachments_metadata')
        .insert({
          lead_id: leadId,
          file_path: filePath,
          file_name: originalName || file.name,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id
        });

      if (metadataError) {
        // Se falhar ao salvar metadata, deletar arquivo do storage
        await supabase.storage.from('lead-attachments').remove([filePath]);
        throw metadataError;
      }

      toast.success('Arquivo enviado com sucesso');
      await fetchAttachments();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    if (!leadId) return;

    try {
      // 1. Deletar metadata do banco
      const { error: dbError } = await supabase
        .from('lead_attachments_metadata')
        .delete()
        .eq('id', attachmentId);

      if (dbError) throw dbError;

      // 2. Deletar arquivo do storage
      const { error: storageError } = await supabase
        .storage
        .from('lead-attachments')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao deletar arquivo do storage:', storageError);
      }

      toast.success('Arquivo removido');
      await fetchAttachments();
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      toast.error('Erro ao remover arquivo');
    }
  };

  const downloadAttachment = async (filePath: string, displayName: string) => {
    if (!leadId) return;

    try {
      const { data, error } = await supabase
        .storage
        .from('lead-attachments')
        .download(filePath);

      if (error) throw error;

      // Criar URL temporária e iniciar download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = displayName;
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
