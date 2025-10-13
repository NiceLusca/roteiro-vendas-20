import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Lead } from '@/types/crm';
import { useLeadNotes } from '@/hooks/useLeadNotes';
import { useLeadAttachments } from '@/hooks/useLeadAttachments';
import { useSupabaseLeads } from '@/hooks/useSupabaseLeads';
import { 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Paperclip, 
  Upload, 
  Download, 
  Trash2,
  Send,
  Image as ImageIcon
} from 'lucide-react';
import { formatWhatsApp } from '@/utils/formatters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onUpdate?: () => void;
}

const CLOSERS = ['Gabriel', 'Uilma', 'Lucas', 'Vagner'];

export function LeadEditDialog({ open, onOpenChange, lead, onUpdate }: LeadEditDialogProps) {
  const [formData, setFormData] = useState({
    nome: lead.nome,
    whatsapp: lead.whatsapp || '',
    email: lead.email || '',
    segmento: lead.segmento || '',
    closer: lead.closer || ''
  });
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

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
      console.error('Erro ao salvar lead:', error);
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

  const getCloserColor = (closer: string) => {
    switch (closer) {
      case 'Gabriel': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Uilma': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'Lucas': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Vagner': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="closer">Closer Responsável</Label>
              <Select
                value={formData.closer}
                onValueChange={(value) => setFormData({ ...formData, closer: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar closer" />
                </SelectTrigger>
                <SelectContent>
                  {CLOSERS.map((closer) => (
                    <SelectItem key={closer} value={closer}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', {
                          'bg-yellow-400': closer === 'Gabriel',
                          'bg-pink-400': closer === 'Uilma',
                          'bg-purple-400': closer === 'Lucas',
                          'bg-blue-400': closer === 'Vagner'
                        })} />
                        {closer}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.closer && (
                <Badge className={cn('mt-2', getCloserColor(formData.closer))}>
                  Atribuído a: {formData.closer}
                </Badge>
              )}
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
                    <p className="text-sm">{note.note_text}</p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Tab de Anexos */}
          <TabsContent value="attachments" className="space-y-4 mt-4">
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
                Máximo 20MB por arquivo
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
                        <p className="text-xs text-muted-foreground">
                          {attachment.metadata?.size ? `${(attachment.metadata.size / 1024).toFixed(2)} KB` : 'Tamanho desconhecido'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => downloadAttachment(attachment.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAttachment(attachment.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
