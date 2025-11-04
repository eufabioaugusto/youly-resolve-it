import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, QrCode, Clock, CheckCircle } from 'lucide-react';
import { usePagamentos } from '@/hooks/usePagamentos';
import { formatCurrency } from '@/lib/utils';

interface PagamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  montadorId: string;
  valor: number;
  jobDescricao: string;
  montadorNome: string;
}

export function PagamentoModal({
  open,
  onOpenChange,
  jobId,
  montadorId,
  valor,
  jobDescricao,
  montadorNome
}: PagamentoModalProps) {
  const { criarCheckout, loading } = usePagamentos();
  const [etapa, setEtapa] = useState<'selecao' | 'processando' | 'redirecionando'>('selecao');

  const handlePagamento = async (metodo: 'cartao' | 'pix') => {
    setEtapa('processando');
    
    try {
      const resultado = await criarCheckout(jobId, montadorId, valor);
      
      if (resultado?.init_point) {
        setEtapa('redirecionando');
        
        // Aguardar um momento para mostrar a mensagem
        setTimeout(() => {
          window.open(resultado.init_point, '_blank');
          onOpenChange(false);
          setEtapa('selecao');
        }, 2000);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      setEtapa('selecao');
    }
  };

  const renderEtapa = () => {
    switch (etapa) {
      case 'processando':
        return (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <h3 className="text-lg font-semibold mb-2">Processando pagamento...</h3>
            <p className="text-muted-foreground">Criando seu checkout seguro</p>
          </div>
        );
      
      case 'redirecionando':
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold mb-2">Redirecionando...</h3>
            <p className="text-muted-foreground">Você será redirecionado para completar o pagamento</p>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            {/* Resumo do Serviço */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{jobDescricao}</p>
                  <p className="text-sm text-muted-foreground">Montador: {montadorNome}</p>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold">Valor total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(valor)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Opções de Pagamento */}
            <div className="space-y-4">
              <h3 className="font-semibold">Escolha a forma de pagamento:</h3>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button 
                    className="w-full h-auto p-4" 
                    variant="outline"
                    onClick={() => handlePagamento('pix')}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <QrCode className="h-6 w-6" />
                        <div className="text-left">
                          <p className="font-medium">PIX</p>
                          <p className="text-sm text-muted-foreground">
                            Pagamento instantâneo
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">Recomendado</Badge>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Button 
                    className="w-full h-auto p-4" 
                    variant="outline"
                    onClick={() => handlePagamento('cartao')}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-6 w-6" />
                        <div className="text-left">
                          <p className="font-medium">Cartão de Crédito</p>
                          <p className="text-sm text-muted-foreground">
                            Parcele em até 12x sem juros
                          </p>
                        </div>
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Informações de Segurança */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                🔒 Pagamento 100% seguro processado pelo Mercado Pago.
                Seus dados estão protegidos.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento do Serviço</DialogTitle>
        </DialogHeader>
        {renderEtapa()}
      </DialogContent>
    </Dialog>
  );
}