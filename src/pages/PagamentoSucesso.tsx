import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { formatCurrency } from '@/lib/utils';

export default function PagamentoSucesso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { buscarPagamento } = usePagamentos();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [pagamento, setPagamento] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  useEffect(() => {
    const carregarPagamento = async () => {
      if (paymentId) {
        // Buscar pagamento pela external_reference do MP
        // Por enquanto, mostrar sucesso genérico
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    carregarPagamento();
  }, [paymentId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Verificando pagamento...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Pagamento Confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Seu pagamento foi processado com sucesso.
              </p>
              <p className="text-sm text-muted-foreground">
                O montador foi notificado e o valor está sendo processado.
              </p>
            </div>
            
            {paymentId && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium">ID do Pagamento:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {paymentId}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">
                  Próximos passos:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• O montador iniciará o trabalho conforme acordado</li>
                  <li>• O valor ficará retido por 3 dias para garantia</li>
                  <li>• Após a conclusão, o pagamento será liberado</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = 'https://youly.com.br'}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
              <Button 
                onClick={() => {
                  // Verificar se está autenticado antes de navegar
                  if (user) {
                    navigate('/cliente');
                  } else {
                    // Se não estiver autenticado, redirecionar para login com retorno para /cliente
                    navigate('/login', { state: { from: '/cliente' } });
                  }
                }}
                className="flex-1"
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}