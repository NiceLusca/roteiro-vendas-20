import React from 'react';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getResponsibleColor, getInitials } from '@/utils/responsibleColors';
import type { LeadResponsible } from '@/hooks/useLeadResponsibles';

interface ResponsibleAvatarsProps {
  responsibles: LeadResponsible[];
  maxDisplay?: number;
  size?: 'sm' | 'md';
}

export const ResponsibleAvatars: React.FC<ResponsibleAvatarsProps> = ({
  responsibles,
  maxDisplay = 3,
  size = 'sm',
}) => {
  if (!responsibles.length) {
    return (
      <span className="text-xs text-muted-foreground italic">
        Sem responsável
      </span>
    );
  }

  const displayedResponsibles = responsibles.slice(0, maxDisplay);
  const remainingCount = responsibles.length - maxDisplay;
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-1.5">
        {displayedResponsibles.map((responsible) => {
          const name = responsible.profile?.nome || responsible.profile?.full_name || 'Usuário';
          const color = getResponsibleColor(responsible.user_id);
          
          return (
            <Tooltip key={responsible.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className={`${sizeClass} border-2 border-background ring-1 ring-border/50`}>
                    <AvatarFallback 
                      className={`${color.bg} ${color.text} font-medium`}
                    >
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  {responsible.is_primary && (
                    <Star 
                      className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-400 text-yellow-400" 
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{name}</p>
                {responsible.is_primary && (
                  <p className="text-muted-foreground">Responsável principal</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={`${sizeClass} border-2 border-background bg-muted`}>
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  +{remainingCount}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>Mais {remainingCount} responsável{remainingCount > 1 ? 'eis' : ''}</p>
              {responsibles.slice(maxDisplay).map((r) => (
                <p key={r.id} className="text-muted-foreground">
                  {r.profile?.nome || r.profile?.full_name || 'Usuário'}
                </p>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};
