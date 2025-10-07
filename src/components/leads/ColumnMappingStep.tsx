import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ColumnMapping } from '@/types/bulkImport';
import { Lead } from '@/types/crm';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface ColumnMappingStepProps {
  headers: string[];
  sampleRows: any[][];
  onComplete: (mapping: ColumnMapping[]) => void;
  onBack: () => void;
}

const LEAD_FIELDS: Array<{ key: keyof Lead; label: string; required: boolean }> = [
  { key: 'nome', label: 'Nome', required: true },
  { key: 'whatsapp', label: 'WhatsApp', required: true },
  { key: 'origem', label: 'Origem', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'segmento', label: 'Segmento', required: false },
  { key: 'closer', label: 'Closer', required: false },
  { key: 'desejo_na_sessao', label: 'Desejo na Sessão', required: false },
  { key: 'objecao_principal', label: 'Objeção Principal', required: false },
  { key: 'observacoes', label: 'Observações', required: false },
  { key: 'valor_lead', label: 'Valor do Lead (0-110)', required: false },
];

export function ColumnMappingStep({ headers, sampleRows, onComplete, onBack }: ColumnMappingStepProps) {
  const [mapping, setMapping] = useState<ColumnMapping[]>([]);

  useEffect(() => {
    // Inicializar mapeamento com detecção automática
    const initialMapping: ColumnMapping[] = headers.map((header) => {
      const normalized = header.toLowerCase().trim();
      let targetField: keyof Lead | null = null;

      // Detecção inteligente de colunas
      if (normalized.includes('nome') || normalized === 'name') {
        targetField = 'nome';
      } else if (normalized.includes('whatsapp') || normalized.includes('telefone') || normalized.includes('phone')) {
        targetField = 'whatsapp';
      } else if (normalized.includes('email') || normalized.includes('e-mail')) {
        targetField = 'email';
      } else if (normalized.includes('origem') || normalized.includes('source')) {
        targetField = 'origem';
      } else if (normalized.includes('segmento') || normalized.includes('segment')) {
        targetField = 'segmento';
      } else if (normalized.includes('closer') || normalized.includes('vendedor')) {
        targetField = 'closer';
      } else if (normalized.includes('desejo')) {
        targetField = 'desejo_na_sessao';
      } else if (normalized.includes('objeção') || normalized.includes('objection')) {
        targetField = 'objecao_principal';
      } else if (normalized.includes('obs') || normalized.includes('notes')) {
        targetField = 'observacoes';
      } else if (normalized === 'score' || normalized.includes('pontuação') || 
                 (normalized.includes('valor') && (normalized.includes('lead') || normalized.includes('potencial')))) {
        targetField = 'valor_lead';
      }

      const field = LEAD_FIELDS.find(f => f.key === targetField);

      return {
        sourceColumn: header,
        targetField,
        isRequired: field?.required || false,
      };
    });

    setMapping(initialMapping);
  }, [headers]);

  const handleMappingChange = (sourceColumn: string, targetField: keyof Lead | null) => {
    setMapping(prev => prev.map(m =>
      m.sourceColumn === sourceColumn
        ? { ...m, targetField, isRequired: LEAD_FIELDS.find(f => f.key === targetField)?.required || false }
        : m
    ));
  };

  const handleContinue = () => {
    // Não precisa validar aqui - a próxima etapa vai pedir valores padrão para campos não mapeados
    onComplete(mapping);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Mapeamento de Colunas</h3>
        <p className="text-sm text-muted-foreground">
          Relacione as colunas da planilha com os campos do sistema
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coluna da Planilha</TableHead>
              <TableHead>Exemplo</TableHead>
              <TableHead className="w-16"></TableHead>
              <TableHead>Campo do Sistema</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mapping.map((map, index) => (
              <TableRow key={map.sourceColumn}>
                <TableCell className="font-medium">
                  {map.sourceColumn}
                  {map.isRequired && (
                    <Badge variant="destructive" className="ml-2">Obrigatório</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {sampleRows[0]?.[index] || '-'}
                </TableCell>
                <TableCell>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={map.targetField || 'none'}
                    onValueChange={(value) =>
                      handleMappingChange(map.sourceColumn, value === 'none' ? null : value as keyof Lead)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um campo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não mapear</SelectItem>
                      {LEAD_FIELDS.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label} {field.required && '*'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
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
