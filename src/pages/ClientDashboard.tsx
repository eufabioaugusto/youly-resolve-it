import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Bell,
  LogOut,
  Users,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import JobDetailsModal from "@/components/JobDetailsModal";

const ClientDashboard = () => {
  const { signOut } = useAuth();
  const { profile, clienteProfile } = useProfile();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    if (clienteProfile) {
      fetchJobs();
    }
  }, [clienteProfile]);

  const fetchJobs = async () => {
    if (!clienteProfile) return;
    
    try {
      // Buscar jobs do cliente
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('cliente_id', clienteProfile.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      if (jobsData && jobsData.length > 0) {
        // Buscar montadores associados aos jobs
        const montadorIds = jobsData
          .filter(job => job.montador_id)
          .map(job => job.montador_id);

        let montadorData = [];
        if (montadorIds.length > 0) {
          const { data: montadores, error: montadoresError } = await supabase
            .from('montadores')
            .select('id, user_id, avaliacao_media')
            .in('id', montadorIds);

          if (montadoresError) throw montadoresError;

          // Buscar nomes dos montadores
          const userIds = montadores?.map(m => m.user_id) || [];
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, nome')
              .in('user_id', userIds);

            montadorData = montadores?.map(montador => ({
              ...montador,
              profiles: profiles?.find(p => p.user_id === montador.user_id) || { nome: 'Montador' }
            })) || [];
          }
        }

        // Buscar candidaturas para cada job
        const { data: candidaturas } = await supabase
          .from('candidaturas')
          .select('job_id')
          .in('job_id', jobsData.map(j => j.id));

        // Combinar os dados
        const jobsWithData = jobsData.map(job => ({
          ...job,
          montador: job.montador_id ? montadorData.find(m => m.id === job.montador_id) : null,
          candidaturas_count: candidaturas?.filter(c => c.job_id === job.id).length || 0
        }));

        setJobs(jobsWithData);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Erro ao buscar jobs:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="outline">Aberto</Badge>;
      case "aguardando_pagamento":
        return <Badge variant="outline">Aguardando pagamento</Badge>;
      case "em_andamento":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      case "concluido":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
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
            <span className="text-xl font-bold">YOULY</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <Link to="/cliente/perfil">
              <Button variant="ghost" size="icon">
                <User className="w-4 h-4" />
              </Button>
            </Link>
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
          <h1 className="text-3xl font-bold mb-2">Olá, {profile?.nome || 'Cliente'}! 👋</h1>
          <p className="text-muted-foreground">Aqui estão seus pedidos e atividades recentes.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link to="/criar-pedido">
            <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Novo Pedido</h3>
                    <p className="text-sm text-muted-foreground">Solicitar montagem</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer" onClick={() => navigate('/cliente/negociacoes')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Negociações</h3>
                  <p className="text-sm text-muted-foreground">Acompanhar orçamentos</p>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center relative">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{jobs.length}</h3>
                    <p className="text-sm text-muted-foreground">Pedidos ativos</p>
                  </div>
                  <Clock className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    R$ {jobs.reduce((total, job) => {
                      // Calcular economia baseada em valor estimado vs preço médio de mercado
                      const economia = job.valor_estimado ? job.valor_estimado * 0.15 : 0; // 15% de economia média
                      return total + economia;
                    }, 0).toFixed(2)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total economizado</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Meus Pedidos</CardTitle>
            <CardDescription>Acompanhe o status dos seus pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">Carregando pedidos...</div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum pedido encontrado.</p>
                  <Link to="/criar-pedido">
                    <Button className="mt-4 bg-gradient-primary">Criar primeiro pedido</Button>
                  </Link>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{job.descricao}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.endereco?.rua}, {job.endereco?.bairro}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(job.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        {job.montador && (
                          <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{job.montador.profiles?.nome || 'Montador'}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-warning text-warning" />
                              <span className="text-sm">{job.montador.avaliacao_media?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          {getStatusBadge(job.status)}
                          {job.valor_estimado && (
                            <span className="font-bold text-lg">R$ {job.valor_estimado}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setDetailsModalOpen(true);
                        }}
                      >
                        Ver detalhes
                      </Button>
                      {job.status === 'em_negociacao' ? (
                        <Button 
                          onClick={() => navigate(`/cliente/negociacao/${job.id}`)}
                          className="bg-gradient-primary hover:shadow-glow"
                        >
                          Ver Negociação
                        </Button>
                      ) : job.status === 'aberto' ? (
                        <>
                          <Button 
                            onClick={() => navigate(`/trabalhos-sugeridos/${job.id}`)}
                            className="bg-gradient-primary hover:shadow-glow"
                            size="sm"
                          >
                            Ver Montadores Sugeridos
                          </Button>
                          <Button 
                            onClick={() => navigate(`/pedido/${job.id}/candidatos`)}
                            variant="outline"
                            size="sm"
                          >
                            Ver Candidatos ({job.candidaturas_count || 0})
                          </Button>
                        </>
                      ) : null}
                      {job.status === "aguardando_pagamento" && (
                        <Button size="sm" className="bg-gradient-primary">Pagar agora</Button>
                      )}
                      {job.status === "concluido" && (
                        <Button variant="outline" size="sm">Avaliar</Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <JobDetailsModal
          job={selectedJob}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
        />
      </div>
    </div>
  );
};

export default ClientDashboard;