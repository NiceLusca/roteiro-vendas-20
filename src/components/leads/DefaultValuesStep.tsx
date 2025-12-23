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
  { key: 'origem', label: 'Origem', type: 'text', canBeEmpty: false, placeholder: 'Ex: Indicação, Instagram, Facebook, etc.' },
];

const OPTIONAL_FIELDS = [
  { key: 'closer', label: 'Closer', type: 'text' },
  { key: 'segmento', label: 'Segmento', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'status_geral', label: 'Status Geral', type: 'select', options: ['Ativo', 'Cliente', 'Perdido', 'Inativo'] },
  { key: 'desejo_na_sessao', label: 'Desejo na Sessão', type: 'text' },
  { key: 'observacoes', label: 'Observações', type: 'textarea' },
  { key: 'valor_lead', label: 'Valor do Lead (0-110)', type: 'number', min: 0, max: 110 },
];

export function DefaultValuesStep({ mapping, onComplete, onBack }: DefaultValuesStepProps) {
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [showOptionalFields, setShowOptionalFields] = useState(true);

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

  const renderField = (field: any, isRequired: boolean) => (
    <div key={field.key} className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.key} className="font-medium">
          {field.label}
        </Label>
        {isRequired && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
      </div>

      {field.type === 'text' && (
        <Input
          id={field.key}
          placeholder={`Digite o valor padrão para ${field.label}`}
          value={defaultValues[field.key] || ''}
          onChange={(e) => handleValueChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'number' && (
        <Input
          id={field.key}
          type="number"
          min={field.min}
          max={field.max}
          placeholder={`Digite o valor padrão para ${field.label}`}
          value={defaultValues[field.key] || ''}
          onChange={(e) => handleValueChange(field.key, e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          id={field.key}
          placeholder={`Digite o valor padrão para ${field.label}`}
          value={defaultValues[field.key] || ''}
          onChange={(e) => handleValueChange(field.key, e.target.value)}
          className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-input bg-background"
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
            {field.options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-muted-foreground">
        {isRequired 
          ? `Este valor será aplicado a todos os leads que não tiverem este campo na planilha.`
          : `Se definido, este valor será aplicado a todos os leads importados.`
        }
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Configurar Valores Padrão</h3>
        <p className="text-sm text-muted-foreground">
          {unmappedRequiredFields.length > 0 
            ? 'Alguns campos obrigatórios não foram mapeados. Defina valores padrão para eles.'
            : 'Defina valores padrão opcionais que serão aplicados a todos os leads importados.'
          }
        </p>
      </div>

      {unmappedRequiredFields.length > 0 && (
        <>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Os campos abaixo são <strong>obrigatórios</strong> no sistema e não foram encontrados na planilha.
              Todos os leads importados receberão os valores padrão que você definir aqui.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Campos Obrigatórios</h4>
            {unmappedRequiredFields.map((field) => renderField(field, true))}
          </div>
        </>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Campos Opcionais</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
          >
            {showOptionalFields ? 'Ocultar' : 'Mostrar'} campos opcionais
          </Button>
        </div>
        
        {showOptionalFields && (
          <>
            <p className="text-xs text-muted-foreground">
              Defina valores que serão aplicados a <strong>todos os leads</strong> importados, 
              independentemente do que está na planilha. Útil para definir Closer, Segmento, etc.
            </p>
            <div className="space-y-4">
              {OPTIONAL_FIELDS.map((field) => renderField(field, false))}
            </div>
          </>
        )}
      </div>

      {unmappedRequiredFields.length === 0 && (
        <Alert className="bg-muted">
          <AlertDescription className="text-sm">
            <strong>Dica:</strong> Use campos opcionais como "Closer" para atribuir todos os leads importados 
            ao mesmo vendedor, ou "Segmento" para categorizá-los facilmente.
          </AlertDescription>
        </Alert>
      )}

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
