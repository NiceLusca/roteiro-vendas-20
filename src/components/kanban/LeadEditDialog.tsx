import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Lead, Appointment } from '@/types/crm';
import { PipelineDisplayConfig } from '@/types/pipelineDisplay';
import { useLeadNotes } from '@/hooks/useLeadNotes';
import { useLeadAttachments } from '@/hooks/useLeadAttachments';
import { useLeadSave } from '@/hooks/useLeadSave';
import { useLeadResponsibles } from '@/hooks/useLeadResponsibles';
import { useLeadActivityLog } from '@/hooks/useLeadActivityLog';
import { useSupabaseAppointments } from '@/hooks/useSupabaseAppointments';
import { useSupabaseDeals } from '@/hooks/useSupabaseDeals';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { useSupabaseDealProducts } from '@/hooks/useSupabaseDealProducts';
import { useQueryClient } from '@tanstack/react-query';
import { ResponsibleSelector } from '@/components/leads/ResponsibleSelector';
import { LeadActivityTimeline } from '@/components/timeline/LeadActivityTimeline';
import { NoteContent } from './NoteContent';
import { 
  User, 
  Mail, 
  Phone, 
  Paperclip, 
  Upload, 
  Download, 
  Trash2,
  Send,
  Image as ImageIcon,
  Users,
  History,
  Pencil,
  X,
  Check,
  ArrowRightLeft,
  Tag,
  Star,
  Calendar as CalendarIcon,
  DollarSign,
  Clock,
  Loader2,
  RefreshCw,
  Check as CheckIcon,
  Package,
  MapPin,
  Plus
} from 'lucide-react';
import { TagPopover } from './TagPopover';
import { useLeadTags } from '@/hooks/useLeadTags';
import { formatWhatsApp } from '@/utils/formatters';
import { linkifyText } from '@/utils/linkify';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onUpdate?: () => void;
  // Props para transferência de etapa
  currentStageName?: string;
  onJumpToStage?: () => void;
  // ID do entry no pipeline atual (para filtrar histórico)
  pipelineEntryId?: string;
  // Config de exibição do pipeline (controla quais abas aparecem)
  displayConfig?: PipelineDisplayConfig;
  // Aba inicial (para abrir diretamente em uma aba específica)
  initialTab?: 'info' | 'responsibles' | 'comments' | 'appointments' | 'deals' | 'attachments' | 'history';
}

