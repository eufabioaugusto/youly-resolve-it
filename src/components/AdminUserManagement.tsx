import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAdmin } from '@/hooks/useAdmin';
import { Shield, Search, UserCog, Mail, Phone } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AdminUserManagement() {
  const { users, loading, promoteToAdmin } = useAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [promoting, setPromoting] = useState<string | null>(null);

  const filteredUsers = users.filter(user => 
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telefone?.includes(searchTerm)
  );

  const handlePromote = async (userId: string) => {
    setPromoting(userId);
    await promoteToAdmin(userId);
    setPromoting(null);
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Gestão de Usuários
          </CardTitle>
          <CardDescription>
            Gerencie permissões e promova usuários a administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-3">
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

                    {user.role !== 'admin' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={promoting === user.user_id}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            {promoting === user.user_id ? 'Promovendo...' : 'Promover a Admin'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Promover a Administrador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja promover <strong>{user.nome}</strong> a administrador?
                              <br /><br />
                              Administradores têm acesso total ao sistema, incluindo:
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Gestão de todos os jobs e usuários</li>
                                <li>Acesso a informações financeiras</li>
                                <li>Capacidade de promover outros usuários</li>
                                <li>Liberação de pagamentos</li>
                              </ul>
                              <br />
                              Esta ação será registrada no sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handlePromote(user.user_id)}>
                              Confirmar Promoção
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {user.role === 'admin' && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrador
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum usuário encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
