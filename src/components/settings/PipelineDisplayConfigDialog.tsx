import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PipelineDisplayConfig, AVAILABLE_DISPLAY_FIELDS, DEFAULT_DISPLAY_CONFIG } from '@/types/pipelineDisplay';
import { Loader2, LayoutGrid, TableProperties, Eye, Info, User, Calendar, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Pipeline {
  id: string;
  nome: string;
  display_config?: PipelineDisplayConfig | null;
}

interface PipelineDisplayConfigDialogProps {
  pipeline: Pipeline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (pipelineId: string, config: PipelineDisplayConfig) => Promise<boolean>;
}

// Group fields by category for better UX
const FIELD_GROUPS = {
  'Lead': ['nome', 'contato', 'origem', 'segmento', 'lead_score'],
  'Vendas': ['valor_deal', 'valor_recorrente', 'closer', 'objecao'],
  'Pipeline': ['etapa', 'dias', 'sla', 'saude', 'score'],
  'Agendamentos': ['data_sessao'],
  'Outros': ['responsavel', 'tags'],
} as const;

// Fields that require deals data
const DEAL_FIELDS = ['valor_deal', 'valor_recorrente', 'closer', 'objecao'];
// Fields that require appointments data
const APPOINTMENT_FIELDS = ['data_sessao'];

// Preview dummy data
const PREVIEW_DATA: Record<string, string | number | string[]> = {
  nome: 'João Silva',
  contato: '(11) 99999-0000',
  origem: 'LinkedIn',
  segmento: 'Tecnologia',
  lead_score: 85,
  etapa: 'Qualificação',
  dias: 3,
  sla: '4d',
  saude: 'Saudável',
  score: 75,
  valor_deal: 15000,
  valor_recorrente: 1200,
  closer: 'Maria S.',
  objecao: 'Preço',
  data_sessao: '25/01 14:30',
  responsavel: 'Ana Paula',
  tags: ['VIP', 'Quente'],
};

// Mini card preview component
function CardPreview({ selectedFields }: { selectedFields: string[] }) {
  const fieldsToShow = selectedFields.filter(f => f !== 'nome'); // nome always shows
  
  const renderFieldValue = (key: string) => {
    const value = PREVIEW_DATA[key];
    const field = AVAILABLE_DISPLAY_FIELDS[key];
    
    if (!field || value === undefined) return null;
    
    if (key === 'tags' && Array.isArray(value)) {
      return (
        <div className="flex gap-1 flex-wrap">
          {value.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      );
    }
    
    if (key === 'responsavel') {
      return (
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] text-muted-foreground">{value}</span>
        </div>
      );
    }
    
    if (key === 'data_sessao') {
      return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {value}
        </div>
      );
    }
    
    if (key === 'valor_deal' || key === 'valor_recorrente') {
      return (
        <span className="text-xs font-semibold text-primary">
          {formatCurrency(value as number)}
        </span>
      );
    }
    
    if (key === 'sla') {
      return (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500 text-emerald-600">
          {value}
        </Badge>
      );
    }
    
    return <span className="text-[10px] text-muted-foreground">{value}</span>;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LayoutGrid className="w-3 h-3" />
        Card Kanban
      </div>
      <Card className="p-3 w-48 space-y-2 border-l-2 border-l-primary shadow-sm">
        {/* Header with name */}
        <div className="space-y-0.5">
          <p className="font-medium text-sm leading-tight truncate">{PREVIEW_DATA.nome}</p>
          {fieldsToShow.includes('origem') && (
            <p className="text-[10px] text-muted-foreground">{PREVIEW_DATA.origem}</p>
          )}
        </div>
        
        {/* Dynamic fields */}
        <div className="space-y-1.5">
          {fieldsToShow
            .filter(f => f !== 'origem' && f !== 'tags' && f !== 'responsavel' && f !== 'sla')
            .slice(0, 3)
            .map(field => (
              <div key={field}>{renderFieldValue(field)}</div>
            ))}
        </div>
        
        {/* Bottom section: tags, responsavel, sla */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {fieldsToShow.includes('tags') && renderFieldValue('tags')}
            {fieldsToShow.includes('responsavel') && renderFieldValue('responsavel')}
          </div>
          {fieldsToShow.includes('sla') && renderFieldValue('sla')}
        </div>
        
        {/* Advance button simulation */}
        <Button size="sm" className="w-full h-6 text-[10px]" variant="outline">
          Avançar <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
        
        {fieldsToShow.length === 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            Selecione campos para visualizar
          </p>
        )}
      </Card>
    </div>
  );
}