export function LeadEditDialog({ open, onOpenChange, lead, onUpdate, currentStageName, onJumpToStage, pipelineEntryId, displayConfig, initialTab }: LeadEditDialogProps) {
  const [formData, setFormData] = useState({
    nome: lead.nome,
    whatsapp: lead.whatsapp || '',
    email: lead.email || '',
    segmento: lead.segmento || ''
  });
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const [commentPasteEnabled, setCommentPasteEnabled] = useState(false);
  const [commentImages, setCommentImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadingCommentImage, setUploadingCommentImage] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  // Estados para agendamento
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [appointmentDuration, setAppointmentDuration] = useState('60');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);

  // Estados para origem do lead
  const [origens, setOrigens] = useState<string[]>([]);
  const [selectedOrigem, setSelectedOrigem] = useState<string>(lead.origem || '');
  const [newOrigem, setNewOrigem] = useState('');
  const [addingOrigem, setAddingOrigem] = useState(false);
  const [savingOrigem, setSavingOrigem] = useState(false);

  // Estados para deal
  const [dealValor, setDealValor] = useState('');
  const [vendaRecorrente, setVendaRecorrente] = useState(false); // Checkbox para estatísticas
  const [vendaConfirmada, setVendaConfirmada] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [savingDeal, setSavingDeal] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  // Buscar nome do usuário atual para o histórico
  useEffect(() => {
    const fetchUserName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, full_name')
          .eq('user_id', user.id)
          .single();
        setCurrentUserName(profile?.nome || profile?.full_name || 'Usuário');
      }
    };
    fetchUserName();
  }, []);

  const { notes, loading: notesLoading, addNote, updateNote, deleteNote } = useLeadNotes(lead.id);
  const { 
    attachments, 
    loading: attachmentsLoading, 
    uploading, 
    uploadAttachment, 
    deleteAttachment,
    downloadAttachment 
  } = useLeadAttachments(lead.id);
  const { saveLead } = useLeadSave();
  const { responsibles, history } = useLeadResponsibles(lead.id, pipelineEntryId);
  const { activities, logActivity } = useLeadActivityLog(lead.id, pipelineEntryId);
  const { getLeadTags, removeTagFromLead } = useLeadTags();
  const [leadTags, setLeadTags] = useState<{ id: string; nome: string; cor: string | null }[]>([]);

  // Hooks para agendamentos, deals e produtos
  const { appointments, saveAppointment, deleteAppointment, getUpcomingAppointments } = useSupabaseAppointments();
  const { deals, saveDeal, getDealsByLeadId } = useSupabaseDeals();
  const { products } = useSupabaseProducts();
  const queryClient = useQueryClient();

  // Filtrar dados do lead atual
  const leadAppointments = appointments.filter(a => a.lead_id === lead.id);
  const leadDeals = getDealsByLeadId(lead.id);
  const existingDeal = leadDeals[0]; // Pegar o deal mais recente
  
  // Hook para produtos do deal (só ativa quando há deal)
  const { dealProducts, setProducts: setDealProducts } = useSupabaseDealProducts(existingDeal?.id);

  // Sincronizar deal existente quando abrir
  useEffect(() => {
    if (open && existingDeal) {
      setDealValor(formatCurrencyInput(String(Math.round(existingDeal.valor_proposto * 100))));
      setVendaRecorrente((existingDeal as any).recorrente === true);
      setVendaConfirmada(existingDeal.status === 'Ganha');
      // Produtos são carregados pelo hook useSupabaseDealProducts
    } else if (open) {
      setDealValor('');
      setVendaRecorrente(false);
      setVendaConfirmada(false);
      setSelectedProductIds([]);
    }
  }, [open, existingDeal]);
  
  // Sincronizar produtos selecionados com os do deal
  useEffect(() => {
    if (dealProducts.length > 0) {
      setSelectedProductIds(dealProducts.map(dp => dp.product_id));
    }
  }, [dealProducts]);

  // Helper para formatar moeda
  const formatCurrencyInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Handler para salvar agendamento
  const handleSaveAppointment = async () => {
    if (!appointmentDate) {
      toast.error('Selecione uma data');
      return;
    }

    try {
      setSavingAppointment(true);
      
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const startAt = new Date(appointmentDate);
      startAt.setHours(hours, minutes, 0, 0);
      
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + parseInt(appointmentDuration));

      await saveAppointment({
        lead_id: lead.id,
        titulo: `Sessão com ${lead.nome}`,
        data_hora: startAt,
        start_at: startAt,
        end_at: endAt,
        duracao_minutos: parseInt(appointmentDuration),
        status: 'agendado' as any,  // O banco usa lowercase
        notas: appointmentNotes || undefined
      });
      setAppointmentDuration('60');
      setAppointmentNotes('');
      
      toast.success('Agendamento criado com sucesso!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setSavingAppointment(false);
    }
  };

  // Handler para deletar agendamento
  const handleDeleteAppointment = async (apt: Appointment) => {
    if (!confirm(`Tem certeza que deseja deletar o agendamento "${apt.titulo}"?\n\nEsta ação será registrada no histórico.`)) {
      return;
    }

    try {
      setDeletingAppointmentId(apt.id);
      
      // Registrar no histórico ANTES de deletar
      await logActivity({
        leadId: lead.id,
        pipelineEntryId: pipelineEntryId,
        activityType: 'appointment_deleted',
        details: {
          titulo: apt.titulo,
          data_hora: apt.start_at || apt.data_hora,
          status: apt.status
        }
      });

      const success = await deleteAppointment(apt.id);
      if (success) {
        onUpdate?.();
      }
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      toast.error('Erro ao deletar agendamento');
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  // Handler para salvar deal
  const handleSaveDeal = async () => {
    const parsedValor = parseFloat(dealValor.replace(/\D/g, '')) / 100 || 0;
    
    // Valor é obrigatório - preenchido pelo closer
    if (parsedValor <= 0) {
      toast.error('Informe o valor da venda');
      return;
    }

    try {
      setSavingDeal(true);

      // O status é baseado no checkbox de venda confirmada
      const status = vendaConfirmada ? 'ganho' : 'aberto';

      const result = await saveDeal({
        ...(existingDeal?.id ? { id: existingDeal.id } : {}),
        lead_id: lead.id,
        valor_proposto: parsedValor,
        recorrente: vendaRecorrente, // Boolean para estatísticas
        status: status as any,
        data_fechamento: vendaConfirmada ? new Date().toISOString() : null
      });

      // Salvar produtos associados ao deal
      if (result?.id && selectedProductIds.length > 0) {
        await setDealProducts(selectedProductIds);
      }

      // SE VENDA CONFIRMADA: criar/atualizar order com closer do responsável principal
      if (vendaConfirmada && result?.id) {
        // Buscar responsável principal para usar como closer
        const { data: primaryResp } = await supabase
          .from('lead_responsibles')
          .select('profiles(nome, full_name)')
          .eq('lead_id', lead.id)
          .eq('is_primary', true)
          .maybeSingle();
        
        const closerName = (primaryResp?.profiles as any)?.nome 
          || (primaryResp?.profiles as any)?.full_name 
          || 'Não atribuído';
        
        // Verificar se já existe order para este deal
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('id')
          .eq('deal_id', result.id)
          .maybeSingle();
        
        if (existingOrder?.id) {
          // Atualizar order existente
          await supabase
            .from('orders')
            .update({
              valor_total: parsedValor,
              closer: closerName,
              status_pagamento: 'pago',
              data_venda: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingOrder.id);
        } else {
          // Criar nova order
          await supabase
            .from('orders')
            .insert({
              lead_id: lead.id,
              deal_id: result.id,
              valor_total: parsedValor,
              closer: closerName,
              status_pagamento: 'pago',
              data_venda: new Date().toISOString()
            });
        }
      }

      // Invalidar cache de deals para forçar atualização no Kanban
      queryClient.invalidateQueries({ queryKey: ['pipeline-deals'] });

      toast.success(existingDeal ? 'Negociação atualizada!' : 'Negociação criada!');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar deal:', error);
      toast.error('Erro ao salvar negociação');
    } finally {
      setSavingDeal(false);
    }
  };
  
  // Toggle de produto selecionado
  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Buscar tags do lead
  useEffect(() => {
    const fetchTags = async () => {
      const tags = await getLeadTags(lead.id);
      setLeadTags(tags);
    };
    if (open) {
      fetchTags();
    }
  }, [lead.id, open, getLeadTags]);

  // Buscar origens existentes
  useEffect(() => {
    const fetchOrigens = async () => {
      const { data } = await supabase
        .from('leads')
        .select('origem')
        .not('origem', 'is', null);
      
      const unique = [...new Set(data?.map(d => d.origem).filter(Boolean) as string[])];
      setOrigens(unique.sort());
    };
    if (open) {
      fetchOrigens();
      setSelectedOrigem(lead.origem || '');
    }
  }, [open, lead.origem]);

  // Handler para salvar origem
  const handleSaveOrigem = async (origemValue?: string) => {
    const origemToSave = origemValue || newOrigem.trim() || selectedOrigem;
    if (!origemToSave) return;
    
    // Não salvar se for o mesmo valor atual
    if (origemToSave === lead.origem && !newOrigem.trim()) return;
    
    try {
      setSavingOrigem(true);
      const result = await saveLead({
        id: lead.id,
        origem: origemToSave
      }, { silent: true }); // Silent to avoid duplicate toasts
      
      if (!result) {
        toast.error('Erro ao salvar origem - verifique se está logado');
        return;
      }
      
      // Adicionar nova origem à lista se for nova
      if (newOrigem.trim() && !origens.includes(newOrigem.trim())) {
        setOrigens(prev => [...prev, newOrigem.trim()].sort());
      }
      
      setSelectedOrigem(origemToSave);
      setNewOrigem('');
      setAddingOrigem(false);
      toast.success('Origem atualizada');
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao salvar origem:', error);
      toast.error('Erro ao salvar origem');
    } finally {
      setSavingOrigem(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromLead(lead.id, tagId);
    setLeadTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleTagsChange = async () => {
    const tags = await getLeadTags(lead.id);
    setLeadTags(tags);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedLead = await saveLead({
        id: lead.id,
        ...formData
      });
      
      if (updatedLead) {
        toast.success('Lead atualizado com sucesso');
        // Atualizar o lead no formData para refletir mudanças imediatas
        onUpdate?.();
        onOpenChange(false);
      }
    } catch (error) {
      logger.error('Erro ao salvar lead', error as Error, { feature: 'lead-edit', metadata: { leadId: lead.id } });
      toast.error('Erro ao atualizar lead');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() && commentImages.length === 0) return;
    
    try {
      setUploadingCommentImage(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }
      
      // Upload images and get file paths
      const imagePaths: string[] = [];
      for (const img of commentImages) {
        const fileExt = img.file.name.split('.').pop();
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${timestamp}_${randomString}.${fileExt}`;
        const filePath = `${lead.id}/${fileName}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase
          .storage
          .from('lead-attachments')
          .upload(filePath, img.file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        
        // Save metadata
        await supabase
          .from('lead_attachments_metadata')
          .insert({
            lead_id: lead.id,
            file_path: filePath,
            file_name: img.file.name,
            file_size: img.file.size,
            file_type: img.file.type,
            uploaded_by: user.id
          });
        
        imagePaths.push(filePath);
      }
      
      // Build note text with image markers (using special format: [[IMG:path]])
      let noteText = newNote.trim();
      if (imagePaths.length > 0) {
        const imageMarkers = imagePaths.map(path => `[[IMG:${path}]]`).join('\n');
        noteText = noteText ? `${noteText}\n\n${imageMarkers}` : imageMarkers;
      }
      
      if (noteText) {
        await addNote(noteText);
      }
      
      // Clear state
      setNewNote('');
      commentImages.forEach(img => URL.revokeObjectURL(img.preview));
      setCommentImages([]);
    } catch (error) {
      console.error('Error adding note with images:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setUploadingCommentImage(false);
    }
  };

  const handleStartEdit = (noteId: string, noteText: string) => {
    setEditingNoteId(noteId);
    setEditingNoteText(noteText);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingNoteText.trim()) return;
    
    await updateNote(editingNoteId, editingNoteText);
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Tem certeza que deseja apagar este comentário?')) {
      await deleteNote(noteId);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 20MB');
      return;
    }

    await uploadAttachment(file);
  };

  // Listener para Ctrl+V quando a aba de anexos estiver ativa
  useEffect(() => {
    if (!open || !pasteEnabled) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Verificar se é uma imagem
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          
          if (blob) {
            // Gerar nome baseado no timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `print-${timestamp}.png`, { type: 'image/png' });
            
            toast.info('Fazendo upload do print...');
            await uploadAttachment(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [open, pasteEnabled, uploadAttachment]);

  // Listener para Ctrl+V quando a aba de comentários estiver ativa
  useEffect(() => {
    if (!open || !commentPasteEnabled) return;

    const handleCommentPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `comment-img-${timestamp}.png`, { type: 'image/png' });
            const preview = URL.createObjectURL(blob);
            
            setCommentImages(prev => [...prev, { file, preview }]);
            toast.success('Imagem adicionada ao comentário');
          }
        }
      }
    };

    document.addEventListener('paste', handleCommentPaste);
    return () => document.removeEventListener('paste', handleCommentPaste);
  }, [open, commentPasteEnabled]);

  const removeCommentImage = (index: number) => {
    setCommentImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const isImage = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Lead: {lead.nome}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab || "comments"} className="w-full">
          {/* Renderização condicional das abas baseado no displayConfig do pipeline */}
          {(() => {
            const showAppointments = displayConfig?.show_appointments !== false;
            const showDeals = displayConfig?.show_deals === true;
            // Contar colunas dinamicamente
            const colCount = 5 + (showAppointments ? 1 : 0) + (showDeals ? 1 : 0);
            
            return (
              <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}>
                <TabsTrigger value="info" className="text-xs px-2">Info</TabsTrigger>
                <TabsTrigger value="responsibles" className="text-xs px-2">
                  Resp.
                  {responsibles.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                      {responsibles.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs px-2">
                  Comentários
                  {notes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                      {notes.length}
                    </Badge>
                  )}
                </TabsTrigger>
                {showAppointments && (
                  <TabsTrigger value="appointments" className="text-xs px-2">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Agenda
                    {leadAppointments.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        {leadAppointments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                {showDeals && (
                  <TabsTrigger value="deals" className="text-xs px-2">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Vendas
                    {leadDeals.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        {leadDeals.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                )}
                <TabsTrigger value="attachments" className="text-xs px-2">
                  Anexos
                  {attachments.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                      {attachments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs px-2">
                  <History className="h-3 w-3 mr-1" />
                  Histórico
                </TabsTrigger>
              </TabsList>
            );
          })()}

          {/* Tab de Informações */}
          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Score e Tags em destaque */}
            <div className="grid grid-cols-2 gap-4">
              {/* Score Badge */}
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Lead Score</p>
                  <Badge className="bg-primary text-primary-foreground font-bold text-lg px-3 py-1 mt-1">
                    {lead.lead_score || 0}
                  </Badge>
                </div>
              </div>

              {/* Tags Section */}
              <div className="p-3 bg-muted/30 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Tags</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {leadTags.map(tag => (
                    <Badge 
                      key={tag.id}
                      style={{ 
                        backgroundColor: `${tag.cor || '#3b82f6'}cc`, 
                        color: 'white' 
                      }}
                      className="text-xs px-2 py-0.5 font-medium flex items-center gap-1"
                    >
                      {tag.nome}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:opacity-70" 
                        onClick={() => handleRemoveTag(tag.id)}
                      />
                    </Badge>
                  ))}
                  <TagPopover 
                    leadId={lead.id} 
                    currentTags={leadTags} 
                    onTagsChange={handleTagsChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Input
                  id="segmento"
                  value={formData.segmento}
                  onChange={(e) => setFormData({ ...formData, segmento: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </TabsContent>

          {/* Tab de Responsáveis */}
          <TabsContent value="responsibles" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Gerencie os responsáveis por este lead</span>
              </div>
              
              <ResponsibleSelector 
                leadId={lead.id} 
                pipelineEntryId={pipelineEntryId}
                performerName={currentUserName}
              />
              
              {/* Histórico de responsabilidade */}
              {history.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Histórico de Atribuições</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.map((entry) => (
                      <div key={entry.id} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground/70">
                          {new Date(entry.created_at).toLocaleString('pt-BR')}
                        </span>
                        <span>•</span>
                        <span>
                          {entry.action === 'assigned' && `${entry.user_name} foi atribuído`}
                          {entry.action === 'removed' && `${entry.user_name} foi removido`}
                          {entry.action === 'primary_changed' && `${entry.user_name} tornou-se responsável principal`}
                        </span>
                        {entry.performed_by_name && (
                          <>
                            <span>por</span>
                            <span className="font-medium">{entry.performed_by_name}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab de Comentários */}
          <TabsContent value="comments" className="space-y-4 mt-4">
            {/* Botão de transferir etapa */}
            {onJumpToStage && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Etapa atual: {currentStageName || 'Não definida'}</p>
                      <p className="text-xs text-muted-foreground">Transferir para outra etapa do pipeline</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onJumpToStage}
                    className="shrink-0"
                  >
                    Transferir Etapa
                  </Button>
                </div>
              </div>
            )}

            <div 
              className="space-y-2"
              onFocus={() => setCommentPasteEnabled(true)}
              onBlur={(e) => {
                // Only disable if focus is leaving the container entirely
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setCommentPasteEnabled(false);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <Label>Adicionar Comentário</Label>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Ctrl+V para colar imagem
                </span>
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite seu comentário..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* Preview das imagens coladas */}
              {commentImages.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted/50 rounded-lg">
                  {commentImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img.preview} 
                        alt={`Preview ${index + 1}`}
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeCommentImage(index)}
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                onClick={handleAddNote} 
                disabled={(!newNote.trim() && commentImages.length === 0) || uploadingCommentImage}
                className="w-full"
              >
                {uploadingCommentImage ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Adicionar Comentário
                    {commentImages.length > 0 && ` (${commentImages.length} imagem${commentImages.length > 1 ? 's' : ''})`}
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notesLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum comentário ainda
                </p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg space-y-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-primary">
                        {note.user_name || 'Usuário'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.created_at).toLocaleString('pt-BR')}
                        </span>
                        {editingNoteId !== note.id && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleStartEdit(note.id, note.note_text)}
                              title="Editar"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteNote(note.id)}
                              title="Apagar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editingNoteText.trim()}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <NoteContent text={note.note_text} />
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab de Anexos */}
          <TabsContent 
            value="attachments" 
            className="space-y-4 mt-4"
            onFocus={() => setPasteEnabled(true)}
            onBlur={() => setPasteEnabled(false)}
            tabIndex={-1}
          >
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload de Arquivo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" disabled={uploading}>
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 20MB por arquivo • Pressione Ctrl+V para colar prints
              </p>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {attachmentsLoading ? (
                <p className="text-center text-muted-foreground">Carregando...</p>
              ) : attachments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum anexo ainda
                </p>
              ) : (
                attachments.map((attachment) => (
                  <div 
                    key={attachment.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isImage(attachment.name) ? (
                        attachment.publicUrl ? (
                          <img 
                            src={attachment.publicUrl} 
                            alt={attachment.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )
                      ) : (
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(2)} KB` : 'Tamanho desconhecido'}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            {attachment.uploader_name || 'Usuário'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(attachment.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadAttachment(attachment.file_path, attachment.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAttachment(attachment.id, attachment.file_path)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab de Agendamentos */}
          <TabsContent value="appointments" className="space-y-4 mt-4">
            {/* Seletor de Origem do Lead */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Origem do Lead
              </h4>
              
              <div className="flex gap-2">
                <Select 
                  value={selectedOrigem} 
                  onValueChange={(v) => {
                    setSelectedOrigem(v);
                    setAddingOrigem(false);
                    setNewOrigem('');
                    // Salvar automaticamente ao selecionar uma origem diferente
                    if (v !== lead.origem) {
                      handleSaveOrigem(v);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {origens.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setAddingOrigem(!addingOrigem)}
                  title="Adicionar nova origem"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {addingOrigem && (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Nova origem..." 
                    value={newOrigem}
                    onChange={(e) => setNewOrigem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveOrigem()}
                  />
                </div>
              )}
              
              <Button 
                onClick={() => handleSaveOrigem()} 
                disabled={(!selectedOrigem && !newOrigem.trim()) || savingOrigem}
                className="w-full"
                variant="secondary"
              >
                {savingOrigem ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Salvar Origem
                  </>
                )}
              </Button>
            </div>

            {/* Formulário de novo agendamento */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Novo Agendamento
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {appointmentDate 
                          ? format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })
                          : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={appointmentDate}
                        onSelect={setAppointmentDate}
                        locale={ptBR}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário *</Label>
                  <Input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duração</Label>
                  <Select value={appointmentDuration} onValueChange={setAppointmentDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="90">1h 30min</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    placeholder="Notas do agendamento..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveAppointment} 
                disabled={!appointmentDate || savingAppointment}
                className="w-full"
              >
                {savingAppointment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Criar Agendamento
                  </>
                )}
              </Button>
            </div>

            {/* Lista de agendamentos existentes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Agendamentos ({leadAppointments.length})</h4>
              {leadAppointments.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhum agendamento
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leadAppointments.map((apt) => (
                    <div key={apt.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {format(new Date(apt.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {apt.titulo} • {apt.duracao_minutos || 60}min
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          apt.status === 'Agendado' ? 'default' :
                          apt.status === 'Realizado' ? 'secondary' :
                          'outline'
                        }>
                          {apt.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAppointment(apt)}
                          disabled={deletingAppointmentId === apt.id}
                          title="Deletar agendamento"
                        >
                          {deletingAppointmentId === apt.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab de Vendas/Deals */}
          <TabsContent value="deals" className="space-y-4 mt-4">
            {/* Formulário de deal */}
            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                {existingDeal ? 'Editar Negociação' : 'Nova Negociação'}
              </h4>

              {/* Checkbox de venda confirmada */}
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  vendaConfirmada 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => setVendaConfirmada(!vendaConfirmada)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                    vendaConfirmada 
                      ? 'bg-primary border-primary' 
                      : 'border-muted-foreground/50'
                  }`}>
                    {vendaConfirmada && <CheckIcon className="h-4 w-4 text-primary-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium">Venda Confirmada</p>
                    <p className="text-xs text-muted-foreground">
                      Marque quando a venda for fechada para contabilizar nas estatísticas
                    </p>
                  </div>
                </div>
              </div>

              {/* Seletor de produtos */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produtos Vendidos
                </Label>
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {products.length === 0 ? (
                    <div className="p-3 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Nenhum produto cadastrado</p>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => window.open('/settings?tab=products', '_blank')}
                        className="h-auto p-0"
                      >
                        Cadastrar produtos →
                      </Button>
                    </div>
                  ) : (
                    products.filter(p => p.ativo).map(product => (
                      <div 
                        key={product.id}
                        className={`p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedProductIds.includes(product.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProductIds.includes(product.id)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30'
                          }`}>
                            {selectedProductIds.includes(product.id) && (
                              <CheckIcon className="h-3 w-3 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product.nome}</p>
                            {product.descricao && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{product.descricao}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-mono text-muted-foreground">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {selectedProductIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedProductIds.length} produto(s) selecionado(s) • Total: {
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        selectedProductIds.reduce((sum, id) => {
                          const p = products.find(prod => prod.id === id);
                          return sum + (p?.preco || 0);
                        }, 0)
                      )
                    }
                  </p>
                )}
              </div>

              {/* Campo de valor obrigatório */}
              <div className="space-y-2">
                <Label>Valor da Venda (R$) *</Label>
                <Input
                  placeholder="R$ 0,00"
                  value={dealValor}
                  onChange={(e) => setDealValor(formatCurrencyInput(e.target.value))}
                  className="font-mono text-lg"
                />
              </div>

              {/* Checkbox de venda recorrente */}
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  vendaRecorrente 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                    : 'border-muted hover:border-muted-foreground/50'
                }`}
                onClick={() => setVendaRecorrente(!vendaRecorrente)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    vendaRecorrente 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-muted-foreground/50'
                  }`}>
                    {vendaRecorrente && <CheckIcon className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">Venda Recorrente</p>
                    <p className="text-xs text-muted-foreground">
                      Marque se esta venda é recorrente (assinatura/mensalidade)
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSaveDeal} 
                disabled={!dealValor || savingDeal}
                className="w-full"
              >
                {savingDeal ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 mr-2" />
                    {existingDeal ? 'Atualizar Negociação' : 'Criar Negociação'}
                  </>
                )}
              </Button>
            </div>

            {/* Lista de deals existentes */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Negociações ({leadDeals.length})</h4>
              {leadDeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma negociação
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {leadDeals.map((deal) => (
                    <div key={deal.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.valor_proposto)}
                          </p>
                          {(deal as any).recorrente && (
                            <Badge variant="outline" className="text-xs">
                              Recorrente
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={
                        deal.status === 'Ganha' ? 'default' :
                        deal.status === 'Perdida' ? 'destructive' :
                        'secondary'
                      }>
                        {deal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab de Histórico */}
          <TabsContent value="history" className="mt-4">
            <LeadActivityTimeline leadId={lead.id} pipelineEntryId={pipelineEntryId} maxHeight="500px" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
