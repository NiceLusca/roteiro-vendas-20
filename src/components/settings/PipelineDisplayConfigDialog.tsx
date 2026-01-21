import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PipelineDisplayConfig, AVAILABLE_DISPLAY_FIELDS, DEFAULT_DISPLAY_CONFIG } from '@/types/pipelineDisplay';
import { Loader2, LayoutGrid, TableProperties, Database } from 'lucide-react';

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
  const [showAppointments, setShowAppointments] = useState(currentConfig.show_appointments ?? true);

  // Reset state when pipeline changes
  useEffect(() => {
    if (pipeline) {
      const config = pipeline.display_config || DEFAULT_DISPLAY_CONFIG;
      setCardFields(config.card_fields || []);
      setTableColumns(config.table_columns || []);
      setShowDeals(config.show_deals ?? false);
      setShowOrders(config.show_orders ?? false);
      setShowAppointments(config.show_appointments ?? true);
    }
  }, [pipeline]);

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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configurar Visualização</DialogTitle>
          <DialogDescription>
            Escolha quais campos exibir no Kanban e na tabela do pipeline "{pipeline?.nome}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
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

            <Separator />

            {/* Data Loading Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Dados Adicionais</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                Ativar carregamento de dados relacionados (impacta performance)
              </p>
              
              <div className="pl-6 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <Label htmlFor="show-deals" className="font-medium">Carregar Deals</Label>
                    <p className="text-xs text-muted-foreground">Valores de venda, status de negócio</p>
                  </div>
                  <Switch 
                    id="show-deals"
                    checked={showDeals}
                    onCheckedChange={setShowDeals}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <Label htmlFor="show-orders" className="font-medium">Carregar Pedidos</Label>
                    <p className="text-xs text-muted-foreground">Pedidos e itens vendidos</p>
                  </div>
                  <Switch 
                    id="show-orders"
                    checked={showOrders}
                    onCheckedChange={setShowOrders}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <Label htmlFor="show-appointments" className="font-medium">Carregar Agendamentos</Label>
                    <p className="text-xs text-muted-foreground">Data e hora das sessões</p>
                  </div>
                  <Switch 
                    id="show-appointments"
                    checked={showAppointments}
                    onCheckedChange={setShowAppointments}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
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
