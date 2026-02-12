import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminCarteiraGestao } from "@/components/AdminCarteiraGestao";
import { AdminJobManagement } from "@/components/AdminJobManagement";
import { AdminFinanceiro } from "@/components/AdminFinanceiro";
import { AdminRankingMontadores } from "@/components/AdminRankingMontadores";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { AdminSaques } from "@/components/AdminSaques";
import { AdminEstornos } from "@/components/AdminEstornos";
import { 
  Users, 
  DollarSign, 
  TrendingUp,
  Package,
  LogOut,
  Activity,
  Wrench,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [currentSection, setCurrentSection] = useState("overview");
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalMontadores: 0,
    activeMontadores: 0,
    totalClientes: 0,
    totalPagamentos: 0,
    valorTotalMovimentado: 0
  });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        { count: totalJobs },
        { count: activeJobs },
        { count: totalMontadores },
        { count: activeMontadores },
        { count: totalClientes },
        { count: totalPagamentosPagos },
        { data: pagamentosData }
      ] = await Promise.all([
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'aberto'),
        supabase.from('montadores').select('*', { count: 'exact', head: true }),
        supabase.from('montadores').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('pagamentos').select('*', { count: 'exact', head: true }).eq('status', 'pago'),
        supabase.from('pagamentos').select('valor_total').eq('status', 'pago')
      ]);

      const valorTotal = pagamentosData?.reduce((acc, p) => acc + (p.valor_total || 0), 0) || 0;
      
      console.log('📊 [AdminDashboard] Stats carregados:', {
        totalJobs,
        activeJobs,
        totalMontadores,
        activeMontadores,
        totalClientes,
        totalPagamentosPagos: totalPagamentosPagos,
        valorTotal
      });

      setStats({
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        totalMontadores: totalMontadores || 0,
        activeMontadores: activeMontadores || 0,
        totalClientes: totalClientes || 0,
        totalPagamentos: totalPagamentosPagos || 0,
        valorTotalMovimentado: valorTotal
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
    } catch (error) {
      console.error('Erro no logout:', error);
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case "users":
        return <AdminUserManagement />;
      case "jobs":
        return <AdminJobManagement />;
      case "ranking":
        return <AdminRankingMontadores />;
      case "financeiro":
        return (
          <div className="space-y-6">
            <AdminFinanceiro />
            <AdminCarteiraGestao />
          </div>
        );
      case "carteiras":
        return <AdminCarteiraGestao />;
      case "saques":
        return <AdminSaques />;
      case "estornos":
        return <AdminEstornos />;
      case "overview":
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Crescimento da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Jobs concluídos</span>
                    <span className="font-semibold text-green-600">
                      {stats.totalJobs - stats.activeJobs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Montadores ativos</span>
                    <span className="font-semibold">{stats.activeMontadores}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Volume processado</span>
                    <span className="font-semibold text-destructive">
                      {formatCurrency(stats.valorTotalMovimentado)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status da Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Sistema operacional</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span>Pagamentos funcionando</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Maturação ativa</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Webhooks conectados</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        <AdminSidebar
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card sticky top-0 z-10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger />
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Gestão da Plataforma YOULY</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </>
                  )}
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-6 py-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Jobs</p>
                        <h3 className="text-2xl font-bold">{stats.totalJobs}</h3>
                      </div>
                      <Package className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {stats.activeJobs} ativos
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Montadores</p>
                        <h3 className="text-2xl font-bold">{stats.totalMontadores}</h3>
                      </div>
                      <Users className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {stats.activeMontadores} ativos
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Clientes</p>
                        <h3 className="text-2xl font-bold">{stats.totalClientes}</h3>
                      </div>
                      <Users className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Volume Pago</p>
                        <h3 className="text-2xl font-bold">
                          {formatCurrency(stats.valorTotalMovimentado)}
                        </h3>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {stats.totalPagamentos} pagamentos pagos
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dynamic Content */}
              <div className="space-y-6">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}