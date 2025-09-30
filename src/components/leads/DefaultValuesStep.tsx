import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { ColumnMapping } from '@/types/bulkImport';
import { Lead } from '@/types/crm';

interface DefaultValuesStepProps {
  mapping: ColumnMapping[];
  onComplete: (defaultValues: Record<string, any>) => void;
  onBack: () => void;
}

const REQUIRED_FIELDS = [
  { key: 'nome', label: 'Nome', type: 'text', canBeEmpty: false },
  { key: 'whatsapp', label: 'WhatsApp', type: 'text', canBeEmpty: false },
  { key: 'origem', label: 'Origem', type: 'select', canBeEmpty: false, options: ['Indicação', 'Orgânico', 'Tráfego Pago', 'Evento', 'Cold Call', 'WhatsApp', 'Instagram', 'Outro'] },
];

export function DefaultValuesStep({ mapping, onComplete, onBack }: DefaultValuesStepProps) {
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});

  // Identificar campos obrigatórios não mapeados
  const unmappedRequiredFields = REQUIRED_FIELDS.filter(
    field => !mapping.some(m => m.targetField === field.key && m.targetField !== null)
  );

  const handleValueChange = (field: string, value: string) => {
    setDefaultValues(prev => ({ ...prev, [field]: value }));
  };

  const handleContinue = () => {
    // Validar que todos os campos obrigatórios não mapeados têm valor padrão
    const missingValues = unmappedRequiredFields.filter(
      field => !field.canBeEmpty && (!defaultValues[field.key] || defaultValues[field.key].trim() === '')
    );

    if (missingValues.length > 0) {
      alert(`Por favor, defina valores padrão para: ${missingValues.map(f => f.label).join(', ')}`);
      return;
    }

    onComplete(defaultValues);
  };

  // Se todos os campos obrigatórios estão mapeados, pular esta etapa
  if (unmappedRequiredFields.length === 0) {
    onComplete({});
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Configurar Valores Padrão</h3>
        <p className="text-sm text-muted-foreground">
          Alguns campos obrigatórios não foram mapeados na planilha. Defina valores padrão para eles.
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Os campos abaixo são <strong>obrigatórios</strong> no sistema e não foram encontrados na planilha.
          Todos os leads importados receberão os valores padrão que você definir aqui.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {unmappedRequiredFields.map((field) => (
          <div key={field.key} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Label htmlFor={field.key} className="font-medium">
                {field.label}
              </Label>
              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
            </div>

            {field.type === 'text' && (
              <Input
                id={field.key}
                placeholder={`Digite o valor padrão para ${field.label}`}
                value={defaultValues[field.key] || ''}
                onChange={(e) => handleValueChange(field.key, e.target.value)}
              />
            )}

            {field.type === 'select' && field.options && (
              <Select
                value={defaultValues[field.key] || ''}
                onValueChange={(value) => handleValueChange(field.key, value)}
              >
                <SelectTrigger id={field.key}>
                  <SelectValue placeholder={`Selecione ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <p className="text-xs text-muted-foreground">
              Este valor será aplicado a <strong>todos os leads</strong> que não tiverem este campo na planilha.
            </p>
          </div>
        ))}
      </div>

      <Alert className="bg-muted">
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Você pode escolher valores genéricos como "Não Informado" ou "Importação em Lote" 
          para identificar facilmente os leads importados e editá-los posteriormente se necessário.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleContinue}>
          Continuar
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
