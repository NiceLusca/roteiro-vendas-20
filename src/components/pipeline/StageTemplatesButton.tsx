import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, Bot, Settings } from 'lucide-react';
import { CommunicationTemplatesManager } from '@/components/templates/CommunicationTemplatesManager';

interface StageTemplatesButtonProps {
  stageId: string;
  stageName: string;
  pipelineId?: string;
  templateCount?: number;
  compact?: boolean;
}

export function StageTemplatesButton({ 
  stageId, 
  stageName, 
  pipelineId, 
  templateCount = 0,
  compact = false
}: StageTemplatesButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (compact) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 relative"
          >
            <MessageSquare className="h-3 w-3" />
            {templateCount > 0 && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs rounded-full"
              >
                {templateCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Templates de Comunicação - {stageName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <CommunicationTemplatesManager
              stageId={stageId}
              stageName={stageName}
              pipelineId={pipelineId}
              onClose={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-9">
          <MessageSquare className="h-4 w-4" />
          <span>Templates</span>
          {templateCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {templateCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Templates de Comunicação - {stageName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <CommunicationTemplatesManager
            stageId={stageId}
            stageName={stageName}
            pipelineId={pipelineId}
            onClose={() => setIsDialogOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}