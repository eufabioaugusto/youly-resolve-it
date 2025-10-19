import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, AlertCircle, Clock, CheckCircle, Wrench } from 'lucide-react';

export function AdminJobManagement() {
  const { toast } = useToast();
  const [jobsTimeout, setJobsTimeout] = useState<any[]>([]);
  const [montadores, setMontadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('🚀 [AdminJobManagement] Carregando dados');
    setLoading(true);

    try {
      // Buscar jobs com timeout expirado
      const { data: timeoutData, error: timeoutError } = await supabase
        .from('timeout_montador')
        .select(`
          *,
          negociacoes (
            *,
            jobs (*),
            montadores (
              *,
              profiles!montadores_user_id_fkey(*)
            )
          )
        `)
        .eq('expirado', true)
        .eq('respondido', false)
        .order('created_at', { ascending: false });

      if (timeoutError) throw timeoutError;

      console.log('✅ [AdminJobManagement] Jobs com timeout:', timeoutData);
      setJobsTimeout(timeoutData || []);

      // Buscar montadores disponíveis
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select('*, profiles!montadores_user_id_fkey(*)')
        .eq('status', 'ativo')
        .order('avaliacao_media', { ascending: false });

      if (montadoresError) throw montadoresError;

      console.log('✅ [AdminJobManagement] Montadores disponíveis:', montadoresData);
      setMontadores(montadoresData || []);
    } catch (error) {
      console.error('❌ [AdminJobManagement] Erro ao carregar dados', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMontador = async (jobId: string, montadorId: string) => {
    console.log('🚀 [AdminJobManagement] Atribuindo montador', { jobId, montadorId });
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
    } catch (error) {
      console.error('❌ [AdminJobManagement] Erro ao atribuir montador', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atribuir o montador',
        variant: 'destructive',
      });
    } finally {
      setAssigningJobId(null);
    }
  };

  const filteredMontadores = montadores.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    const nome = m.profiles?.nome?.toLowerCase() || '';
    const cpf = m.profiles?.documento?.toLowerCase() || '';
    return nome.includes(searchLower) || cpf.includes(searchLower);
  });

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
                            Buscar montador por nome ou CPF:
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Digite nome ou CPF..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {filteredMontadores.slice(0, 5).map((montador) => (
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
