import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ProcessedData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

export function useFileProcessor() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File): Promise<ProcessedData | null> => {
    setProcessing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Pegar a primeira planilha
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Converter para JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (jsonData.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados.',
          variant: 'destructive',
        });
        return null;
      }

      // Primeira linha como cabeçalhos
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));

      if (rows.length === 0) {
        toast({
          title: 'Nenhum dado encontrado',
          description: 'O arquivo não contém linhas de dados.',
          variant: 'destructive',
        });
        return null;
      }

      toast({
        title: 'Arquivo processado',
        description: `${rows.length} linhas encontradas.`,
      });

      return {
        headers,
        rows,
        fileName: file.name,
      };
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: 'Erro ao processar arquivo',
        description: error.message || 'Formato de arquivo inválido.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  return {
    processFile,
    processing,
  };
}
