import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  UserPlus,
  Crown,
  Star,
  TrendingUp,
  Target,
  Clock,
  MessageSquare,
  Phone,
  Mail,
  MoreHorizontal,
  Award,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  performance: {
    leadsAssigned: number;
    leadsConverted: number;
    conversionRate: number;
    averageResponseTime: number; // in minutes
    activeTasks: number;
    completedTasks: number;
  };
  permissions: string[];
  joinedAt: Date;
}

interface TeamActivity {
  id: string;
  memberId: string;
  memberName: string;
  type: 'lead_assigned' | 'lead_converted' | 'task_completed' | 'note_added' | 'meeting_scheduled';
  description: string;
  timestamp: Date;
  targetId?: string;
  targetName?: string;
}

interface TeamCollaborationProps {
  className?: string;
  leadId?: string;
  showCompact?: boolean;
}

export function TeamCollaboration({ className, leadId, showCompact = false }: TeamCollaborationProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamActivities, setTeamActivities] = useState<TeamActivity[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Ana Silva',
        email: 'ana.silva@empresa.com',
        avatar: '',
        role: 'manager',
        status: 'online',
        lastSeen: new Date(),
        performance: {
          leadsAssigned: 45,
          leadsConverted: 32,
          conversionRate: 71,
          averageResponseTime: 12,
          activeTasks: 8,
          completedTasks: 67
        },
        permissions: ['manage_leads', 'view_reports', 'manage_team'],
        joinedAt: new Date(2024, 0, 15)
      },
      {
        id: '2',
        name: 'Carlos Santos',
        email: 'carlos.santos@empresa.com',
        avatar: '',
        role: 'agent',
        status: 'away',
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
        performance: {
          leadsAssigned: 38,
          leadsConverted: 24,
          conversionRate: 63,
          averageResponseTime: 18,
          activeTasks: 12,
          completedTasks: 45
        },
        permissions: ['manage_leads', 'view_own_reports'],
        joinedAt: new Date(2024, 1, 8)
      },
      {
        id: '3',
        name: 'Maria Costa',
        email: 'maria.costa@empresa.com',
        avatar: '',
        role: 'agent',
        status: 'busy',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        performance: {
          leadsAssigned: 52,
          leadsConverted: 41,
          conversionRate: 79,
          averageResponseTime: 9,
          activeTasks: 6,
          completedTasks: 89
        },
        permissions: ['manage_leads', 'view_own_reports'],
        joinedAt: new Date(2024, 2, 22)
      }
    ];

    const mockActivities: TeamActivity[] = [
      {
        id: '1',
        memberId: '3',
        memberName: 'Maria Costa',
        type: 'lead_converted',
        description: 'converteu um lead em cliente',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        targetId: 'lead-123',
        targetName: 'João Oliveira'
      },
      {
        id: '2',
        memberId: '1',
        memberName: 'Ana Silva',
        type: 'lead_assigned',
        description: 'atribuiu um lead para Carlos Santos',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        targetId: 'lead-124',
        targetName: 'Empresa XYZ'
      },
      {
        id: '3',
        memberId: '2',
        memberName: 'Carlos Santos',
        type: 'task_completed',
        description: 'completou uma tarefa de follow-up',
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      }
    ];

    setTeamMembers(mockMembers);
    setTeamActivities(mockActivities);
  }, []);

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4 text-warning" />;
      case 'manager': return <Star className="h-4 w-4 text-primary" />;
      case 'agent': return <Users className="h-4 w-4 text-muted-foreground" />;
      case 'viewer': return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRoleLabel = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'agent': return 'Agente';
      case 'viewer': return 'Visualizador';
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'busy': return 'bg-destructive';
      case 'offline': return 'bg-muted-foreground';
    }
  };

  const getStatusLabel = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Ausente';
      case 'busy': return 'Ocupado';
      case 'offline': return 'Offline';
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Online agora';
    if (diffInMinutes < 60) return `Visto há ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Visto há ${Math.floor(diffInMinutes / 60)}h`;
    return `Visto há ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getActivityIcon = (type: TeamActivity['type']) => {
    switch (type) {
      case 'lead_assigned': return <UserPlus className="h-4 w-4 text-primary" />;
      case 'lead_converted': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'task_completed': return <Award className="h-4 w-4 text-info" />;
      case 'note_added': return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
      case 'meeting_scheduled': return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 75) return 'text-success';
    if (rate >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const topPerformer = teamMembers.reduce((top, member) => 
    member.performance.conversionRate > (top?.performance.conversionRate || 0) ? member : top
  , teamMembers[0]);

  if (showCompact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe ({teamMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamMembers.slice(0, 3).map(member => (
            <div key={member.id} className="flex items-center gap-2">
              <div className="relative">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar} />
                  <AvatarFallback className="text-xs">
                    {member.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background',
                  getStatusColor(member.status)
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.performance.conversionRate}% conversão
                </p>
              </div>
            </div>
          ))}
          {teamMembers.length > 3 && (
            <p className="text-xs text-muted-foreground text-center">
              +{teamMembers.length - 3} membros
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboração em Equipe
          </CardTitle>
          
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Membro da Equipe</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Convide novos membros para colaborar no seu pipeline de vendas.
                </p>
                {/* Invite form would go here */}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        'absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background',
                        getStatusColor(member.status)
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        {getRoleIcon(member.role)}
                        {member.id === topPerformer?.id && (
                          <Zap className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1">
                        {member.email}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getRoleLabel(member.role)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusLabel(member.status)}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={cn('text-sm font-medium', getPerformanceColor(member.performance.conversionRate))}>
                        {member.performance.conversionRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatLastSeen(member.lastSeen)}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar mensagem
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="h-4 w-4 mr-2" />
                          Fazer chamada
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          Ver perfil completo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="performance">
            <ScrollArea className="h-80">
              <div className="space-y-4">
                {teamMembers.map(member => (
                  <div key={member.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="text-xs">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {member.performance.leadsAssigned} leads atribuídos
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Taxa de Conversão</span>
                          <span className={getPerformanceColor(member.performance.conversionRate)}>
                            {member.performance.conversionRate}%
                          </span>
                        </div>
                        <Progress value={member.performance.conversionRate} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground">Convertidos</p>
                          <p className="font-medium">{member.performance.leadsConverted}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tempo Resposta</p>
                          <p className="font-medium">{member.performance.averageResponseTime}min</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tarefas Ativas</p>
                          <p className="font-medium">{member.performance.activeTasks}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Concluídas</p>
                          <p className="font-medium">{member.performance.completedTasks}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity">
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {teamActivities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <strong>{activity.memberName}</strong> {activity.description}
                        {activity.targetName && (
                          <span className="text-muted-foreground"> para {activity.targetName}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatLastSeen(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}