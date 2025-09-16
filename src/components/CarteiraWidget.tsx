import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Clock, ArrowUp, ArrowDown, Wallet, CreditCard } from 'lucide-react';
import { useCarteira } from '@/hooks/useCarteira';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';

export function CarteiraWidget() {
  const { carteira, transacoes, loading, solicitarSaque } = useCarteira();
  const { toast } = useToast();
  const [saqueModalOpen, setSaqueModalOpen] = useState(false);
  const [valorSaque, setValorSaque] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [processandoSaque, setProcessandoSaque] = useState(false);

  const handleSaque = async () => {
    if (!valorSaque || !chavePix) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const valor = parseFloat(valorSaque);
    if (valor <= 0 || valor > (carteira?.saldo_disponivel || 0)) {
      toast({
        title: "Erro",
        description: "Valor inválido para saque",
        variant: "destructive"
      });
      return;
    }

    setProcessandoSaque(true);
    try {
      await solicitarSaque(valor, chavePix);
      toast({
        title: "Sucesso",
        description: "Solicitação de saque enviada!",
      });
      setSaqueModalOpen(false);
      setValorSaque('');
      setChavePix('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessandoSaque(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!carteira) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carteira não encontrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Minha Carteira
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saldos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg border">
            <p className="text-sm text-muted-foreground">Disponível</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(carteira.saldo_disponivel)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-yellow-50 rounded-lg border">
            <p className="text-sm text-muted-foreground">Em Processamento</p>
            <p className="text-lg font-bold text-yellow-600">
              {formatCurrency(carteira.saldo_em_processamento)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-muted-foreground">Total Sacado</p>
            <p className="text-lg font-bold text-gray-600">
              {formatCurrency(carteira.total_sacado)}
            </p>
          </div>
        </div>

        {/* Data de liberação */}
        {carteira.data_liberacao_admin && carteira.saldo_em_processamento > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Liberação prevista: {formatDate(carteira.data_liberacao_admin)}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Ações */}
        <div className="flex gap-2">
          <Dialog open={saqueModalOpen} onOpenChange={setSaqueModalOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex-1"
                disabled={carteira.saldo_disponivel <= 0}
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Sacar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Saque</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor">Valor do Saque</Label>
                  <Input
                    id="valor"
                    type="number"
                    placeholder="0.00"
                    value={valorSaque}
                    onChange={(e) => setValorSaque(e.target.value)}
                    max={carteira.saldo_disponivel}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Disponível: {formatCurrency(carteira.saldo_disponivel)}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="pix">Chave PIX</Label>
                  <Input
                    id="pix"
                    placeholder="Digite sua chave PIX"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleSaque}
                  disabled={processandoSaque}
                  className="w-full"
                >
                  {processandoSaque ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Solicitar Saque
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Últimas transações */}
        <div>
          <h4 className="font-medium mb-2">Últimas Transações</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {transacoes.length > 0 ? (
              transacoes.slice(0, 5).map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    {transacao.tipo === 'entrada' || transacao.tipo === 'liberacao' ? (
                      <ArrowDown className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowUp className="h-3 w-3 text-red-600" />
                    )}
                    <span className="truncate max-w-32">{transacao.descricao}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transacao.tipo === 'entrada' || transacao.tipo === 'liberacao' 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transacao.tipo === 'entrada' || transacao.tipo === 'liberacao' ? '+' : '-'}
                      {formatCurrency(transacao.valor)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transacao.created_at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground text-sm py-4">
                Nenhuma transação ainda
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}