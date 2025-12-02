import React, { useState } from 'react';
import { Star, X, Plus, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLeadResponsibles, type LeadResponsible, type UserProfile } from '@/hooks/useLeadResponsibles';
import { getResponsibleColor, getInitials } from '@/utils/responsibleColors';

interface ResponsibleSelectorProps {
  leadId: string;
  performerName?: string;
}

export const ResponsibleSelector: React.FC<ResponsibleSelectorProps> = ({
  leadId,
  performerName,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const {
    responsibles,
    allUsers,
    loadingResponsibles,
    loadingUsers,
    assignResponsible,
    removeResponsible,
    setPrimaryResponsible,
  } = useLeadResponsibles(leadId);

  // Filtrar usuários que ainda não são responsáveis
  const availableUsers = allUsers.filter(
    (user) => !responsibles.some((r) => r.user_id === user.user_id)
  );

  const handleAssign = () => {
    if (!selectedUserId) return;
    
    assignResponsible.mutate({
      leadId,
      userId: selectedUserId,
      isPrimary: responsibles.length === 0, // Primeiro é automáticamente primary
      performedByName: performerName,
    });
    setSelectedUserId('');
  };

  const handleRemove = (responsible: LeadResponsible) => {
    const name = responsible.profile?.nome || responsible.profile?.full_name || 'Usuário';
    removeResponsible.mutate({
      leadId,
      userId: responsible.user_id,
      userName: name,
      performedByName: performerName,
    });
  };

  const handleSetPrimary = (responsible: LeadResponsible) => {
    if (responsible.is_primary) return;
    
    const name = responsible.profile?.nome || responsible.profile?.full_name || 'Usuário';
    setPrimaryResponsible.mutate({
      leadId,
      userId: responsible.user_id,
      userName: name,
      performedByName: performerName,
    });
  };

  if (loadingResponsibles || loadingUsers) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lista de responsáveis atuais */}
      <div className="space-y-2">
        {responsibles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic flex items-center gap-2">
            <User className="h-4 w-4" />
            Nenhum responsável atribuído
          </p>
        ) : (
          responsibles.map((responsible) => {
            const name = responsible.profile?.nome || responsible.profile?.full_name || 'Usuário';
            const color = getResponsibleColor(responsible.user_id);
            
            return (
              <div
                key={responsible.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`${color.bg} ${color.text} text-xs font-medium`}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{name}</p>
                    {responsible.profile?.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {responsible.profile.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {responsible.is_primary ? (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      Principal
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleSetPrimary(responsible)}
                      title="Definir como principal"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Principal
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(responsible)}
                    title="Remover responsável"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adicionar novo responsável */}
      {availableUsers.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecionar usuário..." />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.nome || user.full_name || user.email || 'Usuário'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedUserId || assignResponsible.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
      )}

      {availableUsers.length === 0 && responsibles.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Todos os usuários já foram atribuídos
        </p>
      )}
    </div>
  );
};
