import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DuplicateLead } from '@/hooks/useDuplicateDetection';
import { Merge, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MergeField {
  key: keyof DuplicateLead;
  label: string;
  getValue: (lead: DuplicateLead) => string | null;
}

const MERGE_FIELDS: MergeField[] = [
  { key: 'nome', label: 'Nome', getValue: (l) => l.nome },
  { key: 'email', label: 'Email', getValue: (l) => l.email },
  { key: 'whatsapp', label: 'WhatsApp', getValue: (l) => l.whatsapp },
  { key: 'origem', label: 'Origem', getValue: (l) => l.origem },
  { key: 'segmento', label: 'Segmento', getValue: (l) => l.segmento },
  { key: 'lead_score', label: 'Score', getValue: (l) => l.lead_score?.toString() || null },
];

interface DuplicateMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead1: DuplicateLead;
  lead2: DuplicateLead;
  onMerge: (keepLeadId: string, deleteLeadId: string, mergedData: Partial<DuplicateLead>) => Promise<boolean>;
}

export function DuplicateMergeDialog({
  open,
  onOpenChange,
  lead1,
  lead2,
  onMerge,
}: DuplicateMergeDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Para cada campo, guarda qual lead será usado ('lead1' ou 'lead2')
  const [selections, setSelections] = useState<Record<string, 'lead1' | 'lead2'>>({});

  // Determinar qual lead é mais antigo (será o mantido por padrão)
  const lead1Date = new Date(lead1.created_at || 0);
  const lead2Date = new Date(lead2.created_at || 0);
  const olderLeadKey = lead1Date <= lead2Date ? 'lead1' : 'lead2';
  const olderLead = olderLeadKey === 'lead1' ? lead1 : lead2;
  const newerLead = olderLeadKey === 'lead1' ? lead2 : lead1;

  // Calcular seleções iniciais: preferir valor do mais antigo, mas se não tiver, usar do mais novo
  const initialSelections = useMemo(() => {
    const result: Record<string, 'lead1' | 'lead2'> = {};
    MERGE_FIELDS.forEach((field) => {
      const val1 = field.getValue(lead1);
      const val2 = field.getValue(lead2);
      
      if (val1 && !val2) {
        result[field.key] = 'lead1';
      } else if (!val1 && val2) {
        result[field.key] = 'lead2';
      } else {
        // Ambos têm valor ou ambos não têm - preferir o mais antigo
        result[field.key] = olderLeadKey;
      }
    });
    return result;
  }, [lead1, lead2, olderLeadKey]);

  // Usar seleções do estado ou as iniciais
  const currentSelections = { ...initialSelections, ...selections };

  const handleSelectionChange = (fieldKey: string, value: 'lead1' | 'lead2') => {
    setSelections((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleMerge = async () => {
    setLoading(true);
    try {
      // Construir dados mesclados
      const mergedData: Partial<DuplicateLead> = {};
      MERGE_FIELDS.forEach((field) => {
        const selectedLead = currentSelections[field.key] === 'lead1' ? lead1 : lead2;
        const value = field.getValue(selectedLead);
        if (value !== null) {
          if (field.key === 'lead_score') {
            (mergedData as any)[field.key] = parseInt(value);
          } else {
            (mergedData as any)[field.key] = value;
          }
        }
      });

      // O lead mais antigo será mantido
      const keepLeadId = olderLead.id;
      const deleteLeadId = newerLead.id;

      await onMerge(keepLeadId, deleteLeadId, mergedData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Mesclar Leads
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Selecione qual informação manter para cada campo. O lead mais antigo 
            <Badge variant="outline" className="mx-1">{olderLead.nome}</Badge>
            será mantido com os dados selecionados.
          </p>

          <div className="space-y-4">
            {MERGE_FIELDS.map((field) => {
              const val1 = field.getValue(lead1);
              const val2 = field.getValue(lead2);
              const hasValue1 = val1 !== null && val1 !== '';
              const hasValue2 = val2 !== null && val2 !== '';
              
              // Se ambos são vazios, não mostrar
              if (!hasValue1 && !hasValue2) return null;

              const isDifferent = val1 !== val2;

              return (
                <div 
                  key={field.key} 
                  className={cn(
                    "p-3 rounded-lg border",
                    isDifferent && hasValue1 && hasValue2 
                      ? "border-warning bg-warning/5" 
                      : "border-border"
                  )}
                >
                  <Label className="text-sm font-medium mb-2 block">
                    {field.label}
                    {isDifferent && hasValue1 && hasValue2 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Valores diferentes
                      </Badge>
                    )}
                  </Label>
                  
                  <RadioGroup
                    value={currentSelections[field.key]}
                    onValueChange={(v) => handleSelectionChange(field.key, v as 'lead1' | 'lead2')}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className={cn(
                      "flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors",
                      currentSelections[field.key] === 'lead1' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50",
                      !hasValue1 && "opacity-50"
                    )}>
                      <RadioGroupItem 
                        value="lead1" 
                        id={`${field.key}-lead1`} 
                        disabled={!hasValue1}
                      />
                      <Label 
                        htmlFor={`${field.key}-lead1`} 
                        className={cn(
                          "flex-1 cursor-pointer text-sm",
                          !hasValue1 && "text-muted-foreground"
                        )}
                      >
                        {hasValue1 ? val1 : '(vazio)'}
                        {lead1.id === olderLead.id && (
                          <span className="text-xs text-muted-foreground ml-1">(antigo)</span>
                        )}
                      </Label>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors",
                      currentSelections[field.key] === 'lead2' 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50",
                      !hasValue2 && "opacity-50"
                    )}>
                      <RadioGroupItem 
                        value="lead2" 
                        id={`${field.key}-lead2`}
                        disabled={!hasValue2}
                      />
                      <Label 
                        htmlFor={`${field.key}-lead2`} 
                        className={cn(
                          "flex-1 cursor-pointer text-sm",
                          !hasValue2 && "text-muted-foreground"
                        )}
                      >
                        {hasValue2 ? val2 : '(vazio)'}
                        {lead2.id === olderLead.id && (
                          <span className="text-xs text-muted-foreground ml-1">(antigo)</span>
                        )}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleMerge} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar Mesclagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
