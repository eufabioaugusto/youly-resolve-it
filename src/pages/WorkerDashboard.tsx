import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NivelBadge } from "@/components/ui/nivel-badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useNegociacoes } from "@/hooks/useNegociacoes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import JobDetailsModal from "@/components/JobDetailsModal";
import CandidateModal from "@/components/CandidateModal";
import NotificationCenter from "@/components/NotificationCenter";
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  User,
  Settings,
  LogOut,
  Eye,
  Clock as TimeClock,
  Wallet,
  TrendingUp,
  CheckCircle,
  Filter,
  AlertTriangle
} from "lucide-react";
import { CarteiraWidget } from "@/components/CarteiraWidget";
import { OSCard } from "@/components/OSCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const WorkerDashboard = () => {
  const { signOut } = useAuth();
  const { profile, montadorProfile, loading } = useProfile();
  const { isComplete: isProfileComplete } = useProfileCompletion();
  const { negociacoes, loading: negociacoesLoading } = useNegociacoes();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [ordensServico, setOrdensServico] = useState([]);
  const [carteira, setCarteira] = useState(null);
  const [candidaturas, setCandidaturas] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  
  // Modal states
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);

  useEffect(() => {
    if (montadorProfile) {
      fetchAvailableJobs();
      fetchMyJobs();
      fetchOrdensServico();
      fetchCarteira();
      fetchCandidaturas();
    }
  }, [montadorProfile]);

  // 🔥 REALTIME: Atualizar negociações e OS automaticamente
  useEffect(() => {
    if (!montadorProfile?.id) return;

    console.log('🔔 Configurando realtime para montador:', montadorProfile.id);

    const negociacoesChannel = supabase
      .channel('negociacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negociacoes',
          filter: `montador_id=eq.${montadorProfile.id}`
        },
        (payload) => {
          console.log('🔥 Negociação atualizada:', payload);
          fetchAvailableJobs();
          fetchMyJobs();
          toast({
            title: "Nova atualização!",
            description: "Suas negociações foram atualizadas.",
          });
        }
      )
      .subscribe();

    const osChannel = supabase
      .channel('os-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ordem_servico',
          filter: `montador_id=eq.${montadorProfile.id}`
        },
        (payload) => {
          console.log('🔥 Ordem de Serviço atualizada:', payload);
          fetchOrdensServico();
          toast({
            title: "Nova Ordem de Serviço!",
            description: "Você tem uma nova OS disponível.",
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Desconectando realtime');
      supabase.removeChannel(negociacoesChannel);
      supabase.removeChannel(osChannel);
    };
  }, [montadorProfile?.id]);

  // 🎯 Detectar navegação vinda de notificações
  useEffect(() => {
    const state = location.state as any;
    if (!state) return;

    // Abrir aba específica
    if (state.activeTab) {
      setActiveTab(state.activeTab);
    }

    // Abrir modal de negociação específica
    if (state.openNegotiationId && negociacoes.length > 0) {
      const negociacao = negociacoes.find(n => n.id === state.openNegotiationId);
      if (negociacao) {
        setActiveTab('negotiations');
        // Scroll para a negociação (pode adicionar ref se necessário)
      }
    }

    // Abrir modal de job específico
    if (state.openJobId && availableJobs.length > 0) {
      const job = availableJobs.find((j: any) => j.id === state.openJobId);
      if (job) {
        setSelectedJob(job);
        setJobDetailsModalOpen(true);
      }
    }

    // Limpar o state após processar
    window.history.replaceState({}, document.title);
  }, [location.state, negociacoes, availableJobs]);

  const fetchAvailableJobs = async () => {
    if (!montadorProfile) return;

    try {
      console.log('Fetching available jobs for montador:', montadorProfile.id);
      
      // Buscar jobs em aberto
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'aberto')
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        throw jobsError;
      }

      console.log('Jobs found:', jobsData?.length || 0);

      if (jobsData && jobsData.length > 0) {
        // Buscar dados dos clientes
        const clienteIds = jobsData.map(job => job.cliente_id);
        console.log('Fetching cliente data for ids:', clienteIds);
        
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('id, user_id, avaliacao_media, pedidos_total')
          .in('id', clienteIds);

        if (clientesError) {
          console.error('Error fetching clientes:', clientesError);
          throw clientesError;
        }

        // Buscar nomes dos clientes
        const userIds = clientesData?.map(cliente => cliente.user_id) || [];
        console.log('Fetching profile data for user ids:', userIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        // Combinar os dados
        const jobsWithClientes = jobsData.map(job => {
          const cliente = clientesData?.find(c => c.id === job.cliente_id);
          const profile = profilesData?.find(p => p.user_id === cliente?.user_id);
          
          return {
            ...job,
            clientes: {
              ...cliente,
              profiles: {
                nome: profile?.nome || 'Cliente'
              }
            }
          };
        });

        console.log('Combined jobs data:', jobsWithClientes);
        setAvailableJobs(jobsWithClientes);
      } else {
        console.log('No jobs found');
        setAvailableJobs([]);
      }
    } catch (error) {
      console.error('Erro ao buscar trabalhos disponíveis:', error);
      toast({
        title: "Erro ao carregar pedidos",
        description: "Não foi possível carregar os pedidos disponíveis. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const fetchMyJobs = async () => {
    if (!montadorProfile) return;

    try {
      // Buscar jobs do montador
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('montador_id', montadorProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;

      if (jobsData && jobsData.length > 0) {
        // Buscar dados dos clientes
        const clienteIds = jobsData.map(job => job.cliente_id);
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('id, user_id, avaliacao_media, pedidos_total')
          .in('id', clienteIds);

        if (clientesError) throw clientesError;

        // Buscar nomes dos clientes
        const userIds = clientesData?.map(cliente => cliente.user_id) || [];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar os dados
        const jobsWithClientes = jobsData.map(job => {
          const cliente = clientesData?.find(c => c.id === job.cliente_id);
          const profile = profilesData?.find(p => p.user_id === cliente?.user_id);
          
          return {
            ...job,
            clientes: {
              ...cliente,
              profiles: {
                nome: profile?.nome || 'Cliente'
              }
            }
          };
        });

        setMyJobs(jobsWithClientes);
      } else {
        setMyJobs([]);
      }
    } catch (error) {
      console.error('Erro ao buscar meus trabalhos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCarteira = async () => {
    if (!montadorProfile) return;

    try {
      const { data, error } = await supabase
        .from('carteira')
        .select('*')
        .eq('montador_id', montadorProfile.id)
        .single();

      if (error) throw error;
      setCarteira(data);
    } catch (error) {
      console.error('Erro ao buscar carteira:', error);
    }
  };

  const fetchOrdensServico = async () => {
    if (!montadorProfile) return;

    try {
      console.log('🚀 [WorkerDashboard] Buscando ordens de serviço');
      
      const { data, error } = await supabase
        .from('ordem_servico')
        .select(`
          *,
          jobs (*),
          clientes (*, profiles:user_id(*))
        `)
        .eq('montador_id', montadorProfile.id)
        .order('data_hora_agendamento', { ascending: true });

      if (error) throw error;

      console.log('✅ [WorkerDashboard] Ordens de serviço encontradas', data);
      setOrdensServico(data || []);
    } catch (error) {
      console.error('❌ [WorkerDashboard] Erro ao buscar OS', error);
    }
  };

  const fetchCandidaturas = async () => {
    if (!montadorProfile) {
      console.log('❌ fetchCandidaturas: montadorProfile não disponível');
      return;
    }

    try {
      console.log('🔍 BUSCANDO CANDIDATURAS DO BANCO');
      console.log('🆔 Montador ID:', montadorProfile.id);
      
      const { data, error } = await supabase
        .from('candidaturas')
        .select('job_id, montador_id, status, proposta')
        .eq('montador_id', montadorProfile.id);

      console.log('📦 Resposta do Supabase candidaturas:', { data, error });

      if (error) {
        console.error('❌ Erro na query de candidaturas:', error);
        throw error;
      }
      
      const jobIds = data?.map(c => c.job_id) || [];
      console.log('✅ Job IDs com candidatura:', jobIds);
      console.log('📊 Total de candidaturas:', jobIds.length);
      console.log('🎯 Candidaturas completas:', data);
      
      setCandidaturas(jobIds);
    } catch (error) {
      console.error('❌ Erro ao buscar candidaturas:', error);
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

  const handleOpenJobDetails = (job) => {
    setSelectedJob(job);
    setJobDetailsModalOpen(true);
  };

  const handleOpenCandidateModal = (job) => {
    setSelectedJob(job);
    setCandidateModalOpen(true);
  };

  const handleCandidaturaSuccess = async () => {
    console.log('✅ Candidatura enviada com sucesso, atualizando do banco...');
    await fetchCandidaturas(); // Buscar candidaturas atualizadas do banco
    await fetchAvailableJobs(); // Refresh the jobs list
    toast({
      title: "Candidatura enviada!",
      description: "O cliente foi notificado sobre sua proposta."
    });
  };

  const handleApply = async (jobId: string) => {
    if (!montadorProfile) return;
    
    setLoadingJobId(jobId);
    try {
      const { error } = await supabase
        .from('candidaturas')
        .insert({
          job_id: jobId,
          montador_id: montadorProfile.id,
          status: 'pendente'
        });

      if (error) throw error;
      
      // Atualizar lista de trabalhos disponíveis
      fetchAvailableJobs();
    } catch (error) {
      console.error('Erro ao candidatar-se:', error);
    } finally {
      setLoadingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={montadorProfile?.foto_perfil_url || undefined} alt={profile?.nome} />
              <AvatarFallback className="text-lg">
                {profile?.nome?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MT'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-bold text-foreground">
                  Bem-vindo, {profile?.nome || 'Montador'}! 🔧
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <NivelBadge 
                  nivel={montadorProfile?.nivel_gamificacao || 'Bronze'} 
                  isPremium={montadorProfile?.is_premium || false}
                />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{montadorProfile?.avaliacao_media?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {montadorProfile?.projetos_realizados || 0} projetos concluídos
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter variant="header" />
            <Link to="/montador/perfil">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Minha Conta
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm" disabled={loggingOut}>
              {loggingOut ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {loggingOut ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        </div>

        {/* Incomplete Profile Alert */}
        {!isProfileComplete && (
          <Card className="mb-8 border-destructive bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Complete seu cadastro para receber trabalhos
                  </h3>
                   <p className="text-sm text-muted-foreground mb-4">
                     Nota: Novo na plataforma, mas verificado e qualificado. Perfeito para começar com projetos simples!
                   </p>
                  <Link to="/montador/perfil">
                    <Button variant="destructive" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold">
                    R$ {carteira?.saldo_disponivel?.toFixed(2) || '0,00'}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação média</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.avaliacao_media?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trabalhos realizados</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.projetos_realizados || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horas trabalhadas</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.horas_trabalhadas || 0}h
                  </p>
                </div>
                <TimeClock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="available">Trabalhos Disponíveis</TabsTrigger>
            <TabsTrigger value="my-jobs">Meus Trabalhos</TabsTrigger>
            <TabsTrigger value="os">Ordens de Serviço</TabsTrigger>
            <TabsTrigger value="negotiations" className="relative">
              Negociações
              {negociacoes.length > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                >
                  {negociacoes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="wallet">Carteira</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Trabalhos Disponíveis</CardTitle>
                <CardDescription>Encontre novos trabalhos na sua região</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando trabalhos...</p>
                  </div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum trabalho disponível no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.descricao}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {job.clientes?.profiles?.nome || 'Cliente'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.endereco?.bairro}, {job.endereco?.cidade}
                                </span>
                                {job.categoria && (
                                  <Badge variant="outline">{job.categoria}</Badge>
                                )}
                                {candidaturas.includes(job.id) && (
                                  <Badge variant="secondary">Candidatura enviada</Badge>
                                )}
                              </div>
                            </div>
                             <div className="text-right">
                               <div className="space-y-1">
                                 <p className="text-sm font-medium text-muted-foreground">
                                   Valor: R$ {job.valor_estimado?.toFixed(2) || 'A negociar'}
                                 </p>
                                 <p className="text-xs text-muted-foreground">
                                   Cliente: {job.clientes?.avaliacao_media?.toFixed(1) || '0.0'} ⭐
                                 </p>
                               </div>
                             </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {new Date(job.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleOpenJobDetails(job)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalhes
                              </Button>
                              {job.status === 'em_negociacao' ? (
                                <Button 
                                  onClick={() => navigate(`/montador/negociacao/${job.id}`)}
                                  className="bg-gradient-primary hover:shadow-glow"
                                >
                                  Ver Negociação
                                </Button>
                              ) : candidaturas.includes(job.id) ? (
                                <Button 
                                  disabled
                                  variant="secondary"
                                  size="sm"
                                >
                                  Candidatura Enviada
                                </Button>
                              ) : (
                                <Button 
                                  onClick={() => {
                                    console.log('🖱️ Clique em Candidatar-se');
                                    console.log('🎯 Job ID:', job.id);
                                    console.log('📋 Candidaturas atuais:', candidaturas);
                                    console.log('✅ Já candidatado?', candidaturas.includes(job.id));
                                    handleOpenCandidateModal(job);
                                  }}
                                  disabled={loadingJobId === job.id}
                                  className="bg-gradient-primary hover:shadow-glow"
                                  size="sm"
                                >
                                  {loadingJobId === job.id ? 'Candidatando...' : 'Candidatar-se'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="my-jobs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Trabalhos</CardTitle>
                <CardDescription>Acompanhe seus trabalhos aceitos e histórico</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando seus trabalhos...</p>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você ainda não tem trabalhos.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Candidate-se aos trabalhos disponíveis para começar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.descricao}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {job.clientes?.profiles?.nome || 'Cliente'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.endereco?.bairro}, {job.endereco?.cidade}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(job.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              {job.valor_estimado && (
                                <p className="text-2xl font-bold text-green-600 mb-1">
                                  R$ {job.valor_estimado.toFixed(2)}
                                </p>
                              )}
                              <Badge variant={
                                job.status === 'em_andamento' ? 'default' :
                                job.status === 'concluido' ? 'secondary' : 'outline'
                              }>
                                {job.status === 'em_andamento' ? 'Em Andamento' : 
                                 job.status === 'concluido' ? 'Concluído' : 
                                 job.status === 'aberto' ? 'Aberto' : job.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Ver detalhes
                              </Button>
                              {job.status === 'em_andamento' && (
                                <Button size="sm">
                                  Finalizar trabalho
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="os" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Ordens de Serviço</CardTitle>
                <CardDescription>Acompanhe suas ordens de serviço agendadas e em andamento</CardDescription>
              </CardHeader>
              <CardContent>
                {ordensServico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma ordem de serviço encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordensServico.map((os) => (
                      <OSCard
                        key={os.id}
                        ordemServico={os}
                        onAbrirOS={(osData) => navigate(`/montador/os/${osData.id}`)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="negotiations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Negociações em Andamento</CardTitle>
                <CardDescription>
                  Acompanhe suas negociações de orçamentos com clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {negociacoesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando negociações...</p>
                  </div>
                ) : negociacoes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Suas negociações aparecerão aqui quando você enviar orçamentos.
                    </p>
                    <Button 
                      className="bg-gradient-primary"
                      onClick={() => {
                        const availableTab = document.querySelector('[value="available"]') as HTMLElement;
                        availableTab?.click();
                      }}
                    >
                      Ver Trabalhos Disponíveis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {negociacoes.map((negociacao) => (
                      <Card key={negociacao.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                Negociação #{negociacao.id.slice(0, 8)}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  Cliente {negociacao.cliente_id.slice(0, 8)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(negociacao.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                negociacao.status === 'pendente' ? 'outline' :
                                negociacao.status === 'orcamento_enviado' ? 'default' :
                                negociacao.status === 'aceito' ? 'default' :
                                negociacao.status === 'contra_proposta' ? 'secondary' : 'destructive'
                              } className={
                                negociacao.status === 'orcamento_enviado' ? 'bg-warning text-warning-foreground' :
                                negociacao.status === 'aceito' ? 'bg-success text-success-foreground' :
                                negociacao.status === 'contra_proposta' ? 'bg-info text-info-foreground' : ''
                              }>
                                {negociacao.status === 'pendente' ? 'Aguardando Orçamento' :
                                 negociacao.status === 'orcamento_enviado' ? 'Orçamento Enviado' :
                                 negociacao.status === 'aceito' ? 'Aceito' :
                                 negociacao.status === 'contra_proposta' ? 'Contra-proposta' :
                                 negociacao.status === 'recusado' ? 'Recusado' : negociacao.status}
                              </Badge>
                              {negociacao.valor_proposto_montador && (
                                <span className="font-bold text-green-600">
                                  R$ {negociacao.valor_proposto_montador.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/montador/negociacao/${negociacao.job_id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Negociação
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="mt-6">
            <CarteiraWidget />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <JobDetailsModal
          job={selectedJob}
          open={jobDetailsModalOpen}
          onOpenChange={setJobDetailsModalOpen}
        />

        <CandidateModal
          job={selectedJob}
          open={candidateModalOpen}
          onOpenChange={setCandidateModalOpen}
          onSuccess={handleCandidaturaSuccess}
        />
      </div>
    </div>
  );
};

export default WorkerDashboard;