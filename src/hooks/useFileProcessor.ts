import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

interface ProcessedData {
  headers: string[];
  rows: any[][];
  fileName: string;
}

// Função para corrigir encoding UTF-8 incorreto
function fixEncoding(text: any): any {
  if (typeof text !== 'string') return text;
  
  try {
    // Detecta se é um problema comum de encoding UTF-8
    // Quando lê ISO-8859-1/Windows-1252 como UTF-8
    const hasEncodingIssue = /[ÃÂ][^\s]{1,2}/.test(text);
    
    if (hasEncodingIssue) {
      // Converte de volta para bytes e reinterpreta como UTF-8
      const bytes = new Uint8Array([...text].map(char => char.charCodeAt(0)));
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(bytes);
    }
    
    return text;
  } catch (error) {
    // Se falhar, retorna o texto original
    return text;
  }
}

export function useFileProcessor() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File): Promise<ProcessedData | null> => {
    setProcessing(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { 
        type: 'array',
        raw: true, // Usar raw para ter controle sobre conversão
        codepage: 65001, // UTF-8
        cellDates: true
      });
      
      // Pegar a primeira planilha
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Converter para JSON com raw data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        raw: false
      }) as any[][];
      
      // Corrigir encoding em todos os valores
      const fixedData = jsonData.map(row => 
        row.map(cell => fixEncoding(cell))
      );
      
      if (fixedData.length === 0) {
        toast({
          title: 'Arquivo vazio',
          description: 'O arquivo não contém dados.',
          variant: 'destructive',
        });
        return null;
      }

      // Primeira linha como cabeçalhos
      const headers = fixedData[0] as string[];
      const rows = fixedData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));

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
