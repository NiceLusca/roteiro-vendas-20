import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePipelineAccessManager } from '@/hooks/usePipelineAccess';
import { useSupabasePipelines } from '@/hooks/useSupabasePipelines';
import { Eye, Pencil, Settings, Shield, Users, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  nome: string | null;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
}

type AccessLevel = 'none' | 'view' | 'edit' | 'manage';

const accessLevelLabels: Record<AccessLevel, string> = {
  none: '—',
  view: 'Visualizar',
  edit: 'Editar',
  manage: 'Gerenciar'
};

const accessLevelIcons: Record<AccessLevel, React.ReactNode> = {
  none: null,
  view: <Eye className="h-3 w-3" />,
  edit: <Pencil className="h-3 w-3" />,
  manage: <Settings className="h-3 w-3" />
};

export function PipelineAccessManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [savingCell, setSavingCell] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { pipelines, loading: loadingPipelines } = useSupabasePipelines();
  const { allAccess, grantAccess, revokeAccess, loading: loadingAccess, refetch } = usePipelineAccessManager();

  const activePipelines = useMemo(() => 
    pipelines.filter(p => p.ativo), 
    [pipelines]
  );

  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true);
      
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('id, user_id, email, full_name, nome'),
        supabase.from('user_roles').select('user_id, role')
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar usuários",
        variant: "destructive"
      });
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const isUserAdmin = (userId: string): boolean => {
    return userRoles.some(r => r.user_id === userId && r.role === 'admin');
  };

  const getUserAccessLevel = (userId: string, pipelineId: string): AccessLevel => {
    const access = allAccess.find(a => a.user_id === userId && a.pipeline_id === pipelineId);
    return (access?.access_level as AccessLevel) || 'none';
  };

  const handleAccessChange = async (userId: string, pipelineId: string, newLevel: AccessLevel) => {
    const cellKey = `${userId}-${pipelineId}`;
    setSavingCell(cellKey);

    try {
      if (newLevel === 'none') {
        await revokeAccess(userId, pipelineId);
      } else {
        await grantAccess(userId, pipelineId, newLevel);
      }
      
      toast({
        title: "Acesso atualizado",
        description: newLevel === 'none' 
          ? "Acesso revogado com sucesso"
          : `Acesso alterado para "${accessLevelLabels[newLevel]}"`
      });
    } catch (error) {
      console.error('Error updating access:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o acesso",
        variant: "destructive"
      });
    } finally {
      setSavingCell(null);
    }
  };

  const getDisplayName = (profile: Profile) => {
    return profile.nome || profile.full_name || 'Nome não definido';
  };

  const nonAdminProfiles = useMemo(() => 
    profiles.filter(p => !isUserAdmin(p.user_id)),
    [profiles, userRoles]
  );

  const adminProfiles = useMemo(() => 
    profiles.filter(p => isUserAdmin(p.user_id)),
    [profiles, userRoles]
  );

  const isLoading = loadingProfiles || loadingPipelines || loadingAccess;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Acessos por Pipeline</h2>
        <p className="text-muted-foreground">
          Configure quais usuários podem acessar cada pipeline
        </p>
      </div>

      {/* Legenda de níveis */}
      <div className="flex flex-wrap gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Eye className="h-3 w-3" /> Visualizar
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pode ver o pipeline e seus leads</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <Pencil className="h-3 w-3" /> Editar
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pode editar leads e mover entre etapas</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default" className="gap-1">
                  <Settings className="h-3 w-3" /> Gerenciar
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pode gerenciar etapas e configurações do pipeline</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Admins - sempre têm acesso total */}
      {adminProfiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Administradores</CardTitle>
            </div>
            <CardDescription>
              Administradores têm acesso total a todos os pipelines automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {adminProfiles.map(profile => (
                <Badge key={profile.user_id} variant="outline" className="py-1.5">
                  <Shield className="h-3 w-3 mr-1 text-destructive" />
                  {getDisplayName(profile)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matriz de acessos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Matriz de Acessos</CardTitle>
          </div>
          <CardDescription>
            Defina o nível de acesso de cada usuário para cada pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nonAdminProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Todos os usuários são administradores</p>
              <p className="text-sm">Adicione usuários com role "Usuário" ou "Moderador" para configurar acessos</p>
            </div>
          ) : activePipelines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum pipeline ativo encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-w-full border rounded-lg">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-muted/50 backdrop-blur-sm z-20 min-w-[200px] border-r">
                      Usuário
                    </TableHead>
                    {activePipelines.map(pipeline => (
                      <TableHead key={pipeline.id} className="text-center min-w-[140px]">
                        <div className="truncate" title={pipeline.nome}>
                          {pipeline.nome}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nonAdminProfiles.map(profile => (
                    <TableRow key={profile.user_id}>
                      <TableCell className="sticky left-0 bg-muted/30 backdrop-blur-sm z-10 font-medium border-r">
                        <div>
                          <div className="truncate max-w-[180px]" title={getDisplayName(profile)}>
                            {getDisplayName(profile)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {profile.email}
                          </div>
                        </div>
                      </TableCell>
                      {activePipelines.map(pipeline => {
                        const cellKey = `${profile.user_id}-${pipeline.id}`;
                        const currentLevel = getUserAccessLevel(profile.user_id, pipeline.id);
                        const isSaving = savingCell === cellKey;

                        return (
                          <TableCell key={pipeline.id} className="text-center p-2">
                            <Select
                              value={currentLevel}
                              onValueChange={(value: AccessLevel) => 
                                handleAccessChange(profile.user_id, pipeline.id, value)
                              }
                              disabled={isSaving}
                            >
                              <SelectTrigger 
                                className={`w-full h-8 text-xs ${
                                  currentLevel === 'none' 
                                    ? 'text-muted-foreground' 
                                    : currentLevel === 'manage'
                                    ? 'border-primary'
                                    : ''
                                }`}
                              >
                                <SelectValue>
                                  <span className="flex items-center gap-1 justify-center">
                                    {accessLevelIcons[currentLevel]}
                                    {isSaving ? '...' : accessLevelLabels[currentLevel]}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="flex items-center gap-2">
                                    <X className="h-3 w-3 text-muted-foreground" />
                                    Sem acesso
                                  </span>
                                </SelectItem>
                                <SelectItem value="view">
                                  <span className="flex items-center gap-2">
                                    <Eye className="h-3 w-3" />
                                    Visualizar
                                  </span>
                                </SelectItem>
                                <SelectItem value="edit">
                                  <span className="flex items-center gap-2">
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                  </span>
                                </SelectItem>
                                <SelectItem value="manage">
                                  <span className="flex items-center gap-2">
                                    <Settings className="h-3 w-3" />
                                    Gerenciar
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
