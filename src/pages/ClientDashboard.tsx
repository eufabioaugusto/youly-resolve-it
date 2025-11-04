import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
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
  MessageSquare,
  Shield
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import JobDetailsModal from "@/components/JobDetailsModal";
import NotificationCenter from "@/components/NotificationCenter";
import { PagamentoModal } from "@/components/PagamentoModal";
import { TimeoutMonitor } from "@/components/TimeoutMonitor";

const ClientDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { profile, clienteProfile } = useProfile();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<any>(null);
  const [jobTimeouts, setJobTimeouts] = useState<Record<string, any>>({});

  // Redirecionar se não for cliente
  useEffect(() => {
    if (profile && profile.role !== 'client') {
      navigate('/montador');
    }
  }, [profile, navigate]);

  const fetchJobs = useCallback(async () => {
    console.log('🔍 [fetchJobs] Iniciando busca de jobs...');
    console.log('🔍 [fetchJobs] clienteProfile:', clienteProfile);
    
    if (!clienteProfile) {
      console.warn('⚠️ [fetchJobs] clienteProfile não disponível ainda');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [fetchJobs] Buscando jobs para cliente_id:', clienteProfile.id);
      
      // Query simplificada sem nested joins problemáticos
      const { data: jobsData, error: queryError } = await supabase
        .from('jobs')
        .select(`
          *,
          ordem_servico:ordem_servico_id (
            id,
            status,
            codigo_validacao,
            garantia_ativa,
            data_expiracao_garantia,
            data_ativacao_garantia
          ),
          candidaturas (
            id
          ),
          negociacoes (
            id,
            valor_proposto_montador,
            valor_final,
            status
          )
        `)
        .eq('cliente_id', clienteProfile.id)
        .order('created_at', { ascending: false });

      console.log('✅ [fetchJobs] Query executada');
      console.log('✅ [fetchJobs] Dados retornados:', jobsData);
      console.log('❌ [fetchJobs] Erro da query:', queryError);

      if (queryError) throw queryError;

      // Buscar informações dos montadores separadamente quando necessário
      const jobsWithMontadores = await Promise.all((jobsData || []).map(async (job) => {
        if (job.montador_id) {
          const { data: montadorData } = await supabase
            .from('montadores')
            .select('id, avaliacao_media, user_id')
            .eq('id', job.montador_id)
            .single();

          if (montadorData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', montadorData.user_id)
              .single();

            return {
              ...job,
              montador: {
                ...montadorData,
                profiles: profileData
              },
              candidaturas_count: job.candidaturas?.length || 0
            };
          }
        }
        
        return {
          ...job,
          candidaturas_count: job.candidaturas?.length || 0
        };
      }));
        
      // IMPORTANTE: Buscar timeouts expirados para MANTER o badge "Time Youly"
      const { data: timeoutsData } = await supabase
        .from('timeout_montador')
        .select('*')
        .in('job_id', jobsWithMontadores.map(j => j.id));

      console.log('⏱️ [fetchJobs] Timeouts encontrados:', timeoutsData);
      
      // Mapear timeouts por job_id (incluindo expirados para badge visual)
      const timeoutsMap = (timeoutsData || []).reduce((acc, timeout) => {
        acc[timeout.job_id] = timeout;
        return acc;
      }, {} as Record<string, any>);

      console.log('✅ [fetchJobs] Total de jobs processados:', jobsWithMontadores.length);
      
      setJobs(jobsWithMontadores);
      setJobTimeouts(timeoutsMap);
      
      if (jobsWithMontadores.length === 0) {
        console.log('ℹ️ [fetchJobs] Nenhum job encontrado para este cliente');
      }
      
    } catch (error: any) {
      console.error('❌ [fetchJobs] Erro completo:', error);
      console.error('❌ [fetchJobs] Mensagem:', error.message);
      console.error('❌ [fetchJobs] Detalhes:', error.details);
      console.error('❌ [fetchJobs] Hint:', error.hint);
      
      const errorMessage = error.message || 'Erro desconhecido ao carregar pedidos';
      setError(errorMessage);
      
      toast({
        title: "Erro ao carregar pedidos",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🏁 [fetchJobs] Busca finalizada');
    }
  }, [clienteProfile, toast]);

  useEffect(() => {
    if (clienteProfile) {
      fetchJobs();
    }
  }, [clienteProfile, fetchJobs]);

  // Escutar mudanças em tempo real nos jobs, negociações e OS
  useEffect(() => {
    if (!clienteProfile) return;

    const jobChannel = supabase
      .channel('client-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `cliente_id=eq.${clienteProfile.id}`
        },
        () => {
          console.log('Job atualizado, recarregando...');
          fetchJobs();
        }
      )
      .subscribe();

    const negociacaoChannel = supabase
      .channel('client-negociacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negociacoes',
          filter: `cliente_id=eq.${clienteProfile.id}`
        },
        () => {
          console.log('Negociação atualizada, recarregando...');
          fetchJobs();
        }
      )
      .subscribe();

    const osChannel = supabase
      .channel('client-os-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordem_servico'
        },
        () => {
          console.log('Ordem de serviço atualizada, recarregando...');
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(jobChannel);
      supabase.removeChannel(negociacaoChannel);
      supabase.removeChannel(osChannel);
    };
  }, [clienteProfile, fetchJobs]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/login');
  };

  const getOrcamentoInfo = (job: any) => {
    if (!job.negociacoes || job.negociacoes.length === 0) {
      return {
        texto: "Aguardando orçamentos",
        classe: "text-muted-foreground",
        valor: null
      };
    }

    const negociacaoAtiva = job.negociacoes.find((n: any) => 
      n.status === 'orcamento_enviado' || n.status === 'aceito' || n.status === 'contra_proposta'
    );

    if (!negociacaoAtiva) {
      return {
        texto: "Aguardando orçamentos",
        classe: "text-muted-foreground",
        valor: null
      };
    }

    if (negociacaoAtiva.status === 'aceito' && negociacaoAtiva.valor_final) {
      return {
        texto: "Valor acordado",
        classe: "text-success",
        valor: negociacaoAtiva.valor_final
      };
    }

    if (negociacaoAtiva.valor_proposto_montador) {
      return {
        texto: negociacaoAtiva.status === 'contra_proposta' ? "Contra-proposta" : "Orçamento recebido",
        classe: "text-warning",
        valor: negociacaoAtiva.valor_proposto_montador
      };
    }

    return {
      texto: "Aguardando orçamentos",
      classe: "text-muted-foreground",
      valor: null
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      aberto: { variant: "outline", text: "Em aberto", className: "bg-info/10 text-info border-info" },
      em_negociacao: { variant: "default", text: "Em negociação", className: "bg-warning/20 text-foreground" },
      aguardando_pagamento: { variant: "default", text: "Aguardando pagamento", className: "bg-warning text-warning-foreground" },
      pago: { variant: "default", text: "Pago", className: "bg-success text-success-foreground" },
      em_andamento: { variant: "default", text: "Em andamento", className: "bg-primary text-primary-foreground" },
      concluido: { variant: "default", text: "Concluído", className: "bg-success text-success-foreground" },
      cancelado: { variant: "destructive", text: "Cancelado" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status, className: "" };
    
    return (
      <Badge variant={config.variant as any} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus pedidos...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-glow">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Erro ao Carregar Pedidos
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Não foi possível carregar seus pedidos. Por favor, tente novamente.
              </AlertDescription>
            </Alert>
            <Button onClick={fetchJobs} className="w-full bg-gradient-primary">
              Tentar Novamente
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Youly</h1>
              <p className="text-sm text-muted-foreground">Dashboard Cliente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={loggingOut}
              className="hover:bg-destructive/10"
            >
              {loggingOut ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-destructive border-t-transparent" />
              ) : (
                <LogOut className="w-5 h-5 text-destructive" />
              )}
            </Button>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="mb-8 shadow-glow border-0 bg-white">
          <CardHeader>
            <CardTitle>Bem-vindo de volta, {profile?.nome || 'Cliente'}!</CardTitle>
            <CardDescription>
              Acompanhe seus pedidos e gerencie seus serviços de montagem
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link to="/criar-pedido">
            <Card className="shadow-glow hover:shadow-xl transition-all cursor-pointer border-0 bg-white h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Criar novo pedido</h3>
                  <p className="text-sm text-muted-foreground">Solicite um novo serviço de montagem</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/cliente/negociacoes">
            <Card className="shadow-glow hover:shadow-xl transition-all cursor-pointer border-0 bg-white h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 bg-gradient-primary rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Central de Negociações</h3>
                  <p className="text-sm text-muted-foreground">Acompanhe suas negociações em andamento</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Meus Pedidos</h2>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
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
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{job.descricao}</h3>
                        {jobTimeouts[job.id]?.expirado && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Time Youly
                          </Badge>
                        )}
                      </div>
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

                      {/* Cronômetro de Timeout - apenas para jobs em aberto */}
                      {job.status === 'aberto' && jobTimeouts[job.id] && !jobTimeouts[job.id].expirado && (
                        <div className="mb-3">
                          <TimeoutMonitor
                            dataExpiracao={jobTimeouts[job.id].data_expiracao}
                            onExpired={() => {
                              // Atualizar estado local para marcar como expirado
                              setJobTimeouts(prev => ({
                                ...prev,
                                [job.id]: {
                                  ...prev[job.id],
                                  expirado: true
                                }
                              }));
                              
                              toast({
                                title: "Tempo esgotado!",
                                description: "Nenhum montador respondeu. Nossa equipe vai cuidar disso para você.",
                                variant: "destructive"
                              });
                            }}
                          />
                        </div>
                      )}

                      {/* 🎯 CRÍTICO: Exibir código de validação e garantia */}
                      {job.ordem_servico && (
                        <div className="mb-3 space-y-2">
                          {(job.ordem_servico.status === 'a_caminho' || job.ordem_servico.status === 'iniciada') && (
                            <Alert className="bg-primary/10 border-primary">
                              <Shield className="h-4 w-4" />
                              <AlertDescription className="font-semibold">
                                Código de validação: <span className="text-lg font-mono">{job.ordem_servico.codigo_validacao}</span>
                              </AlertDescription>
                            </Alert>
                          )}
                          {job.ordem_servico.garantia_ativa && (
                            <Alert className="bg-success/10 border-success">
                              <Shield className="h-4 w-4 text-success" />
                              <AlertDescription>
                                🛡️ Garantia ativa até {new Date(job.ordem_servico.data_expiracao_garantia).toLocaleDateString('pt-BR')}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
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
                                )
                                }
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setDetailsModalOpen(true);
                      }}
                      className="flex-1 md:flex-initial min-w-[calc(50%-0.375rem)] md:min-w-0"
                    >
                      Ver detalhes
                    </Button>
                    
                    {/* Jobs em aberto SEM negociação */}
                    {job.status === 'aberto' && (!job.negociacoes || job.negociacoes.length === 0) && (
                      <>
                        <Button 
                          onClick={() => navigate(`/trabalhos-sugeridos/${job.id}`)}
                          className="bg-gradient-primary hover:shadow-glow flex-1 md:flex-initial min-w-[calc(50%-0.375rem)] md:min-w-0"
                          size="sm"
                        >
                          Ver Montadores Sugeridos
                        </Button>
                        <Button 
                          onClick={() => navigate(`/pedido/${job.id}/candidatos`)}
                          variant="outline"
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          Ver Candidatos ({job.candidaturas_count || 0})
                        </Button>
                      </>
                    )}
                    
                    {/* Jobs com negociação ativa (qualquer status exceto pago/com OS) */}
                    {((job.negociacoes && job.negociacoes.length > 0) || job.status === 'em_negociacao' || job.status === 'aguardando_pagamento') 
                      && job.status !== 'pago' && !job.ordem_servico && (
                      <Button 
                        onClick={() => navigate(`/cliente/negociacao/${job.id}`)}
                        className="bg-gradient-primary hover:shadow-glow"
                        size="sm"
                      >
                        Ver Negociação
                      </Button>
                    )}
                    
                    {/* Botão de pagamento */}
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
                    
                    {/* Jobs pagos - mostrar status da OS */}
                    {(job.status === "pago" || job.ordem_servico) && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">
                          {job.ordem_servico?.status === 'concluida' ? 'Serviço concluído' :
                           job.ordem_servico?.status === 'iniciada' ? 'Em execução' :
                           job.ordem_servico?.status === 'a_caminho' ? 'Montador a caminho' :
                           'Pagamento confirmado - Aguardando início'}
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedJob && (
        <JobDetailsModal
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          job={selectedJob}
        />
      )}

      {selectedJobForPayment && (() => {
        const negociacao = selectedJobForPayment.negociacoes?.find(
          (n: any) => n.status === 'aceito' || n.status === 'orcamento_enviado'
        );
        const valorFinal = negociacao?.valor_final || negociacao?.valor_proposto_montador || 0;
        const montadorNome = selectedJobForPayment.montador?.profiles?.nome || 'Montador';
        
        return (
          <PagamentoModal
            open={pagamentoModalOpen}
            onOpenChange={setPagamentoModalOpen}
            jobId={selectedJobForPayment.id}
            montadorId={selectedJobForPayment.montador_id || ''}
            valor={valorFinal}
            jobDescricao={selectedJobForPayment.descricao}
            montadorNome={montadorNome}
          />
        );
      })()}
    </div>
  );
};

export default ClientDashboard;
