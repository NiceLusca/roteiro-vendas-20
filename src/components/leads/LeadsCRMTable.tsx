import { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lead } from '@/types/crm';
import { LeadEditDialog } from '@/components/kanban/LeadEditDialog';
import { LeadDeleteConfirmDialog } from '@/components/leads/LeadDeleteConfirmDialog';
import { useLeadsCRMData } from '@/hooks/useLeadsCRMData';
import { useLeadSave } from '@/hooks/useLeadSave';
import { useLeadActivityLog } from '@/hooks/useLeadActivityLog';
import { useUserRole } from '@/hooks/useUserRole';
import { formatWhatsApp } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react';
import { InlineEditCell, InlineSelectCell } from './InlineEditCell';
import { SortableTableHead, SortDirection } from './SortableTableHead';
import { CRMTableFilters } from './CRMTableFilters';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LeadsCRMTableProps {
  leads: Lead[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: 'agendado', label: 'Agendado', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  { value: 'confirmado', label: 'Confirmado', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  { value: 'atendido', label: 'Atendido', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
  { value: 'ligacao_realizada', label: 'Ligação realizada', className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  { value: 'remarcou', label: 'Remarcou', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  { value: 'nao_compareceu', label: 'Não compareceu', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  { value: 'desmarcou', label: 'Desmarcou', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  { value: 'closer_ausente', label: 'Closer Ausente', className: 'bg-slate-500/10 text-slate-700 dark:text-slate-400' },
  { value: 'fechou', label: 'Fechou', className: 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300' },
  { value: 'nao_fechou', label: 'Não fechou', className: 'bg-destructive/10 text-destructive' },
  { value: 'ja_possui', label: 'Já possui', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
];

const origemOptions = [
  { value: 'Imersão Igor', label: 'Imersão Igor', className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20' },
  { value: 'Imersão Manu & Grazi', label: 'Imersão Manu & Grazi', className: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20' },
  { value: 'Desafio FEM', label: 'Desafio FEM', className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20' },
  { value: 'Mentoria 50K', label: 'Mentoria 50K', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  { value: 'HDL', label: 'HDL', className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20' },
  { value: 'Convidado', label: 'Convidado', className: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' },
  { value: 'Society', label: 'Society', className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20' },
  { value: 'Evento', label: 'Evento', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
  { value: 'Pós venda', label: 'Pós venda', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
  { value: 'Suporte - pós venda', label: 'Suporte - pós venda', className: 'bg-lime-500/10 text-lime-700 dark:text-lime-400 border-lime-500/20' },
  { value: 'Recup. Imer. Igor', label: 'Recup. Imer. Igor', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  { value: 'Recup. Imer. Manu&Grazi', label: 'Recup. Imer. Manu&Grazi', className: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatShortDate(dateStr: string | null) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd/MM/yy HH:mm', { locale: ptBR });
  } catch {
    return '—';
  }
}

export function LeadsCRMTable({
  leads,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  isLoading,
  onUpdate,
}: LeadsCRMTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { saveLead } = useLeadSave();
  const { logActivity } = useLeadActivityLog();

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Local filter state
  const [filterOrigem, setFilterOrigem] = useState('all');
  const [filterCloser, setFilterCloser] = useState('all');

  const leadIds = leads.map(l => l.id);
  const { dealsMap, appointmentsMap, pipelinesMap } = useLeadsCRMData({
    leadIds,
    enabled: leads.length > 0,
  });

  const fieldLabels: Record<string, string> = useMemo(() => ({
    status_geral: 'Status',
    origem: 'Origem',
    closer: 'Closer',
    lead_score: 'Score',
  }), []);

  const handleSort = useCallback((column: string) => {
    setSortColumn(prev => {
      if (prev !== column) {
        setSortDirection('asc');
        return column;
      }
      // cycle: asc → desc → null
      setSortDirection(d => {
        if (d === 'asc') return 'desc';
        if (d === 'desc') return null;
        return 'asc';
      });
      if (sortDirection === 'desc') return null;
      return column;
    });
  }, [sortDirection]);

  // Apply local filters then sort
  const processedLeads = useMemo(() => {
    let result = [...leads];

    // Local filters
    if (filterOrigem !== 'all') {
      result = result.filter(l => l.origem === filterOrigem);
    }
    if (filterCloser !== 'all') {
      result = result.filter(l => l.closer === filterCloser);
    }

    // Sort
    if (!sortColumn || !sortDirection) return result;

    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case 'nome': valA = a.nome; valB = b.nome; break;
        case 'whatsapp': valA = a.whatsapp; valB = b.whatsapp; break;
        case 'email': valA = a.email; valB = b.email; break;
        case 'origem': valA = a.origem; valB = b.origem; break;
        case 'status_geral': valA = a.status_geral; valB = b.status_geral; break;
        case 'closer': valA = a.closer; valB = b.closer; break;
        case 'pipelines':
          valA = pipelinesMap[a.id]?.length ?? 0;
          valB = pipelinesMap[b.id]?.length ?? 0;
          break;
        case 'next_appointment':
          valA = appointmentsMap[a.id]?.nextAppointment;
          valB = appointmentsMap[b.id]?.nextAppointment;
          break;
        case 'last_appointment':
          valA = appointmentsMap[a.id]?.lastAppointment;
          valB = appointmentsMap[b.id]?.lastAppointment;
          break;
        case 'total_value':
          valA = dealsMap[a.id]?.totalValue ?? 0;
          valB = dealsMap[b.id]?.totalValue ?? 0;
          break;
        case 'deal_count':
          valA = dealsMap[a.id]?.dealCount ?? 0;
          valB = dealsMap[b.id]?.dealCount ?? 0;
          break;
        case 'lead_score':
          valA = a.lead_score ?? 0;
          valB = b.lead_score ?? 0;
          break;
        case 'created_at':
          valA = a.created_at;
          valB = b.created_at;
          break;
        default: return 0;
      }

      // nulls last
      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let cmp = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), 'pt-BR', { sensitivity: 'base' });
      }

      return sortDirection === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [leads, filterOrigem, filterCloser, sortColumn, sortDirection, dealsMap, appointmentsMap, pipelinesMap]);

  const handleInlineSave = useCallback(async (leadId: string, field: string, value: string, oldValue?: string | number | null) => {
    const payload: any = { id: leadId, [field]: value || null };
    if (field === 'lead_score') {
      payload[field] = value ? parseInt(value, 10) : 0;
    }
    await saveLead(payload, { silent: true });
    
    const oldDisplay = oldValue != null && String(oldValue).trim() !== '' ? String(oldValue) : '(vazio)';
    const newDisplay = value.trim() !== '' ? value : '(vazio)';
    logActivity({
      leadId,
      activityType: 'lead_updated',
      details: {
        field,
        field_label: fieldLabels[field] || field,
        old_value: oldDisplay,
        new_value: newDisplay,
        source: 'crm_table_inline',
      },
    });
    
    onUpdate?.();
  }, [saveLead, onUpdate, logActivity, fieldLabels]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {filterOrigem !== 'all' || filterCloser !== 'all'
              ? `${processedLeads.length} de ${totalCount} leads`
              : `${totalCount} lead${totalCount !== 1 ? 's' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
          </p>
          <CRMTableFilters
            leads={leads}
            filterOrigem={filterOrigem}
            onFilterOrigemChange={setFilterOrigem}
            filterCloser={filterCloser}
            onFilterCloserChange={setFilterCloser}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-340px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                <SortableTableHead label="Nome" column="nome" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[180px] font-semibold" />
                <SortableTableHead label="WhatsApp" column="whatsapp" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[130px]" />
                <SortableTableHead label="E-mail" column="email" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[180px]" />
                <SortableTableHead label="Origem" column="origem" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[120px]" />
                <SortableTableHead label="Status" column="status_geral" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[120px]" />
                <SortableTableHead label="Closer" column="closer" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[100px]" />
                <SortableTableHead label="Pipelines" column="pipelines" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[200px]" />
                <SortableTableHead label="Próx. Sessão" column="next_appointment" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[130px]" />
                <SortableTableHead label="Último Atend." column="last_appointment" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[130px]" />
                <SortableTableHead label="Valor Vendas" column="total_value" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[110px] text-right" />
                <SortableTableHead label="Recorr." column="recorrente" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[80px] text-center" />
                <SortableTableHead label="Nº Vendas" column="deal_count" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[70px] text-center" />
                <SortableTableHead label="Score" column="lead_score" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[60px] text-center" />
                <SortableTableHead label="Tags" column="tags" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[150px]" />
                <SortableTableHead label="Criado em" column="created_at" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="min-w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : processedLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                    <TableIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              ) : (
                processedLeads.map(lead => {
                  const deals = dealsMap[lead.id];
                  const apts = appointmentsMap[lead.id];
                  const pipes = pipelinesMap[lead.id];

                  return (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer hover:bg-accent/50 text-xs"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <TableCell className="font-medium text-sm">{lead.nome}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {lead.whatsapp ? formatWhatsApp(lead.whatsapp) : '—'}
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]">
                        {lead.email || '—'}
                      </TableCell>

                      <TableCell className="text-xs">
                        <InlineSelectCell
                          value={lead.origem}
                          options={origemOptions}
                          onSave={v => handleInlineSave(lead.id, 'origem', v, lead.origem)}
                          allowFreeText
                          freeTextPlaceholder="Digitar origem..."
                        />
                      </TableCell>

                      <TableCell>
                        <InlineSelectCell
                          value={lead.status_geral}
                          options={statusOptions}
                          onSave={v => handleInlineSave(lead.id, 'status_geral', v, lead.status_geral)}
                        />
                      </TableCell>

                      <TableCell className="text-xs">
                        <InlineEditCell
                          value={lead.closer}
                          onSave={v => handleInlineSave(lead.id, 'closer', v, lead.closer)}
                          placeholder="Closer"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pipes && pipes.length > 0 ? pipes.map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 whitespace-nowrap">
                              {p.pipelineName} → {p.stageName}
                            </Badge>
                          )) : <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatShortDate(apts?.nextAppointment || null)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatShortDate(apts?.lastAppointment || null)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        {deals && deals.totalValue > 0 ? (
                          deals.closerBreakdown.length > 1 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted underline-offset-2">
                                    {formatCurrency(deals.totalValue)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-xs mb-1">Vendas por closer:</p>
                                    {deals.closerBreakdown.map((cb, i) => (
                                      <div key={i} className="flex justify-between gap-4 text-xs">
                                        <span>{cb.closerName}</span>
                                        <span className="font-mono">{formatCurrency(cb.totalValue)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            formatCurrency(deals.totalValue)
                          )
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {deals?.hasRecorrente ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] px-1.5 py-0">Sim</Badge>
                        ) : deals && deals.dealCount > 0 ? (
                          <span className="text-muted-foreground text-[10px]">Não</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {deals && deals.dealCount > 0 ? deals.dealCount : '—'}
                      </TableCell>

                      <TableCell className="text-center">
                        <InlineEditCell
                          value={lead.lead_score != null && lead.lead_score > 0 ? lead.lead_score : ''}
                          onSave={v => handleInlineSave(lead.id, 'lead_score', v, lead.lead_score)}
                          type="number"
                          placeholder="0"
                          displayClassName="justify-center"
                        />
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(lead as any).tags?.length > 0
                            ? (lead as any).tags.map((tag: any) => (
                                <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: tag.cor || undefined, color: tag.cor || undefined }}>
                                  {tag.nome}
                                </Badge>
                              ))
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {lead.created_at ? format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR }) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedLead && (
        <LeadEditDialog
          open={!!selectedLead}
          onOpenChange={(open) => { if (!open) setSelectedLead(null); }}
          lead={selectedLead}
          onUpdate={() => {
            onUpdate?.();
          }}
          displayConfig={{ show_appointments: true, show_deals: true, show_orders: false, card_fields: [], table_columns: [] }}
        />
      )}
    </div>
  );
}
