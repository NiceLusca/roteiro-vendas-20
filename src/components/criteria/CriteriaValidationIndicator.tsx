import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CriteriaValidationResult } from '@/types/advancedCriteria';

interface CriteriaValidationIndicatorProps {
  validationResults: CriteriaValidationResult[];
  canAdvance: boolean;
  compact?: boolean;
}

export function CriteriaValidationIndicator({ 
  validationResults, 
  canAdvance, 
  compact = false 
}: CriteriaValidationIndicatorProps) {
  const blockers = validationResults.filter(r => r.status === 'bloqueado');
  const pending = validationResults.filter(r => r.status === 'pendente');
  const passed = validationResults.filter(r => r.status === 'atendido');

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-1">
              {canAdvance ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {passed.length}/{validationResults.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">
                {canAdvance ? 'Pode avançar' : 'Avanço bloqueado'}
              </p>
              {blockers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-400">Bloqueadores:</p>
                  <ul className="text-xs space-y-1">
                    {blockers.map((b, i) => (
                      <li key={i}>• {b.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pending.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-400">Pendentes:</p>
                  <ul className="text-xs space-y-1">
                    {pending.map((p, i) => (
                      <li key={i}>• {p.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {canAdvance ? (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium text-green-700">Pode avançar</span>
          </>
        ) : (
          <>
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="font-medium text-red-700">Avanço bloqueado</span>
          </>
        )}
        <Badge variant="outline">
          {passed.length}/{validationResults.length} critérios
        </Badge>
      </div>

      {validationResults.length > 0 && (
        <div className="space-y-2">
          {blockers.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Critérios bloqueadores ({blockers.length})
                </span>
              </div>
              {blockers.map((blocker, index) => (
                <div key={index} className="pl-6 text-sm text-red-600">
                  • {blocker.message}
                </div>
              ))}
            </div>
          )}

          {pending.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700">
                  Critérios pendentes ({pending.length})
                </span>
              </div>
              {pending.map((pendingItem, index) => (
                <div key={index} className="pl-6 text-sm text-yellow-600">
                  • {pendingItem.message}
                </div>
              ))}
            </div>
          )}

          {passed.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Critérios atendidos ({passed.length})
                </span>
              </div>
              {passed.map((passedItem, index) => (
                <div key={index} className="pl-6 text-sm text-green-600">
                  • {passedItem.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}