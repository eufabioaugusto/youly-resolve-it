import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, AlertCircle, Clock, CheckCircle, Wrench } from 'lucide-react';
import { logger } from '@/lib/logger';

export function AdminJobManagement() {
  const { toast } = useToast();
  const [jobsTimeout, setJobsTimeout] = useState<any[]>([]);
  const [montadores, setMontadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    logger.adminAction('Carregando dados do painel de gestão de jobs');
    setLoading(true);

    try {
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

          // Combinar dados
          timeoutDataComJobs = timeoutData.map(t => {
            const job = jobsData?.find(j => j.id === t.job_id);
            const cliente = clientesData.find(c => c.id === job?.cliente_id);
            
            return {
              ...t,
              jobs: job,
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
      // Atualizar job com novo montador
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ montador_id: montadorId, status: 'em_negociacao' })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Criar nova negociação
      const { data: jobData } = await supabase
        .from('jobs')
        .select('cliente_id')
        .eq('id', jobId)
        .single();

      const { error: negError } = await supabase
        .from('negociacoes')
        .insert({
          job_id: jobId,
          montador_id: montadorId,
          cliente_id: jobData?.cliente_id,
          status: 'pendente',
        });

      if (negError) throw negError;

      console.log('✅ [AdminJobManagement] Montador atribuído com sucesso');
      toast({
        title: 'Sucesso!',
        description: 'Montador atribuído ao job com sucesso',
      });

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Jobs com Timeout Expirado
          </CardTitle>
          <CardDescription>
            Montadores que não responderam em 40 minutos - atribuição manual necessária
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                            Montador original: {montadorOriginal?.profiles?.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Expirado em: {new Date(timeout.data_expiracao).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <Badge variant="destructive">Timeout</Badge>
                      </div>

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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
