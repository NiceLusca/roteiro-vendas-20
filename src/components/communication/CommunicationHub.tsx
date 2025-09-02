import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Activity, 
  Users, 
  Bell,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ActivityFeed } from './ActivityFeed';
import { InAppMessaging } from './InAppMessaging';
import { TeamCollaboration } from './TeamCollaboration';
import { useRealtimeUpdates, commonRealtimeConfigs } from '@/hooks/useRealtimeUpdates';
import { cn } from '@/lib/utils';

interface CommunicationHubProps {
  className?: string;
  leadId?: string;
  defaultTab?: 'activity' | 'messages' | 'team';
  compact?: boolean;
}

export function CommunicationHub({ 
  className, 
  leadId, 
  defaultTab = 'activity',
  compact = false 
}: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // Set up real-time updates
  const { isConnected } = useRealtimeUpdates(
    commonRealtimeConfigs.all,
    (data) => {
      console.log('Real-time update received:', data);
      // Handle real-time updates here
    },
    realtimeEnabled
  );

  const tabCounts = {
    activity: 12, // Mock unread activity count
    messages: 3,  // Mock unread messages count
    team: 0       // No unread for team
  };

  if (compact && !isExpanded) {
    return (
      <div className={cn('fixed bottom-4 right-4 z-50', className)}>
        <Button
          onClick={() => setIsExpanded(true)}
          className="h-12 w-12 rounded-full shadow-lg relative"
        >
          <MessageCircle className="h-6 w-6" />
          {(tabCounts.activity + tabCounts.messages) > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {tabCounts.activity + tabCounts.messages}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      compact ? 'fixed bottom-4 right-4 z-50 w-96 shadow-xl' : 'w-full',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Central de Comunicação
            
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              <div className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-success animate-pulse' : 'bg-destructive'
              )} />
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Real-time Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRealtimeEnabled(!realtimeEnabled)}
              className={cn(
                'h-8 w-8 p-0',
                realtimeEnabled ? 'text-success' : 'text-muted-foreground'
              )}
            >
              <Bell className="h-4 w-4" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Expand/Collapse */}
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof defaultTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
            <TabsTrigger value="activity" className="relative">
              <Activity className="h-4 w-4 mr-2" />
              Atividades
              {tabCounts.activity > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {tabCounts.activity}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="messages" className="relative">
              <MessageCircle className="h-4 w-4 mr-2" />
              Mensagens
              {tabCounts.messages > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {tabCounts.messages}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Equipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-0">
            <ActivityFeed 
              targetId={leadId}
              showHeader={false}
              className="border-0 shadow-none"
            />
          </TabsContent>

          <TabsContent value="messages" className="mt-0">
            <InAppMessaging 
              leadId={leadId}
              className="border-0 shadow-none"
            />
          </TabsContent>

          <TabsContent value="team" className="mt-0">
            <TeamCollaboration 
              leadId={leadId}
              showCompact={compact}
              className="border-0 shadow-none"
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Quick Actions Bar */}
      {isExpanded && (
        <div className="border-t p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Última atualização: há 2 minutos
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Marcar todas como lidas
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                Configurações
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}