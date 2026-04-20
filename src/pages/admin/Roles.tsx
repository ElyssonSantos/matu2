import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, Save, Search } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
}

const availableRoles = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' },
  { value: 'manager', label: 'Gerente', description: 'Gerenciar produtos, categorias e banners' },
  { value: 'seller', label: 'Vendedor', description: 'Visualizar pedidos' },
  { value: 'customer', label: 'Cliente', description: 'Acesso padrão' },
];

export default function Roles() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name');

    if (!profiles) {
      setLoading(false);
      return;
    }

    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id);

        return {
          id: profile.id,
          full_name: profile.full_name,
          email: authData?.user?.email || '',
          roles: rolesData?.map(r => r.role) || [],
        };
      })
    );

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const handleRoleToggle = async (userId: string, role: string, checked: boolean) => {
    setSaving(userId);

    if (checked) {
      // Add role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: role as any }]);

      if (error) {
        toast({
          title: 'Erro ao adicionar cargo',
          description: error.message,
          variant: 'destructive',
        });
        setSaving(null);
        return;
      }

      toast({ title: 'Cargo adicionado com sucesso!' });
    } else {
      // Remove role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role as any);

      if (error) {
        toast({
          title: 'Erro ao remover cargo',
          description: error.message,
          variant: 'destructive',
        });
        setSaving(null);
        return;
      }

      toast({ title: 'Cargo removido com sucesso!' });
    }

    setSaving(null);
    fetchUsers();
  };

  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.roles.some(role => role.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Cargos</h1>
        <p className="text-muted-foreground">Gerencie os cargos e permissões dos usuários</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como promover um usuário a admin via SQL:</strong>
          <pre className="mt-2 p-2 bg-muted rounded text-xs">
            {`UPDATE user_roles SET role = 'admin' WHERE user_id = 'SEU_USER_ID';`}
          </pre>
          Execute este comando no SQL Editor do Supabase para promover manualmente.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.full_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {availableRoles.find(r => r.value === role)?.label || role}
                    </Badge>
                  ))}
                </div>

                <div className="grid gap-3">
                  <Label className="text-base font-semibold">Atribuir Cargos:</Label>
                  {availableRoles.map((role) => (
                    <div key={role.value} className="flex items-start space-x-3">
                      <Checkbox
                        id={`${user.id}-${role.value}`}
                        checked={user.roles.includes(role.value)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(user.id, role.value, checked as boolean)
                        }
                        disabled={saving === user.id}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`${user.id}-${role.value}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {role.label}
                        </label>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {saving === user.id && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Save className="h-4 w-4 animate-pulse" />
                    Salvando...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}