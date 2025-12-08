import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Lead } from '@/types/crm';
import { useLeadNotes } from '@/hooks/useLeadNotes';
import { useLeadAttachments } from '@/hooks/useLeadAttachments';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { useLeadResponsibles } from '@/hooks/useLeadResponsibles';
import { useLeadActivityLog } from '@/hooks/useLeadActivityLog';
import { ResponsibleSelector } from '@/components/leads/ResponsibleSelector';
import { LeadActivityTimeline } from '@/components/timeline/LeadActivityTimeline';
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
  History
} from 'lucide-react';
import { formatWhatsApp } from '@/utils/formatters';
import { linkifyText } from '@/utils/linkify';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onUpdate?: () => void;
}

export function LeadEditDialog({ open, onOpenChange, lead, onUpdate }: LeadEditDialogProps) {
  const [formData, setFormData] = useState({
    nome: lead.nome,
    whatsapp: lead.whatsapp || '',
    email: lead.email || '',
    segmento: lead.segmento || ''
  });
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [pasteEnabled, setPasteEnabled] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('');

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

  const { notes, loading: notesLoading, addNote } = useLeadNotes(lead.id);
  const { 
    attachments, 
    loading: attachmentsLoading, 
    uploading, 
    uploadAttachment, 
    deleteAttachment,
    downloadAttachment 
  } = useLeadAttachments(lead.id);
  const { saveLead } = useSupabaseLeads();
  const { responsibles, history } = useLeadResponsibles(lead.id);
  const { activities } = useLeadActivityLog(lead.id);

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
    if (!newNote.trim()) return;
    
    await addNote(newNote);
    setNewNote('');
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

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="responsibles">
              Responsáveis
              {responsibles.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {responsibles.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Comentários
              {notes.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {notes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Anexos
              {attachments.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {attachments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" />
              Histórico
              {activities.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activities.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab de Informações */}
          <TabsContent value="info" className="space-y-4 mt-4">
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
            <div className="space-y-2">
              <Label>Adicionar Comentário</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite seu comentário..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleAddNote} 
                disabled={!newNote.trim()}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Adicionar Comentário
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
                      <span className="text-xs text-muted-foreground">
                        {new Date(note.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{linkifyText(note.note_text)}</p>
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

          {/* Tab de Histórico */}
          <TabsContent value="history" className="mt-4">
            <LeadActivityTimeline leadId={lead.id} maxHeight="400px" />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
