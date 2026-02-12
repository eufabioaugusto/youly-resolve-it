import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrdemServicoFlow } from '@/components/OrdemServicoFlow';
import { useProfile } from '@/hooks/useProfile';
import { SolicitarEstornoModal } from '@/components/SolicitarEstornoModal';
import { useEstorno } from '@/hooks/useEstorno';
import { Alert, AlertDescription } from '@/components/ui/alert';
export default function OrdemServicoPage() {
  const { osId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, montadorProfile } = useProfile();
  const { verificarPermissao } = useEstorno();
  const [ordemServico, setOrdemServico] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEstornoModal, setShowEstornoModal] = useState(false);
  const [pagamentoId, setPagamentoId] = useState<string | null>(null);
  const [pagamentoValor, setPagamentoValor] = useState<number>(0);
  const [permissaoEstorno, setPermissaoEstorno] = useState<any>(null);
  const [loadingPagamento, setLoadingPagamento] = useState(false);

  useEffect(() => {
    if (osId && profile) {
      loadOrdemServico();
    }
  }, [osId, profile]);

  // Buscar pagamento relacionado e verificar permissão de estorno
  useEffect(() => {
    const loadPagamentoEPermissao = async () => {
      if (!ordemServico?.job_id || profile?.role !== 'client') return;
      
      setLoadingPagamento(true);
      try {
        // Buscar pagamento do job
        const { data: pagamento } = await supabase
          .from('pagamentos')
          .select('id, valor_total, status')
          .eq('job_id', ordemServico.job_id)
          .eq('status', 'pago')
          .maybeSingle();

        if (pagamento) {
          setPagamentoId(pagamento.id);
          setPagamentoValor(pagamento.valor_total);
          
          // Verificar permissão de estorno
          const permissao = await verificarPermissao(pagamento.id);
          setPermissaoEstorno(permissao);
        }
      } catch (error) {
        console.error('Erro ao buscar pagamento:', error);
      } finally {
        setLoadingPagamento(false);
      }
    };

    loadPagamentoEPermissao();
  }, [ordemServico?.job_id, profile?.role]);

  const loadOrdemServico = async () => {
    setLoading(true);

    try {
      // Buscar OS
      const { data: osData, error: osError } = await supabase
        .from('ordem_servico')
        .select('*')
        .eq('id', osId)
        .single();

      if (osError) throw osError;

      // Buscar job
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', osData.job_id)
        .single();

      // Buscar cliente
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('id, user_id')
        .eq('id', osData.cliente_id)
        .single();

      // Buscar profile do cliente
      const { data: clienteProfile } = await supabase
        .from('profiles')
        .select('nome, telefone')
        .eq('user_id', clienteData?.user_id)
        .single();

      // Buscar montador
      const { data: montadorData } = await supabase
        .from('montadores')
        .select('id, user_id')
        .eq('id', osData.montador_id)
        .single();

      // Buscar profile do montador
      const { data: montadorProfileData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', montadorData?.user_id)
        .single();

      // Combinar dados
      const osCompleta = {
        ...osData,
        jobs: jobData,
        clientes: {
          ...clienteData,
          profiles: clienteProfile
        },
        montadores: {
          ...montadorData,
          profiles: montadorProfileData
        }
      };

      setOrdemServico(osCompleta);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a ordem de serviço',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOSAtualizada = () => {
    console.log('✅ [OrdemServicoPage] OS atualizada, recarregando');
    loadOrdemServico();
  };

  const handleEstornoSuccess = () => {
    setShowEstornoModal(false);
    loadOrdemServico();
    // Resetar permissão pois pagamento foi estornado
    setPagamentoId(null);
    setPermissaoEstorno(null);
  };

  // Verificar se pode mostrar botão de estorno
  const canShowEstornoButton = profile?.role === 'client' && 
    pagamentoId && 
    permissaoEstorno?.permitido &&
    !['concluida', 'concluida_com_assistencia', 'cancelada'].includes(ordemServico?.status);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando ordem de serviço...</p>
        </div>
      </div>
    );
  }

  if (!ordemServico) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Ordem de serviço não encontrada</p>
            <Button onClick={() => navigate(profile?.role === 'client' ? '/cliente' : '/montador')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardPath = profile?.role === 'client' ? '/cliente' : '/montador';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to={dashboardPath}
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ordem de Serviço</span>
                <span className="text-sm font-normal text-muted-foreground">
                  #{ordemServico.id.substring(0, 8)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Cliente:</span>{' '}
                  {ordemServico.clientes?.profiles?.nome}
                </p>
                <p>
                  <span className="font-medium">Serviço:</span> {ordemServico.jobs?.descricao}
                </p>
                <p>
                  <span className="font-medium">Endereço:</span>{' '}
                  {ordemServico.jobs?.endereco?.rua}, {ordemServico.jobs?.endereco?.numero} -{' '}
                  {ordemServico.jobs?.endereco?.bairro}, {ordemServico.jobs?.endereco?.cidade}/
                  {ordemServico.jobs?.endereco?.estado}
                </p>
              </div>

              {/* Botão de Solicitar Estorno */}
              {canShowEstornoButton && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowEstornoModal(true)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Solicitar Cancelamento/Estorno
                  </Button>
                  {permissaoEstorno?.requer_aprovacao && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {permissaoEstorno.motivo}
                    </p>
                  )}
                </div>
              )}

              {/* Alerta quando estorno não é permitido (para clientes) */}
              {profile?.role === 'client' && pagamentoId && permissaoEstorno && !permissaoEstorno.permitido && (
                <Alert variant="default" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {permissaoEstorno.motivo}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <OrdemServicoFlow ordemServico={ordemServico} onOSAtualizada={handleOSAtualizada} userRole={profile?.role} />
        </div>
      </div>

      {/* Modal de Estorno */}
      {pagamentoId && (
        <SolicitarEstornoModal
          open={showEstornoModal}
          onOpenChange={setShowEstornoModal}
          pagamentoId={pagamentoId}
          valorOriginal={pagamentoValor}
          jobDescricao={ordemServico?.jobs?.descricao || ''}
          onSuccess={handleEstornoSuccess}
        />
      )}
    </div>
  );
}
