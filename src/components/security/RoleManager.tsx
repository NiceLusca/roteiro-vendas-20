import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Settings, Trash2, Pencil } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  nome: string | null;
}

interface UserWithRoles {
  profile: Profile;
  roles: UserRole[];
}

export function RoleManager() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, 'admin' | 'moderator' | 'user'>>({});
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getSelectedRole = (userId: string) => selectedRoles[userId] || 'user';
  const setSelectedRole = (userId: string, role: 'admin' | 'moderator' | 'user') => {
    setSelectedRoles(prev => ({ ...prev, [userId]: role }));
  };

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);

      // Buscar perfis de usuário
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, nome');

      if (profilesError) throw profilesError;

      // Buscar roles de usuário
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combinar dados - CORRIGIDO: usar user_id em vez de id
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        profile,
        roles: (roles || []).filter(role => role.user_id === profile.user_id)
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
      // Verificar se o usuário já tem esse role - CORRIGIDO: usar user_id
      const existingRole = users
        .find(u => u.profile.user_id === userId)
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

  const openEditDialog = (profile: Profile) => {
    setEditingUser(profile);
    setEditName(profile.nome || profile.full_name || '');
  };

  const closeEditDialog = () => {
    setEditingUser(null);
    setEditName('');
  };

  const updateProfile = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          nome: editName,
          full_name: editName 
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso"
      });

      closeEditDialog();
      fetchUsersAndRoles();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return "destructive";
      case 'moderator':
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

  const getDisplayName = (profile: Profile) => {
    return profile.nome || profile.full_name || 'Nome não definido';
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
                <div key={user.profile.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{getDisplayName(user.profile)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(user.profile)}
                        className="h-6 w-6 p-0"
                        title="Editar usuário"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">{user.profile.email}</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline">Sem permissões</Badge>
                      ) : (
                        user.roles.map((role) => (
                          <div key={role.id} className="flex items-center gap-1">
                            <Badge variant={getRoleBadgeVariant(role.role)}>
                              {getRoleLabel(role.role)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeRole(role.id)}
                              className="h-6 w-6 p-0"
                              title="Remover permissão"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Adicionar permissão:</span>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={getSelectedRole(user.profile.user_id)} 
                        onValueChange={(value: 'admin' | 'moderator' | 'user') => setSelectedRole(user.profile.user_id, value)}
                      >
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
                        onClick={() => assignRole(user.profile.user_id, getSelectedRole(user.profile.user_id))}
                        size="sm"
                      >
                        Atribuir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição de Usuário */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={editingUser?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado por segurança
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button onClick={updateProfile} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
