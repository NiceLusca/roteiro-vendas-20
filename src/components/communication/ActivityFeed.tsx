import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Activity,
  Clock,
  Filter,
  CheckCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useActivityFeed, ActivityItem } from '@/hooks/useActivityFeed';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  targetId?: string;
  types?: ActivityItem['type'][];
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function ActivityFeed({ 
  targetId, 
  types, 
  limit = 50, 
  showHeader = true,
  className 
}: ActivityFeedProps) {
  const [selectedTypes, setSelectedTypes] = useState<ActivityItem['type'][]>(types || []);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    activities,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getActivityIcon,
    getActivityColor,
    formatRelativeTime,
    refetch
  } = useActivityFeed({
    targetId,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    limit,
    realtime: true
  });

  const filteredActivities = showUnreadOnly 
    ? activities.filter(activity => !activity.read)
    : activities;

  const handleActivityClick = (activity: ActivityItem) => {
    if (!activity.read) {
      markAsRead([activity.id]);
    }
    
    // Navigate to the target entity
    const baseUrl = getNavigationUrl(activity);
    if (baseUrl) {
      window.location.href = baseUrl;
    }
  };

  const getNavigationUrl = (activity: ActivityItem): string | null => {
    switch (activity.target_type) {
      case 'lead':
        return `/leads/${activity.target_id}`;
      case 'appointment':
        return `/agenda`;
      case 'deal':
        return `/deals`;
      default:
        return null;
    }
  };

  const getActivityTitle = (activity: ActivityItem): string => {
    switch (activity.type) {
      case 'lead_created':
        return 'Novo Lead Criado';
      case 'lead_updated':
        return 'Lead Atualizado';
      case 'stage_advanced':
        return 'Etapa Avançada';
      case 'appointment_scheduled':
        return 'Agendamento Realizado';
      case 'deal_created':
        return 'Nova Negociação';
      case 'note_added':
        return 'Nota Adicionada';
      case 'pipeline_transfer':
        return 'Transferência de Pipeline';
      default:
        return 'Atividade';
    }
  };

  const getActorInitials = (actor: string): string => {
    return actor
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const typeFilters: Array<{ value: ActivityItem['type']; label: string }> = [
    { value: 'lead_created', label: 'Leads Criados' },
    { value: 'lead_updated', label: 'Leads Atualizados' },
    { value: 'stage_advanced', label: 'Etapas Avançadas' },
    { value: 'appointment_scheduled', label: 'Agendamentos' },
    { value: 'deal_created', label: 'Negociações' },
    { value: 'note_added', label: 'Notas' },
    { value: 'pipeline_transfer', label: 'Transferências' }
  ];

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Feed de Atividades
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>

            <div className="flex items-center gap-2">
              {/* Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {selectedTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedTypes.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showUnreadOnly ? 'Mostrar Todas' : 'Apenas Não Lidas'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  {typeFilters.map(filter => (
                    <DropdownMenuItem
                      key={filter.value}
                      onClick={() => {
                        if (selectedTypes.includes(filter.value)) {
                          setSelectedTypes(prev => prev.filter(t => t !== filter.value));
                        } else {
                          setSelectedTypes(prev => [...prev, filter.value]);
                        }
                      }}
                    >
                      <span className="mr-2">
                        {selectedTypes.includes(filter.value) ? '✓' : '○'}
                      </span>
                      {filter.label}
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setSelectedTypes([])}>
                    <Archive className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar Todas
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse" />
                    <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {showUnreadOnly ? 'Nenhuma atividade não lida' : 'Nenhuma atividade encontrada'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors',
                    !activity.read && 'bg-primary/5 border-l-4 border-l-primary'
                  )}
                  onClick={() => handleActivityClick(activity)}
                >
                  {/* Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn('text-xs font-medium', getActivityColor(activity.type))}>
                      {getActorInitials(activity.actor)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <span className="text-base">{getActivityIcon(activity.type)}</span>
                        {getActivityTitle(activity)}
                        {!activity.read && (
                          <Badge variant="secondary" className="text-xs">
                            Nova
                          </Badge>
                        )}
                      </h4>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-auto p-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!activity.read && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead([activity.id]);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marcar como lida
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                const url = getNavigationUrl(activity);
                                if (url) window.location.href = url;
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>{activity.actor}</strong> {activity.description}
                    </p>
                    
                    <p className="text-xs text-muted-foreground">
                      {activity.target_type}: <strong>{activity.target_name}</strong>
                    </p>

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {Object.entries(activity.metadata).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="truncate">
                            <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}