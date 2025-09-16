import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { 
  Wrench, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  LogOut,
  User,
  Settings,
  BarChart3,
  FileText,
  Shield,
  UserPlus
} from "lucide-react";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { users, loading: usersLoading, promoteToAdmin } = useAdmin();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      console.log('Iniciando logout...');
      await signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
      // Force redirect even if logout fails
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  // Mock data
  const stats = {
    totalUsers: 1248,
    activeWorkers: 342,
    activeClients: 906,
    totalOrders: 2156,
    completedOrders: 1893,
    pendingOrders: 263,
    revenue: 89450,
    avgOrderValue: 145
  };

  const recentOrders = [
    {
      id: "#2156",
      client: "Maria Silva",
      worker: "João Santos",
      service: "Guarda-roupa 6 portas",
      status: "completed",
      value: 180,
      date: "2024-09-20"
    },
    {
      id: "#2155",
      client: "Carlos Lima", 
      worker: "Ana Costa",
      service: "Mesa de jantar + cadeiras",
      status: "in_progress",
      value: 150,
      date: "2024-09-20"
    },
    {
      id: "#2154",
      client: "Fernanda Oliveira",
      worker: "Pedro Silva",
      service: "Estante modulada",
      status: "awaiting_payment",
      value: 200,
      date: "2024-09-19"
    }
  ];

  const pendingWithdrawals = [
    {
      id: "#W123",
      worker: "João Santos",
      amount: 850,
      requestDate: "2024-09-19",
      pixKey: "joao@email.com"
    },
    {
      id: "#W124", 
      worker: "Ana Costa",
      amount: 620,
      requestDate: "2024-09-19",
      pixKey: "11999999999"
    },
    {
      id: "#W125",
      worker: "Pedro Silva", 
      amount: 1200,
      requestDate: "2024-09-18",
      pixKey: "12345678901"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      case "awaiting_payment":
        return <Badge variant="outline">Aguardando pagamento</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">YOULY Admin</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo 📊</h1>
          <p className="text-muted-foreground">Visão geral da plataforma YOULY.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Totais</p>
                  <h3 className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</h3>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm text-success">+12% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Concluídos</p>
                  <h3 className="text-2xl font-bold">{stats.completedOrders.toLocaleString()}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {stats.pendingOrders} pendentes
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <h3 className="text-2xl font-bold">R$ {stats.revenue.toLocaleString()}</h3>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Ticket médio: R$ {stats.avgOrderValue}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Montadores Ativos</p>
                  <h3 className="text-2xl font-bold">{stats.activeWorkers}</h3>
                </div>
                <Wrench className="w-8 h-8 text-primary" />
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {Math.round((stats.activeWorkers / stats.totalUsers) * 100)}% do total
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="payments">Saques</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>Últimas transações da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{order.id}</p>
                          <p className="text-sm text-muted-foreground">{order.service}</p>
                        </div>
                        <div className="text-sm">
                          <p><strong>Cliente:</strong> {order.client}</p>
                          <p><strong>Montador:</strong> {order.worker}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(order.status)}
                        <div className="text-right">
                          <p className="font-bold">R$ {order.value}</p>
                          <p className="text-sm text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Gerenciar Usuários
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('/admin/register', '_blank')}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Criar Admin
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Promova usuários para administradores ou visualize informações dos usuários
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                          <div className="flex-1">
                            <p className="font-medium">{user.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.role === 'client' ? 'Cliente' : 
                               user.role === 'montador' ? 'Montador' : 'Administrador'} • 
                              Cadastrado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={user.role === 'admin' ? 'default' : 'secondary'}
                              className={user.role === 'admin' ? 'bg-gradient-primary text-primary-foreground' : ''}
                            >
                              {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                              {user.role === 'client' ? 'Cliente' : 
                               user.role === 'montador' ? 'Montador' : 'Admin'}
                            </Badge>
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteToAdmin(user.user_id)}
                                className="text-xs"
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                Promover a Admin
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && (
                        <Alert>
                          <Users className="h-4 w-4" />
                          <AlertDescription>
                            Nenhum usuário encontrado no sistema.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Clientes Ativos</CardTitle>
                    <CardDescription>{stats.activeClients} usuários</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Novos este mês</span>
                        <Badge variant="secondary">+127</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Taxa de retenção</span>
                        <Badge className="bg-success text-success-foreground">85%</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Montadores Verificados</CardTitle>
                    <CardDescription>{stats.activeWorkers} profissionais</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Pendentes aprovação</span>
                        <Badge variant="outline">12</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Avaliação média</span>
                        <Badge className="bg-warning text-warning-foreground">4.8/5</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Solicitações de Saque</CardTitle>
                    <CardDescription>Pagamentos pendentes para montadores</CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {pendingWithdrawals.length} pendentes
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{withdrawal.worker}</p>
                          <p className="text-sm text-muted-foreground">
                            Chave PIX: {withdrawal.pixKey}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg">R$ {withdrawal.amount}</p>
                          <p className="text-sm text-muted-foreground">{withdrawal.requestDate}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Rejeitar</Button>
                          <Button size="sm" className="bg-success hover:bg-success/90">
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Relatório Financeiro</h3>
                      <p className="text-sm text-muted-foreground">Receitas e comissões</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Relatório de Usuários</h3>
                      <p className="text-sm text-muted-foreground">Crescimento e atividade</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Auditoria</h3>
                      <p className="text-sm text-muted-foreground">Logs e segurança</p>
                    </div>
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;