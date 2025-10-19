import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProcessarPagamentoManual() {
  const [pagamentoId, setPagamentoId] = useState('72567556-bf7f-4c64-b1e0-0d64db8499bf');
  const [mpPaymentId, setMpPaymentId] = useState('129965982363');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const processar = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'processar-pagamento-manual',
        {
          body: {
            pagamento_id: pagamentoId,
            mercado_pago_payment_id: mpPaymentId
          }
        }
      );

      if (invokeError) throw invokeError;
      
      setResult(data);
    } catch (err: any) {
      console.error('Erro:', err);
      setError(err.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Processar Pagamento Manual</CardTitle>
          <CardDescription>
            Use esta ferramenta para processar manualmente um pagamento que não foi processado automaticamente pelo webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="pagamento-id">ID do Pagamento (Supabase)</Label>
              <Input
                id="pagamento-id"
                value={pagamentoId}
                onChange={(e) => setPagamentoId(e.target.value)}
                placeholder="UUID do pagamento"
              />
            </div>

            <div>
              <Label htmlFor="mp-payment-id">ID do Pagamento (Mercado Pago)</Label>
              <Input
                id="mp-payment-id"
                value={mpPaymentId}
                onChange={(e) => setMpPaymentId(e.target.value)}
                placeholder="ID do pagamento no Mercado Pago"
              />
            </div>

            <Button 
              onClick={processar} 
              disabled={loading || !pagamentoId}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Processando...' : 'Processar Pagamento'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="bg-success/10 border-success">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">✅ {result.message}</p>
                  {result.pagamento_id && (
                    <p className="text-sm">Pagamento ID: {result.pagamento_id}</p>
                  )}
                  {result.ordem_servico_id && (
                    <p className="text-sm">Ordem de Serviço ID: {result.ordem_servico_id}</p>
                  )}
                  {result.codigo_validacao && (
                    <p className="text-sm font-mono">
                      Código de Validação: <strong>{result.codigo_validacao}</strong>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/50 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">📋 Informações Pré-preenchidas:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Job:</strong> MESA REDONDA 90 CM MENDOZA</li>
              <li><strong>Cliente:</strong> Cliente Um</li>
              <li><strong>Montador:</strong> Kamido Gomes</li>
              <li><strong>Valor:</strong> R$ 1,00</li>
              <li><strong>Payment ID MP:</strong> 129965982363</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-2">O que será feito:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Atualizar status do pagamento para "pago"</li>
                <li>Adicionar R$ 1,00 ao saldo em processamento do montador</li>
                <li>Criar transação na carteira (bloqueio por 3 dias)</li>
                <li>Criar Ordem de Serviço automaticamente</li>
                <li>Atualizar status do job para "pago"</li>
                <li>Gerar código de validação</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
