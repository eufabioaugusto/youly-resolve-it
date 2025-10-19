import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrdemServicoFlow } from '@/components/OrdemServicoFlow';
import { useProfile } from '@/hooks/useProfile';

export default function OrdemServicoPage() {
  const { osId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, montadorProfile } = useProfile();
  const [ordemServico, setOrdemServico] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (osId && montadorProfile) {
      loadOrdemServico();
    }
  }, [osId, montadorProfile]);

  const loadOrdemServico = async () => {
    console.log('🚀 [OrdemServicoPage] Carregando OS', { osId });
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('ordem_servico')
        .select(`
          *,
          jobs (*),
          clientes (*, profiles:user_id(*)),
          montadores (*, profiles:user_id(*))
        `)
        .eq('id', osId)
        .single();

      if (error) throw error;

      console.log('✅ [OrdemServicoPage] OS carregada', data);
      setOrdemServico(data);
    } catch (error) {
      console.error('❌ [OrdemServicoPage] Erro ao carregar OS', error);
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
            <Button onClick={() => navigate('/montador')}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/montador"
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
            </CardContent>
          </Card>

          <OrdemServicoFlow ordemServico={ordemServico} onOSAtualizada={handleOSAtualizada} />
        </div>
      </div>
    </div>
  );
}
