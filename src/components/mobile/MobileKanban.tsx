import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabasePipelineStages } from '@/hooks/useSupabasePipelineStages';
import { useSupabaseLeadPipelineEntries } from '@/hooks/useSupabaseLeadPipelineEntries';
import { PipelineStage } from '@/types/crm';
import { ChevronRight, Filter, Plus } from 'lucide-react';

interface MobileKanbanProps {
  pipelineId: string;
}

export function MobileKanban({ pipelineId }: MobileKanbanProps) {
  const { stages } = useSupabasePipelineStages();
  const { entries } = useSupabaseLeadPipelineEntries();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const pipelineStages = stages
    .filter((stage: PipelineStage) => stage.pipeline_id === pipelineId)
    .sort((a: PipelineStage, b: PipelineStage) => a.ordem - b.ordem);

  const getEntriesForStage = (stageId: string) => {
    return entries.filter((entry: any) => entry.etapa_atual_id === stageId);
  };

  const StageOverview = () => (
    <div className="space-y-3">
      {pipelineStages.map((stage) => {
        const stageEntries = getEntriesForStage(stage.id);
        return (
          <Card key={stage.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedStage(stage.id)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-sm">{stage.nome}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {stageEntries.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{stageEntries.filter(e => e.saude_etapa === 'Verde').length} no prazo</span>
                    <span>•</span>
                    <span>{stageEntries.filter(e => e.saude_etapa === 'Amarelo').length} alerta</span>
                    <span>•</span>
                    <span>{stageEntries.filter(e => e.saude_etapa === 'Vermelho').length} atraso</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const StageDetail = ({ stageId }: { stageId: string }) => {
    const stage = pipelineStages.find(s => s.id === stageId);
    const stageEntries = getEntriesForStage(stageId);

    if (!stage) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{stage.nome}</h2>
            <p className="text-sm text-muted-foreground">{stageEntries.length} leads</p>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-3">
            {stageEntries.map((entry: any) => (
              <div key={entry.id} className="w-full">
                <Card className="w-full">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {entry.leads?.nome || 'Lead sem nome'}
                        </h4>
                        <Badge 
                          variant={
                            entry.saude_etapa === 'Verde' ? 'default' :
                            entry.saude_etapa === 'Amarelo' ? 'secondary' : 'destructive'
                          }
                          className="text-xs"
                        >
                          {entry.saude_etapa}
                        </Badge>
                      </div>
                      {entry.leads?.whatsapp && (
                        <p className="text-xs text-muted-foreground">
                          {entry.leads.whatsapp}
                        </p>
                      )}
                      {entry.nota_etapa && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {entry.nota_etapa}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {stageEntries.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum lead nesta etapa</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Mobile Tabs View */}
      <div className="lg:hidden">
        <Tabs value={selectedStage || 'overview'} onValueChange={(value) => setSelectedStage(value === 'overview' ? null : value)}>
          <div className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
                <TabsTrigger value={selectedStage || 'overview'} disabled={!selectedStage} className="text-xs">
                  {selectedStage ? pipelineStages.find(s => s.id === selectedStage)?.nome : 'Etapa'}
                </TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="p-4 mt-0">
            <StageOverview />
          </TabsContent>

          {selectedStage && (
            <TabsContent value={selectedStage} className="p-4 mt-0">
              <StageDetail stageId={selectedStage} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Desktop fallback */}
      <div className="hidden lg:block">
        <p className="text-center text-muted-foreground p-8">
          Use o componente desktop para visualização em telas maiores
        </p>
      </div>
    </div>
  );
}