// Mini table preview component
function TablePreview({ selectedColumns }: { selectedColumns: string[] }) {
  const columnsToShow = selectedColumns.slice(0, 6); // Limit for preview
  
  const renderCellValue = (key: string) => {
    const value = PREVIEW_DATA[key];
    const field = AVAILABLE_DISPLAY_FIELDS[key];
    
    if (!field || value === undefined) return '-';
    
    if (key === 'tags' && Array.isArray(value)) {
      return (
        <div className="flex gap-0.5">
          {value.slice(0, 1).map(tag => (
            <Badge key={tag} variant="secondary" className="text-[9px] px-1 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      );
    }
    
    if (key === 'valor_deal' || key === 'valor_recorrente') {
      return formatCurrency(value as number);
    }
    
    if (key === 'saude') {
      return <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500 text-emerald-600">●</Badge>;
    }
    
    return String(value);
  };

  if (columnsToShow.length === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <TableProperties className="w-3 h-3" />
          Linha da Tabela
        </div>
        <div className="border rounded-md p-3 text-[10px] text-muted-foreground text-center">
          Selecione colunas para visualizar
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <TableProperties className="w-3 h-3" />
        Linha da Tabela
      </div>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-[10px]">
          <thead className="bg-muted/50">
            <tr>
              {columnsToShow.map(col => (
                <th key={col} className="px-2 py-1 text-left font-medium text-muted-foreground truncate max-w-[60px]">
                  {AVAILABLE_DISPLAY_FIELDS[col]?.label || col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              {columnsToShow.map(col => (
                <td key={col} className="px-2 py-1.5 truncate max-w-[60px]">
                  {renderCellValue(col)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PipelineDisplayConfigDialog({ 
  pipeline, 
  open, 
  onOpenChange, 
  onSave 
}: PipelineDisplayConfigDialogProps) {
  const [saving, setSaving] = useState(false);
  
  // Get current config or use defaults
  const currentConfig = pipeline?.display_config || DEFAULT_DISPLAY_CONFIG;
  
  const [cardFields, setCardFields] = useState<string[]>(currentConfig.card_fields || []);
  const [tableColumns, setTableColumns] = useState<string[]>(currentConfig.table_columns || []);
  const [showDeals, setShowDeals] = useState(currentConfig.show_deals ?? false);
  const [showOrders, setShowOrders] = useState(currentConfig.show_orders ?? false);
  const [showAppointments, setShowAppointments] = useState(currentConfig.show_appointments ?? false);

  // Reset state when pipeline changes
  useEffect(() => {
    if (pipeline) {
      const config = pipeline.display_config || DEFAULT_DISPLAY_CONFIG;
      setCardFields(config.card_fields || []);
      setTableColumns(config.table_columns || []);
      setShowDeals(config.show_deals ?? false);
      setShowOrders(config.show_orders ?? false);
      setShowAppointments(config.show_appointments ?? false);
    }
  }, [pipeline]);

  // Auto-sync: when deal fields are selected, enable showDeals
  useEffect(() => {
    const hasDealFieldsInCard = cardFields.some(f => DEAL_FIELDS.includes(f));
    const hasDealFieldsInTable = tableColumns.some(f => DEAL_FIELDS.includes(f));
    
    if (hasDealFieldsInCard || hasDealFieldsInTable) {
      setShowDeals(true);
    }
  }, [cardFields, tableColumns]);

  // Auto-sync: when appointment fields are selected, enable showAppointments
  useEffect(() => {
    const hasAppointmentFieldsInCard = cardFields.some(f => APPOINTMENT_FIELDS.includes(f));
    const hasAppointmentFieldsInTable = tableColumns.some(f => APPOINTMENT_FIELDS.includes(f));
    
    if (hasAppointmentFieldsInCard || hasAppointmentFieldsInTable) {
      setShowAppointments(true);
    }
  }, [cardFields, tableColumns]);

  const toggleField = (field: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(field)) {
      setList(list.filter(f => f !== field));
    } else {
      setList([...list, field]);
    }
  };

  const handleSave = async () => {
    if (!pipeline) return;
    
    setSaving(true);
    try {
      const config: PipelineDisplayConfig = {
        card_fields: cardFields,
        table_columns: tableColumns,
        show_deals: showDeals,
        show_orders: showOrders,
        show_appointments: showAppointments,
      };
      
      const success = await onSave(pipeline.id, config);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const renderFieldGroup = (
    groupName: string, 
    fields: readonly string[], 
    selectedFields: string[], 
    setSelectedFields: (v: string[]) => void
  ) => (
    <div key={groupName} className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{groupName}</h4>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(fieldKey => {
          const field = AVAILABLE_DISPLAY_FIELDS[fieldKey];
          if (!field) return null;
          
          return (
            <label 
              key={fieldKey}
              className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Checkbox 
                checked={selectedFields.includes(fieldKey)}
                onCheckedChange={() => toggleField(fieldKey, selectedFields, setSelectedFields)}
              />
              <span className="text-sm">{field.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Configurar Visualização</DialogTitle>
          <DialogDescription>
            Escolha quais campos exibir no Kanban e na tabela do pipeline "{pipeline?.nome}"
          </DialogDescription>
        </DialogHeader>

        {/* Preview Section - Fixed at top */}
        <div className="shrink-0 bg-muted/30 rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Preview em tempo real</span>
          </div>
          <div className="flex gap-6 items-start flex-wrap">
            <CardPreview selectedFields={cardFields} />
            <div className="flex-1 min-w-[250px]">
              <TablePreview selectedColumns={tableColumns} />
            </div>
          </div>
        </div>

        <Separator className="shrink-0" />

        <ScrollArea className="max-h-[35vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Tab Control Section - Most Important, at the top */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Abas no Dialog de Edição</h3>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Controle quais abas aparecem ao clicar em um lead deste pipeline
              </p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                  <Label htmlFor="show-appointments-tab" className="font-medium cursor-pointer">
                    Aba "Agenda"
                  </Label>
                  <Switch 
                    id="show-appointments-tab"
                    checked={showAppointments}
                    onCheckedChange={setShowAppointments}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                  <Label htmlFor="show-deals-tab" className="font-medium cursor-pointer">
                    Aba "Vendas"
                  </Label>
                  <Switch 
                    id="show-deals-tab"
                    checked={showDeals}
                    onCheckedChange={setShowDeals}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Card Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Campos no Card Kanban</h3>
              </div>
              <div className="pl-6 space-y-4">
                {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => 
                  renderFieldGroup(groupName, fields, cardFields, setCardFields)
                )}
              </div>
            </div>

            <Separator />

            {/* Table Columns Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TableProperties className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Colunas na Tabela</h3>
              </div>
              <div className="pl-6 space-y-4">
                {Object.entries(FIELD_GROUPS).map(([groupName, fields]) => 
                  renderFieldGroup(groupName, fields, tableColumns, setTableColumns)
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
