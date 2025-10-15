import { useState } from 'react';
import { HelpCircle, X, BookOpen, Video, ExternalLink } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HelpContent {
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  videoUrl?: string;
  docsUrl?: string;
  relatedTopics?: Array<{
    title: string;
    url: string;
  }>;
}

interface ContextualHelpProps {
  content: HelpContent;
  trigger?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function ContextualHelp({ 
  content, 
  trigger,
  side = 'right',
  align = 'start',
  className 
}: ContextualHelpProps) {
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-auto p-1">
      <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      <PopoverContent 
        className={`w-80 ${className}`} 
        side={side} 
        align={align}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{content.title}</h4>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {content.description}
          </p>

          {/* Steps */}
          {content.steps && content.steps.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Como fazer:</h5>
              <ol className="space-y-1 text-sm text-muted-foreground">
                {content.steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <Badge variant="outline" className="text-xs min-w-6 h-5 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm">💡 Dicas:</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {content.videoUrl && (
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => window.open(content.videoUrl, '_blank')}
              >
                <Video className="h-4 w-4" />
                Assistir Vídeo Tutorial
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}

            {content.docsUrl && (
              <Button
                variant="outline"
                size="sm"
                className="justify-start gap-2"
                onClick={() => window.open(content.docsUrl, '_blank')}
              >
                <BookOpen className="h-4 w-4" />
                Ver Documentação
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            )}
          </div>

          {/* Related Topics */}
          {content.relatedTopics && content.relatedTopics.length > 0 && (
            <div className="space-y-2">
              <h5 className="font-medium text-sm">Tópicos Relacionados:</h5>
              <div className="flex flex-wrap gap-1">
                {content.relatedTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-auto py-1 px-2 text-xs"
                    onClick={() => window.open(topic.url, '_blank')}
                  >
                    {topic.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Predefined help contents for common features
export const helpContents = {
  pipelineKanban: {
    title: 'Kanban de Pipeline',
    description: 'Visualize e gerencie seus leads através do funil de vendas usando arrastar e soltar.',
    steps: [
      'Arraste cards de leads entre as colunas para avançar no pipeline',
      'Clique em um card para ver detalhes e editar informações',
      'Use os filtros no topo para encontrar leads específicos',
      'Configure as etapas do pipeline nas configurações'
    ],
    tips: [
      'Cards vermelhos indicam leads atrasados',
      'Use Ctrl+F para buscar rapidamente',
      'Duplo clique em um lead para abrir detalhes'
    ],
    videoUrl: '#',
    docsUrl: '#'
  },
  
  leadManagement: {
    title: 'Gerenciamento de Leads',
    description: 'Organize, acompanhe e converta seus prospects em clientes.',
    steps: [
      'Adicione novos leads manualmente ou através de integração',
      'Classifique leads por origem, interesse e prioridade',
      'Acompanhe interações e histórico de comunicação',
      'Configure automações para otimizar o processo'
    ],
    tips: [
      'Use tags para categorizar leads',
      'Agende follow-ups regularmente',
      'Mantenha notas atualizadas'
    ]
  },
  
  analytics: {
    title: 'Relatórios e Analytics',
    description: 'Monitore performance, identifique gargalos e otimize seus processos de vendas.',
    steps: [
      'Selecione o período desejado para análise',
      'Escolha as métricas relevantes',
      'Use filtros para segmentar dados',
      'Export relatórios em PDF ou Excel'
    ],
    tips: [
      'Acompanhe métricas semanalmente',
      'Compare períodos para identificar tendências',
      'Use dados para tomar decisões estratégicas'
    ]
  },
  
  automation: {
    title: 'Automação de Workflow',
    description: 'Configure regras automáticas para otimizar seus processos e economizar tempo.',
    steps: [
      'Defina triggers (eventos que iniciam a automação)',
      'Configure condições que devem ser atendidas',
      'Escolha as ações a serem executadas automaticamente',
      'Teste e monitore as automações criadas'
    ],
    tips: [
      'Comece com automações simples',
      'Monitore resultados regularmente',
      'Ajuste regras baseado na performance'
    ]
  }
};