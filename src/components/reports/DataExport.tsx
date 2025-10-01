import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContextSecure';
import { supabase } from '@/integrations/supabase/client';

interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  dataTypes: {
    leads: boolean;
    deals: boolean;
    appointments: boolean;
    interactions: boolean;
    pipelineEntries: boolean;
  };
  dateRange: {
    start: string;
    end: string;
  };
  includeMetadata: boolean;
}

export function DataExport() {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    dataTypes: {
      leads: true,
      deals: true,
      appointments: false,
      interactions: false,
      pipelineEntries: false
    },
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    includeMetadata: true
  });
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDataTypeChange = (type: keyof typeof options.dataTypes, checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      dataTypes: {
        ...prev.dataTypes,
        [type]: checked
      }
    }));
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle commas and quotes in data
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
  };

  const fetchData = async (type: keyof typeof options.dataTypes) => {
    if (!user) return [];

    try {
      let data = [];
      
      switch (type) {
        case 'leads':
          const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*')
            .gte('created_at', options.dateRange.start)
            .lte('created_at', options.dateRange.end);
          
          if (leadsError) throw leadsError;
          data = leadsData || [];
          break;

        case 'deals':
          const { data: dealsData, error: dealsError } = await supabase
            .from('deals')
            .select(`
              *,
              leads!inner(user_id)
            `)
            .eq('leads.user_id', user.id)
            .gte('created_at', options.dateRange.start)
            .lte('created_at', options.dateRange.end);
          
          if (dealsError) throw dealsError;
          data = dealsData || [];
          break;

        case 'appointments':
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              *,
              leads!inner(user_id)
            `)
            .eq('leads.user_id', user.id)
            .gte('start_at', options.dateRange.start)
            .lte('start_at', options.dateRange.end);
          
          if (appointmentsError) throw appointmentsError;
          data = appointmentsData || [];
          break;

        case 'interactions':
          const { data: interactionsData, error: interactionsError } = await supabase
            .from('interactions')
            .select(`
              *,
              leads!inner(user_id)
            `)
            .eq('leads.user_id', user.id)
            .gte('timestamp', options.dateRange.start)
            .lte('timestamp', options.dateRange.end);
          
          if (interactionsError) throw interactionsError;
          data = interactionsData || [];
          break;

        case 'pipelineEntries':
          const { data: entriesData, error: entriesError } = await supabase
            .from('lead_pipeline_entries')
            .select(`
              *,
              leads!inner(user_id)
            `)
            .eq('leads.user_id', user.id)
            .gte('created_at', options.dateRange.start)
            .lte('created_at', options.dateRange.end);
          
          if (entriesError) throw entriesError;
          data = entriesData || [];
          break;

        default:
          return [];
      }

      return data;
    } catch (error) {
      console.error(`Erro ao buscar dados de ${type}:`, error);
      return [];
    }
  };

  const handleExport = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    const selectedTypes = Object.entries(options.dataTypes)
      .filter(([_, selected]) => selected)
      .map(([type, _]) => type);

    if (selectedTypes.length === 0) {
      toast({
        title: "Nenhum tipo de dado selecionado",
        description: "Selecione pelo menos um tipo de dado para exportar",
        variant: "destructive"
      });
      return;
    }

    setExporting(true);

    try {
      const exportPromises = selectedTypes.map(async (type) => {
        const data = await fetchData(type as keyof typeof options.dataTypes);
        
        if (options.includeMetadata) {
          data.forEach((row: any) => {
            row._exported_at = new Date().toISOString();
            row._exported_by = user.email;
            row._export_date_range = `${options.dateRange.start} to ${options.dateRange.end}`;
          });
        }

        return { type, data };
      });

      const results = await Promise.all(exportPromises);
      
      // Export each data type
      results.forEach(({ type, data }) => {
        if (data.length === 0) {
          toast({
            title: `Nenhum dado encontrado para ${type}`,
            description: `Não há registros no período selecionado`,
            variant: "destructive"
          });
          return;
        }

        const filename = `${type}_${options.dateRange.start}_to_${options.dateRange.end}`;
        
        if (options.format === 'csv') {
          exportToCSV(data, filename);
        } else if (options.format === 'json') {
          exportToJSON(data, filename);
        }
      });

      const totalRecords = results.reduce((sum, { data }) => sum + data.length, 0);
      
      toast({
        title: "Exportação concluída",
        description: `${totalRecords} registros exportados com sucesso`,
      });

    } catch (error) {
      console.error('Erro durante exportação:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Dados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Exporte seus dados para análise externa ou backup
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Formato de Exportação</Label>
          <Select value={options.format} onValueChange={(value: any) => setOptions(prev => ({ ...prev, format: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel/Sheets)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON (Programação)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Data Types */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tipos de Dados
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leads"
                checked={options.dataTypes.leads}
                onCheckedChange={(checked) => handleDataTypeChange('leads', checked as boolean)}
              />
              <Label htmlFor="leads" className="text-sm">Leads</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="deals"
                checked={options.dataTypes.deals}
                onCheckedChange={(checked) => handleDataTypeChange('deals', checked as boolean)}
              />
              <Label htmlFor="deals" className="text-sm">Deals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="appointments"
                checked={options.dataTypes.appointments}
                onCheckedChange={(checked) => handleDataTypeChange('appointments', checked as boolean)}
              />
              <Label htmlFor="appointments" className="text-sm">Agendamentos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="interactions"
                checked={options.dataTypes.interactions}
                onCheckedChange={(checked) => handleDataTypeChange('interactions', checked as boolean)}
              />
              <Label htmlFor="interactions" className="text-sm">Interações</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pipelineEntries"
                checked={options.dataTypes.pipelineEntries}
                onCheckedChange={(checked) => handleDataTypeChange('pipelineEntries', checked as boolean)}
              />
              <Label htmlFor="pipelineEntries" className="text-sm">Histórico Pipeline</Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">Data Inicial</Label>
              <input
                id="start-date"
                type="date"
                value={options.dateRange.start}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">Data Final</Label>
              <input
                id="end-date"
                type="date"
                value={options.dateRange.end}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Additional Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeMetadata"
              checked={options.includeMetadata}
              onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))}
            />
            <Label htmlFor="includeMetadata" className="text-sm">
              Incluir metadados de exportação
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Adiciona informações como data/hora da exportação e usuário responsável
          </p>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={exporting}
          className="w-full"
        >
          {exporting ? (
            <>
              <Database className="h-4 w-4 mr-2 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar Dados
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}