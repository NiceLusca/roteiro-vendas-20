import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Settings, Trash2 } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
}

interface UserWithRoles {
  profile: Profile;
  roles: UserRole[];
}

export function RoleManager() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const { toast } = useToast();

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);

      // Buscar perfis de usuário
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Buscar roles de usuário
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combinar dados
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        profile,
        roles: (roles || []).filter(role => role.user_id === profile.id)
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Erro ao buscar usuários e roles:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar usuários e permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: 'admin' | 'moderator' | 'user') => {
    try {
      // Verificar se o usuário já tem esse role
      const existingRole = users
        .find(u => u.profile.id === userId)
        ?.roles.find(r => r.role === role);

      if (existingRole) {
        toast({
          title: "Aviso",
          description: "O usuário já possui esta permissão",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão atribuída com sucesso"
      });

      fetchUsersAndRoles();
    } catch (error) {
      console.error('Erro ao atribuir role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atribuir a permissão",
        variant: "destructive"
      });
    }
  };

  const removeRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão removida com sucesso"
      });

      fetchUsersAndRoles();
    } catch (error) {
      console.error('Erro ao remover role:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a permissão",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return "destructive";
      case 'manager':
        return "default";
      case 'user':
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      moderator: 'Moderador',
      user: 'Usuário'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleDescription = (role: string) => {
    const descriptions = {
      admin: 'Acesso total ao sistema, incluindo configurações de segurança',
      moderator: 'Acesso a relatórios e gestão de equipe',
      user: 'Acesso básico às funcionalidades do sistema'
    };
    return descriptions[role as keyof typeof descriptions] || '';
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Carregando usuários...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Gestão de Permissões</h2>
        <p className="text-muted-foreground">
          Gerencie roles e permissões dos usuários do sistema
        </p>
      </div>

      {/* Informações sobre Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Administrador</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription('admin')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Moderador</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription('moderator')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-secondary" />
              <CardTitle className="text-lg">Usuário</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {getRoleDescription('user')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Visualize e gerencie as permissões de cada usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.profile.full_name || 'Nome não definido'}</div>
                    <div className="text-sm text-muted-foreground">{user.profile.email}</div>
                    <div className="flex gap-2 mt-2">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">Sem permissões</Badge>
                      ) : (
                        user.roles.map((role) => (
                          <div key={role.id} className="flex items-center gap-2">
                            <Badge variant={getRoleBadgeVariant(role.role)}>
                              {getRoleLabel(role.role)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRole(role.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => assignRole(user.profile.id, selectedRole)}
                      size="sm"
                    >
                      Atribuir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}