import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';
import { Search, UserCog, Mail, Phone, Eye, MoreVertical, Trash2, Filter, Users, Wrench, User } from 'lucide-react';
import { AdminMontadorDetailsModal } from './AdminMontadorDetailsModal';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RoleFilter = 'todos' | 'montador' | 'client' | 'admin';

export function AdminUserManagement() {
  const { users, loading, fetchUsers } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('todos');
  const [selectedMontador, setSelectedMontador] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Buscar montadores pendentes
  const { data: montadoresPendentes, refetch: refetchPendentes } = useQuery({
    queryKey: ['montadores-pendentes'],
    queryFn: async () => {
      // Buscar montadores pendentes
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select('*')
        .eq('status_cadastro', 'pendente')
        .order('created_at', { ascending: false });

      if (montadoresError) throw montadoresError;
      if (!montadoresData) return [];

      // Buscar perfis dos montadores
      const userIds = montadoresData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      return montadoresData.map(m => {
        const profile = profilesData?.find(p => p.user_id === m.user_id);
        return {
          ...m,
          nome: profile?.nome || '',
          telefone: profile?.telefone || '',
          documento: profile?.documento || '',
          endereco: profile?.endereco || null
        };
      });
    }
  });

  // Filtrar usuários por busca e role
  const filteredUsers = users.filter(user => {
    // Filtro de busca
    const matchesSearch = user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefone?.includes(searchTerm);
    
    // Filtro de role
    const matchesRole = roleFilter === 'todos' || user.role === roleFilter;
    
    // Filtrar apenas usuários ativos (não pendentes)
    const notPending = user.role !== 'montador' || !montadoresPendentes?.some(m => m.user_id === user.user_id);
    
    return matchesSearch && matchesRole && notPending;
  });

  // Contadores por role
  const countByRole = {
    todos: users.filter(u => u.role !== 'montador' || !montadoresPendentes?.some(m => m.user_id === u.user_id)).length,
    montador: users.filter(u => u.role === 'montador' && !montadoresPendentes?.some(m => m.user_id === u.user_id)).length,
    client: users.filter(u => u.role === 'client').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  const filteredPendentes = montadoresPendentes?.filter(m =>
    m.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.telefone?.includes(searchTerm)
  ) || [];

  const handleViewDetails = (montador: any) => {
    setSelectedMontador(montador);
    setModalOpen(true);
  };

  const handleSuccess = () => {
    refetchPendentes();
    fetchUsers();
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      // Se for montador, desativar ao invés de deletar
      if (userToDelete.role === 'montador') {
        const { error } = await supabase
          .from('montadores')
          .update({ status: 'inativo', status_cadastro: 'reprovado' })
          .eq('user_id', userToDelete.user_id);

        if (error) throw error;
        toast.success('Montador removido com sucesso');
      } else {
        toast.error('Função disponível apenas para montadores no momento');
        return;
      }

      fetchUsers();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      toast.error('Erro ao remover usuário');
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { label: string; variant: any }> = {
      'admin': { label: 'Admin', variant: 'destructive' },
      'montador': { label: 'Montador', variant: 'default' },
      'client': { label: 'Cliente', variant: 'secondary' },
    };

    const config = variants[role] || { label: role, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5" />
              Gestão de Usuários
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os usuários cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ativos" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="ativos">
                  Usuários Ativos
                  {filteredUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{filteredUsers.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pendentes">
                  Novos Cadastros
                  {filteredPendentes.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{filteredPendentes.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mb-6 space-y-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtro por Tipo de Usuário */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>Filtrar por tipo:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={roleFilter === 'todos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('todos')}
                      className="gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Todos
                      <Badge variant="secondary" className="ml-1">{countByRole.todos}</Badge>
                    </Button>
                    <Button
                      variant={roleFilter === 'montador' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('montador')}
                      className="gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      Montadores
                      <Badge variant="secondary" className="ml-1">{countByRole.montador}</Badge>
                    </Button>
                    <Button
                      variant={roleFilter === 'client' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRoleFilter('client')}
                      className="gap-2"
                    >
                      <User className="w-4 h-4" />
                      Clientes
                      <Badge variant="secondary" className="ml-1">{countByRole.client}</Badge>
                    </Button>
                    {countByRole.admin > 0 && (
                      <Button
                        variant={roleFilter === 'admin' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setRoleFilter('admin')}
                        className="gap-2"
                      >
                        <UserCog className="w-4 h-4" />
                        Admins
                        <Badge variant="secondary" className="ml-1">{countByRole.admin}</Badge>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <TabsContent value="ativos" className="space-y-3">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="border bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{user.nome || 'Sem nome'}</h3>
                            {getRoleBadge(user.role)}
                          </div>
                          
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {user.telefone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {user.telefone}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" />
                              ID: {user.user_id.slice(0, 8)}...
                            </div>
                            <p className="text-xs">
                              Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum usuário encontrado</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pendentes" className="space-y-3">
                {filteredPendentes.map((montador) => (
                  <Card key={montador.id} className="border bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{montador.nome || 'Sem nome'}</h3>
                            <Badge variant="secondary">Aguardando Aprovação</Badge>
                          </div>
                          
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            {montador.telefone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {montador.telefone}
                              </div>
                            )}
                            {montador.documento && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                Doc: {montador.documento}
                              </div>
                            )}
                            <p className="text-xs">
                              Cadastrado em {new Date(montador.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleViewDetails(montador)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredPendentes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum cadastro pendente</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <AdminMontadorDetailsModal
        montador={selectedMontador}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário <strong>{userToDelete?.nome}</strong>?
              {userToDelete?.role === 'montador' && ' O montador será desativado e não poderá mais acessar o sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
