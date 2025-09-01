import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AuditLog } from '@/types/crm';
import { useAudit } from '@/contexts/AuditContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Filter, Download, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityFilter?: string;
  entityIdFilter?: string;
}

export function AuditLogsDialog({
  open,
  onOpenChange,
  entityFilter,
  entityIdFilter
}: AuditLogsDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { getAuditLogs } = useAudit();
  const { toast } = useToast();
  
  // Load logs when dialog opens or filters change
  useEffect(() => {
    if (open && entityFilter && entityIdFilter) {
      loadLogs();
    }
  }, [open, entityFilter, entityIdFilter]);

  const loadLogs = async () => {
    if (!entityFilter || !entityIdFilter) return;
    
    setLoading(true);
    try {
      const logs = await getAuditLogs(entityFilter, entityIdFilter);
      setAllLogs(logs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar logs
  const filteredLogs = allLogs.filter(log => {
    if (entityFilter && log.entidade !== entityFilter) return false;
    if (entityIdFilter && log.entidade_id !== entityIdFilter) return false;
    if (entityTypeFilter !== 'all' && log.entidade !== entityTypeFilter) return false;
    if (actorFilter !== 'all' && log.ator !== actorFilter) return false;
    if (searchTerm && !log.entidade_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Obter entidades e atores únicos
  const entities = Array.from(new Set(allLogs.map(log => log.entidade)));
  const actors = Array.from(new Set(allLogs.map(log => log.ator)));

  const handleExport = () => {
    // Implementar exportação de logs
    const exportData = {
      logs: allLogs,
      exportDate: new Date().toISOString(),
      filters: { entityTypeFilter, entityFilter, actorFilter }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Logs exportados",
      description: "Os logs de auditoria foram exportados com sucesso",
    });
  };

  const formatAlteracao = (alteracao: AuditLog['alteracao']) => {
    return alteracao.map(alt => (
      <div key={alt.campo} className="text-xs">
        <span className="font-medium">{alt.campo}:</span>
        <span className="text-muted-foreground"> {String(alt.de)} → </span>
        <span className="font-medium">{String(alt.para)}</span>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Logs de Auditoria
            <Badge variant="secondary">{filteredLogs.length} registros</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Filtros */}
        <div className="flex items-center gap-4 py-4 border-b">
          <div className="flex items-center gap-2 flex-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID da entidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Entidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {entities.map((entity: string) => (
                <SelectItem key={entity} value={entity}>
                  {entity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Ator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {actors.map((actor: string) => (
                <SelectItem key={actor} value={actor}>
                  {actor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Lista de Logs */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Carregando logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </div>
          ) : (
            filteredLogs.map((log: AuditLog) => (
              <div key={log.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{log.entidade}</Badge>
                      <span className="text-sm font-mono text-muted-foreground">
                        {log.entidade_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{log.ator}</span>
                      <Calendar className="h-3 w-3 ml-2" />
                      <span>
                        {format(log.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Alterações:</h4>
                  <div className="space-y-1">
                    {formatAlteracao(log.alteracao)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}