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
  LogOut,
  Users,
  MessageSquare
} from "lucide-react";
import { useState, useEffect } from "react";
import JobDetailsModal from "@/components/JobDetailsModal";
import NotificationCenter from "@/components/NotificationCenter";
import { PagamentoModal } from "@/components/PagamentoModal";

const ClientDashboard = () => {
  const { signOut } = useAuth();
  const { profile, clienteProfile } = useProfile();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<any>(null);

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

        // Buscar negociações para cada job
        const { data: negociacoes } = await supabase
          .from('negociacoes')
          .select('job_id, status, valor_proposto_montador, valor_final')
          .in('job_id', jobsData.map(j => j.id));

        // Combinar os dados
        const jobsWithData = jobsData.map(job => {
          const jobNegociacoes = negociacoes?.filter(n => n.job_id === job.id) || [];
          
          return {
            ...job,
            montador: job.montador_id ? montadorData.find(m => m.id === job.montador_id) : null,
            candidaturas_count: candidaturas?.filter(c => c.job_id === job.id).length || 0,
            negociacoes: jobNegociacoes
          };
        });

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

  const getOrcamentoInfo = (job: any) => {
    const negociacoes = job.negociacoes || [];
    
    // Se há orçamento aceito/aprovado, mostrar valor final
    const aprovada = negociacoes.find(n => n.status === 'aceito');
    if (aprovada) {
      return {
        texto: 'Orçamento aprovado',
        valor: aprovada.valor_final || aprovada.valor_proposto_montador,
        classe: 'text-success font-bold'
      };
    }
    
    // Se há orçamentos enviados, mostrar o melhor (menor valor)
    const orcamentosEnviados = negociacoes.filter(n => 
      n.status === 'orcamento_enviado' && n.valor_proposto_montador
    );
    
    if (orcamentosEnviados.length > 0) {
      const melhorOrcamento = Math.min(...orcamentosEnviados.map(n => n.valor_proposto_montador));
      return {
        texto: 'Melhor orçamento',
        valor: melhorOrcamento,
        classe: 'text-primary font-bold'
      };
    }
    
    // Se há negociações em andamento mas sem orçamento ainda
    if (negociacoes.length > 0) {
      return {
        texto: 'Orçamento em preparação',
        valor: null,
        classe: 'text-warning font-medium'
      };
    }
    
    // Nenhuma negociação ainda
    return {
      texto: 'Aguardando orçamentos',
      valor: null,
      classe: 'text-muted-foreground font-medium'
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="outline">Aberto</Badge>;
      case "aceito":
        return <Badge className="bg-success text-success-foreground">Aceito</Badge>;
      case "em_negociacao":
        return <Badge className="bg-info text-info-foreground">Em negociação</Badge>;
      case "aguardando_pagamento":
        return <Badge className="bg-warning text-warning-foreground">Aguardando pagamento</Badge>;
      case "pago":
        return <Badge className="bg-success text-success-foreground">Pago</Badge>;
      case "em_andamento":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      case "concluido":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
          src="https://storage.googleapis.com/gpt-engineer-file-uploads/HuLLY2XYTgNcG9iwF9oWsCLkpi53/social-images/social-1758541291424-Youly-Logo.png" 
          alt="Youly Logo" 
          className="h-9 object-contain"
          />
          </Link>
          
          
          <div className="flex items-center space-x-4">
            <NotificationCenter variant="header" />
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
          <Link to="/criar-pedido" aria-label="Criar novo pedido">
  <Card className="group relative overflow-hidden rounded-xl bg-white shadow-card hover:shadow-elegant transition-all cursor-pointer">
    {/* Halo sutil no canto direito (efeito premium sem pesar) */}
    <span className="pointer-events-none absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 
                     rounded-full bg-gradient-to-tr from-rose-500/15 to-transparent blur-2xl 
                     opacity-60 group-hover:opacity-80 transition-opacity" />
    <CardContent className="p-6">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h3 className="font-semibold text-lg text-slate-900 transition-colors group-hover:text-rose-600">
            Novo Pedido
          </h3>
          <p className="text-sm text-muted-foreground">Solicitar montagem</p>
        </div>

        {/* Botão redondo com micro-interação */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center 
                          transition-all group-hover:bg-rose-600 group-hover:scale-105">
            <Plus className="w-6 h-6 text-rose-600 transition-colors group-hover:text-white" />
          </div>
          {/* anel suave, sem “borda de caixa” */}
          <span className="absolute inset-0 rounded-full ring-1 ring-rose-300/30 
                           group-hover:ring-rose-400/40 pointer-events-none" />
        </div>
      </div>
    </CardContent>
  </Card>
</Link>


          <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer bg-white" onClick={() => navigate('/cliente/negociacoes')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Negociações</h3>
                  <p className="text-sm text-muted-foreground">Acompanhar orçamentos</p>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center relative">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                  {jobs.filter(job => ['em_negociacao', 'aguardando_pagamento'].includes(job.status)).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {jobs.filter(job => ['em_negociacao', 'aguardando_pagamento'].includes(job.status)).length}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

            <Card className="shadow-card bg-white">
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

          <Card className="shadow-card bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {jobs.filter(job => job.status === 'concluido').length}
                  </h3>
                  <p className="text-sm text-muted-foreground">Jobs concluídos</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-card bg-white">
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
                  <div key={job.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors bg-white">
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
                          <div className="text-right">
                            {(() => {
                              const orcamentoInfo = getOrcamentoInfo(job);
                              return (
                                <div className="flex flex-col items-end">
                                  <span className={`text-sm ${orcamentoInfo.classe}`}>
                                    {orcamentoInfo.texto}
                                  </span>
                                  {orcamentoInfo.valor && (
                                    <span className="font-bold text-lg">
                                      R$ {orcamentoInfo.valor.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
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
                      {job.status === 'em_negociacao' || job.status === 'aguardando_pagamento' ? (
                        <Button 
                          onClick={() => navigate(`/cliente/negociacao/${job.id}`)}
                          className="bg-gradient-primary hover:shadow-glow"
                          size="sm"
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
                        <Button 
                          size="sm" 
                          className="bg-gradient-primary"
                          onClick={() => {
                            setSelectedJobForPayment(job);
                            setPagamentoModalOpen(true);
                          }}
                        >
                          Pagar agora
                        </Button>
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

        {/* Modal de Pagamento */}
        {selectedJobForPayment && (
          <PagamentoModal
            open={pagamentoModalOpen}
            onOpenChange={setPagamentoModalOpen}
            jobId={selectedJobForPayment.id}
            montadorId={selectedJobForPayment.montador_id}
            valor={
              selectedJobForPayment.negociacoes?.find((n: any) => n.status === 'aceito')?.valor_final ||
              selectedJobForPayment.negociacoes?.find((n: any) => n.status === 'aceito')?.valor_proposto_montador ||
              0
            }
            jobDescricao={selectedJobForPayment.descricao}
            montadorNome={selectedJobForPayment.montador?.profiles?.nome || 'Montador'}
          />
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;