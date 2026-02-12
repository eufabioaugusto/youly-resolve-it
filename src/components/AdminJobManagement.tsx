import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, AlertCircle, Clock, CheckCircle, Wrench, PlayCircle, Package, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

export function AdminJobManagement() {
  const { toast } = useToast();
  const [jobsDisponiveis, setJobsDisponiveis] = useState<any[]>([]);
  const [jobsEmAndamento, setJobsEmAndamento] = useState<any[]>([]);
  const [jobsFinalizados, setJobsFinalizados] = useState<any[]>([]);
  const [jobsTimeout, setJobsTimeout] = useState<any[]>([]);
  const [jobsCancelados, setJobsCancelados] = useState<any[]>([]);
  const [montadores, setMontadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('disponiveis');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    logger.adminAction('Carregando dados do painel de gestão de jobs');
    setLoading(true);

    try {
      // 1. JOBS DISPONÍVEIS (abertos e sem timeout expirado)
      const { data: jobsDisponiveisData, error: disponiveisError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'aberto')
        .order('created_at', { ascending: false });

      if (disponiveisError) throw disponiveisError;

      // Buscar timeouts para filtrar apenas jobs SEM timeout expirado
      const jobIdsDisponiveis = jobsDisponiveisData?.map(j => j.id) || [];
      let jobsDisponiveisFiltrados = jobsDisponiveisData || [];
      
      if (jobIdsDisponiveis.length > 0) {
        const { data: timeoutsData } = await supabase
          .from('timeout_montador')
          .select('job_id, expirado')
          .in('job_id', jobIdsDisponiveis);

        jobsDisponiveisFiltrados = jobsDisponiveisData.filter(job => {
          const timeout = timeoutsData?.find(t => t.job_id === job.id);
          return !timeout || !timeout.expirado;
        });

        // Enriquecer com dados do cliente
        const clienteIdsDisp = jobsDisponiveisFiltrados.map(j => j.cliente_id);
        if (clienteIdsDisp.length > 0) {
          const { data: clientesData } = await supabase
            .from('clientes')
            .select('id, user_id')
            .in('id', clienteIdsDisp);

          const userIdsDisp = clientesData?.map(c => c.user_id) || [];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, nome')
            .in('user_id', userIdsDisp);

          jobsDisponiveisFiltrados = jobsDisponiveisFiltrados.map(job => ({
            ...job,
            cliente: {
              ...clientesData?.find(c => c.id === job.cliente_id),
              profile: profilesData?.find(p => p.user_id === clientesData?.find(c => c.id === job.cliente_id)?.user_id)
            }
          }));
        }
      }

      setJobsDisponiveis(jobsDisponiveisFiltrados);

      // 2. JOBS EM ANDAMENTO
      const { data: jobsAndamentoData, error: andamentoError } = await supabase
        .from('jobs')
        .select('*')
        .in('status', ['em_negociacao', 'pago'])
        .order('created_at', { ascending: false });

      if (andamentoError) throw andamentoError;

      // Enriquecer jobs em andamento
      let jobsAndamentoEnriquecidos = jobsAndamentoData || [];
      if (jobsAndamentoData && jobsAndamentoData.length > 0) {
        const clienteIdsAnd = jobsAndamentoData.map(j => j.cliente_id);
        const montadorIdsAnd = jobsAndamentoData.map(j => j.montador_id).filter(Boolean);

        const [{ data: clientesData }, { data: montadoresData }] = await Promise.all([
          supabase.from('clientes').select('id, user_id').in('id', clienteIdsAnd),
          montadorIdsAnd.length > 0 
            ? supabase.from('montadores').select('id, user_id').in('id', montadorIdsAnd)
            : Promise.resolve({ data: [] })
        ]);

        const allUserIds = [
          ...(clientesData?.map(c => c.user_id) || []),
          ...(montadoresData?.map(m => m.user_id) || [])
        ];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', allUserIds);

        jobsAndamentoEnriquecidos = jobsAndamentoData.map(job => ({
          ...job,
          cliente: {
            ...clientesData?.find(c => c.id === job.cliente_id),
            profile: profilesData?.find(p => p.user_id === clientesData?.find(c => c.id === job.cliente_id)?.user_id)
          },
          montador: job.montador_id ? {
            ...montadoresData?.find(m => m.id === job.montador_id),
            profile: profilesData?.find(p => p.user_id === montadoresData?.find(m => m.id === job.montador_id)?.user_id)
          } : null
        }));
      }

      setJobsEmAndamento(jobsAndamentoEnriquecidos);

      // 3. JOBS FINALIZADOS
      const { data: jobsFinalizadosData, error: finalizadosError } = await supabase
        .from('ordem_servico')
        .select('*, jobs!ordem_servico_job_id_fkey(*)')
        .in('status', ['concluida', 'concluida_com_assistencia', 'pendente_pecas'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (finalizadosError) throw finalizadosError;

      // Enriquecer OS finalizadas
      let osFinalizadasEnriquecidas = jobsFinalizadosData || [];
      if (jobsFinalizadosData && jobsFinalizadosData.length > 0) {
        const clienteIdsFin = jobsFinalizadosData.map(os => os.cliente_id);
        const montadorIdsFin = jobsFinalizadosData.map(os => os.montador_id);

        const [{ data: clientesData }, { data: montadoresData }] = await Promise.all([
          supabase.from('clientes').select('id, user_id').in('id', clienteIdsFin),
          supabase.from('montadores').select('id, user_id').in('id', montadorIdsFin)
        ]);

        const allUserIds = [
          ...(clientesData?.map(c => c.user_id) || []),
          ...(montadoresData?.map(m => m.user_id) || [])
        ];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', allUserIds);

        osFinalizadasEnriquecidas = jobsFinalizadosData.map(os => ({
          ...os,
          cliente: {
            ...clientesData?.find(c => c.id === os.cliente_id),
            profile: profilesData?.find(p => p.user_id === clientesData?.find(c => c.id === os.cliente_id)?.user_id)
          },
          montador: {
            ...montadoresData?.find(m => m.id === os.montador_id),
            profile: profilesData?.find(p => p.user_id === montadoresData?.find(m => m.id === os.montador_id)?.user_id)
          }
        }));
      }

      setJobsFinalizados(osFinalizadasEnriquecidas);

      // 4. JOBS COM TIMEOUT (código existente)
      // 🎯 Buscar timeouts expirados e sem resposta
      const { data: timeoutData, error: timeoutError } = await supabase
        .from('timeout_montador')
        .select('*')
        .eq('expirado', true)
        .eq('respondido', false)
        .order('created_at', { ascending: false });

      if (timeoutError) throw timeoutError;

      // 📦 Buscar dados dos jobs relacionados aos timeouts
      let timeoutDataComJobs: any[] = [];
      if (timeoutData && timeoutData.length > 0) {
        const jobIds = timeoutData.map(t => t.job_id).filter(Boolean);
        
        if (jobIds.length > 0) {
          const { data: jobsData } = await supabase
            .from('jobs')
            .select('*')
            .in('id', jobIds);

          // Buscar clientes dos jobs
          const clienteIds = jobsData?.map(j => j.cliente_id).filter(Boolean) || [];
          let clientesData: any[] = [];
          if (clienteIds.length > 0) {
            const { data: cData } = await supabase
              .from('clientes')
              .select('*')
              .in('id', clienteIds);
            clientesData = cData || [];
          }

          // Buscar negociações dos jobs para pegar montadores atribuídos
          const { data: negociacoesData } = await supabase
            .from('negociacoes')
            .select('*')
            .in('job_id', jobIds)
            .eq('status', 'pendente')
            .order('created_at', { ascending: false });

          // Buscar montadores das negociações
          const montadorIdsNeg = negociacoesData?.map(n => n.montador_id).filter(Boolean) || [];
          let montadoresAtribuidosData: any[] = [];
          if (montadorIdsNeg.length > 0) {
            const { data: mData } = await supabase
              .from('montadores')
              .select('*')
              .in('id', montadorIdsNeg);
            montadoresAtribuidosData = mData || [];

            // Buscar profiles dos montadores atribuídos
            const montadorUserIds = montadoresAtribuidosData.map(m => m.user_id);
            if (montadorUserIds.length > 0) {
              const { data: pData } = await supabase
                .from('profiles')
                .select('*')
                .in('user_id', montadorUserIds);
              
              montadoresAtribuidosData = montadoresAtribuidosData.map(m => ({
                ...m,
                profiles: pData?.find(p => p.user_id === m.user_id)
              }));
            }
          }

          // Combinar dados
          timeoutDataComJobs = timeoutData.map(t => {
            const job = jobsData?.find(j => j.id === t.job_id);
            const cliente = clientesData.find(c => c.id === job?.cliente_id);
            const negociacaoJob = negociacoesData?.find(n => n.job_id === job?.id);
            const montadorAtribuido = negociacaoJob 
              ? montadoresAtribuidosData.find(m => m.id === negociacaoJob.montador_id)
              : null;
            
            return {
              ...t,
              jobs: job,
              montador_atribuido: montadorAtribuido,
              negociacao_atual: negociacaoJob,
              negociacoes: {
                jobs: job,
                clientes: cliente
              }
            };
          }).filter(t => t.jobs); // Apenas timeouts com jobs válidos
        }
      }

      console.log('✅ [AdminJobManagement] Jobs com timeout expirado:', timeoutDataComJobs);
      setJobsTimeout(timeoutDataComJobs || []);

      // 5. JOBS CANCELADOS (buscar da ordem_servico com status cancelada)
      const { data: osCanceladasData, error: canceladosError } = await supabase
        .from('ordem_servico')
        .select('*, jobs!ordem_servico_job_id_fkey(*)')
        .eq('status', 'cancelada')
        .order('created_at', { ascending: false })
        .limit(50);

      if (canceladosError) throw canceladosError;

      let osCanceladasEnriquecidas = osCanceladasData || [];
      if (osCanceladasData && osCanceladasData.length > 0) {
        const clienteIdsCan = osCanceladasData.map(os => os.cliente_id);
        const montadorIdsCan = osCanceladasData.map(os => os.montador_id);

        const [{ data: clientesData }, { data: montadoresData }] = await Promise.all([
          supabase.from('clientes').select('id, user_id').in('id', clienteIdsCan),
          supabase.from('montadores').select('id, user_id').in('id', montadorIdsCan)
        ]);

        const allUserIds = [
          ...(clientesData?.map(c => c.user_id) || []),
          ...(montadoresData?.map(m => m.user_id) || [])
        ];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', allUserIds);

        osCanceladasEnriquecidas = osCanceladasData.map(os => ({
          ...os,
          cliente: {
            ...clientesData?.find(c => c.id === os.cliente_id),
            profile: profilesData?.find(p => p.user_id === clientesData?.find(c => c.id === os.cliente_id)?.user_id)
          },
          montador: {
            ...montadoresData?.find(m => m.id === os.montador_id),
            profile: profilesData?.find(p => p.user_id === montadoresData?.find(m => m.id === os.montador_id)?.user_id)
          }
        }));
      }

      setJobsCancelados(osCanceladasEnriquecidas);

      // Buscar montadores disponíveis
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select('*')
        .eq('status', 'ativo')
        .order('avaliacao_media', { ascending: false });
      
      // Buscar profiles dos montadores separadamente
      let montadoresComProfiles = montadoresData;
      if (montadoresData && montadoresData.length > 0) {
        const userIds = montadoresData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        
        // Combinar dados
        montadoresComProfiles = montadoresData.map(m => ({
          ...m,
          profiles: profilesData?.find(p => p.user_id === m.user_id)
        }));
      }

      if (montadoresError) throw montadoresError;

      logger.info('admin', 'Montadores disponíveis carregados', { total: montadoresComProfiles?.length });
      setMontadores(montadoresComProfiles || []);
    } catch (error: any) {
      logger.apiError('admin', 'AdminJobManagement.loadData', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMontador = async (jobId: string, montadorId: string) => {
    logger.adminAction('Atribuindo montador ao job', undefined, { jobId, montadorId });
    setAssigningJobId(jobId);

    try {
      console.log('🔄 [AdminJobManagement] Iniciando atribuição', { jobId, montadorId });

      // Buscar cliente_id do job PRIMEIRO
      const { data: jobData, error: jobFetchError } = await supabase
        .from('jobs')
        .select('cliente_id, status')
        .eq('id', jobId)
        .single();

      if (jobFetchError) {
        console.error('❌ [AdminJobManagement] Erro ao buscar job', jobFetchError);
        throw jobFetchError;
      }

      if (!jobData?.cliente_id) {
        throw new Error('Job sem cliente_id associado');
      }

      console.log('✅ [AdminJobManagement] Job encontrado', { jobId, cliente_id: jobData.cliente_id, status_atual: jobData.status });

      // Criar nova negociação PRIMEIRO
      const { data: negData, error: negError } = await supabase
        .from('negociacoes')
        .insert({
          job_id: jobId,
          montador_id: montadorId,
          cliente_id: jobData.cliente_id,
          status: 'pendente',
        })
        .select()
        .single();

      if (negError) {
        console.error('❌ [AdminJobManagement] Erro ao criar negociação', negError);
        throw negError;
      }

      console.log('✅ [AdminJobManagement] Negociação criada', { negociacao_id: negData.id });

      // Atualizar job com novo montador E status em_negociacao
      console.log('🔄 [AdminJobManagement] Atualizando job...', { jobId, montadorId, novo_status: 'em_negociacao' });
      
      const { data: updatedJob, error: jobError } = await supabase
        .from('jobs')
        .update({ 
          montador_id: montadorId, 
          status: 'em_negociacao' 
        })
        .eq('id', jobId)
        .select()
        .single();

      if (jobError) {
        console.error('❌ [AdminJobManagement] Erro ao atualizar job', jobError);
        throw jobError;
      }

      console.log('✅ [AdminJobManagement] Job atualizado com sucesso', updatedJob);

      toast({
        title: 'Sucesso!',
        description: 'Montador atribuído ao job com sucesso',
      });

      // Aguardar um pouco e recarregar
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadData();
    } catch (error: any) {
      console.error('❌ [AdminJobManagement] Erro ao atribuir montador', error);
      
      let errorMessage = 'Não foi possível atribuir o montador';
      
      if (error?.message) {
        errorMessage += `: ${error.message}`;
      }
      
      if (error?.code === '23503') {
        errorMessage = 'Erro: Cliente não encontrado para este job';
      } else if (error?.code === '23505') {
        errorMessage = 'Erro: Já existe uma negociação ativa para este job';
      } else if (error?.code === '22P02') {
        errorMessage = 'Erro: Dados inválidos. Verifique o montador e o job selecionados';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setAssigningJobId(null);
    }
  };

  const getFilteredMontadores = (jobId: string) => {
    const searchTerm = searchTerms[jobId] || '';
    
    // Só filtra se tiver pelo menos 3 caracteres
    if (searchTerm.length < 3) {
      return [];
    }
    
    const searchLower = searchTerm.toLowerCase();
    return montadores.filter((m) => {
      const nome = m.profiles?.nome?.toLowerCase() || '';
      const cpf = m.profiles?.documento?.toLowerCase() || '';
      return nome.includes(searchLower) || cpf.includes(searchLower);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderJobCard = (job: any, tipo: 'disponivel' | 'andamento' | 'finalizado' | 'cancelado') => {
    const isOSBased = tipo === 'finalizado' || tipo === 'cancelado';
    return (
      <Card key={job.id}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{isOSBased ? job.jobs?.descricao : job.descricao}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliente: {job.cliente?.profile?.nome || 'Cliente'}
                </p>
                {job.montador && (
                  <p className="text-sm text-muted-foreground">
                    Montador: {job.montador.profile?.nome || 'Montador'}
                  </p>
                )}
              </div>
              <Badge variant={
                tipo === 'disponivel' ? 'default' :
                tipo === 'andamento' ? 'secondary' : 
                tipo === 'cancelado' ? 'destructive' : 'outline'
              }>
                {tipo === 'disponivel' ? 'Disponível' :
                 tipo === 'andamento' ? job.status === 'pago' ? 'Pago' : 'Em negociação' :
                 tipo === 'cancelado' ? 'Cancelado' :
                 job.status === 'concluida' ? 'Concluída' :
                 job.status === 'concluida_com_assistencia' ? 'Com assistência' : 'Pendente peças'}
              </Badge>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📍 {(isOSBased ? job.jobs?.endereco : job.endereco)?.cidade}, {(isOSBased ? job.jobs?.endereco : job.endereco)?.estado}</p>
              <p>💰 R$ {isOSBased ? job.jobs?.valor_estimado?.toFixed(2) : job.valor_estimado?.toFixed(2) || '0.00'}</p>
              <p>📅 {new Date(job.created_at).toLocaleDateString('pt-BR')} às {new Date(job.created_at).toLocaleTimeString('pt-BR')}</p>
              {tipo === 'finalizado' && job.garantia_ativa && (
                <p className="text-success">🛡️ Garantia ativa</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 w-full min-w-0 overflow-hidden">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Gestão de Jobs</CardTitle>
          <CardDescription>Visualize e gerencie todos os jobs da plataforma</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]" style={{ maxWidth: '100%' }}>
              <TabsList className="inline-flex h-auto gap-1 p-1 md:grid md:grid-cols-5 md:w-full" style={{ display: 'flex', flexWrap: 'nowrap', width: 'max-content', minWidth: '100%' }}>
                <TabsTrigger value="disponiveis" className="flex items-center gap-1 px-2 py-2 text-[11px] sm:text-sm whitespace-nowrap">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Disponíveis ({jobsDisponiveis.length})</span>
                </TabsTrigger>
                <TabsTrigger value="andamento" className="flex items-center gap-1 px-2 py-2 text-[11px] sm:text-sm whitespace-nowrap">
                  <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Andamento ({jobsEmAndamento.length})</span>
                </TabsTrigger>
                <TabsTrigger value="finalizados" className="flex items-center gap-1 px-2 py-2 text-[11px] sm:text-sm whitespace-nowrap">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Finalizados ({jobsFinalizados.length})</span>
                </TabsTrigger>
                <TabsTrigger value="cancelados" className="flex items-center gap-1 px-2 py-2 text-[11px] sm:text-sm whitespace-nowrap">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Cancelados ({jobsCancelados.length})</span>
                </TabsTrigger>
                <TabsTrigger value="timeout" className="flex items-center gap-1 px-2 py-2 text-[11px] sm:text-sm whitespace-nowrap">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Timeout ({jobsTimeout.length})</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="disponiveis" className="mt-6">
              {jobsDisponiveis.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4" />
                  <p>Nenhum job disponível no momento</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobsDisponiveis.map(job => renderJobCard(job, 'disponivel'))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="andamento" className="mt-6">
              {jobsEmAndamento.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PlayCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Nenhum job em andamento no momento</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobsEmAndamento.map(job => renderJobCard(job, 'andamento'))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="finalizados" className="mt-6">
              {jobsFinalizados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Nenhum job finalizado no momento</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobsFinalizados.map(job => renderJobCard(job, 'finalizado'))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelados" className="mt-6">
              {jobsCancelados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Nenhum job cancelado</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jobsCancelados.map(job => renderJobCard(job, 'cancelado'))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeout" className="mt-6">
              {jobsTimeout.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-success" />
                  <p>Nenhum job com timeout expirado no momento</p>
                </div>
              ) : (
            <div className="space-y-4">
              {jobsTimeout.map((timeout) => {
                const job = timeout.negociacoes?.jobs;
                const montadorOriginal = timeout.negociacoes?.montadores;

                return (
                  <Card key={timeout.id} className="border-destructive/20">
                    <CardContent className="p-4">
                       <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{job?.descricao}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Montador original: {montadorOriginal?.profiles?.nome || 'Não informado'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Expirado em: {new Date(timeout.data_expiracao).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <Badge variant="destructive">Timeout</Badge>
                      </div>

                      {/* Se já tem montador atribuído, mostrar informações dele */}
                      {timeout.montador_atribuido ? (
                        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <h5 className="font-semibold text-green-900 dark:text-green-100">Montador Atribuído</h5>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Nome:</span> {timeout.montador_atribuido.profiles?.nome}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>⭐ {timeout.montador_atribuido.avaliacao_media?.toFixed(1) || '0.0'}</span>
                              <span>{timeout.montador_atribuido.projetos_realizados || 0} projetos</span>
                              <span>{timeout.montador_atribuido.nivel_gamificacao}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Campo de busca e atribuição */
                       <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Buscar montador por nome ou CPF (mínimo 3 caracteres):
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Digite pelo menos 3 caracteres..."
                              value={searchTerms[job.id] || ''}
                              onChange={(e) => setSearchTerms({ ...searchTerms, [job.id]: e.target.value })}
                              className="pl-9"
                            />
                          </div>
                          {searchTerms[job.id] && searchTerms[job.id].length > 0 && searchTerms[job.id].length < 3 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Digite mais {3 - searchTerms[job.id].length} caractere(s)
                            </p>
                          )}
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {getFilteredMontadores(job.id).length === 0 && searchTerms[job.id] && searchTerms[job.id].length >= 3 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nenhum montador encontrado
                            </p>
                          )}
                          {getFilteredMontadores(job.id).slice(0, 5).map((montador) => (
                            <div
                              key={montador.id}
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                            >
                              <div>
                                <p className="font-medium">{montador.profiles?.nome}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>⭐ {montador.avaliacao_media?.toFixed(1) || '0.0'}</span>
                                  <span>{montador.projetos_realizados || 0} projetos</span>
                                  <span>{montador.nivel_gamificacao}</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAssignMontador(job.id, montador.id)}
                                disabled={assigningJobId === job.id}
                              >
                                {assigningJobId === job.id ? 'Atribuindo...' : 'Atribuir'}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
