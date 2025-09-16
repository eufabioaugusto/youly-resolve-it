import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PagamentoFalha() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-red-600">
              Pagamento Não Aprovado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Não foi possível processar seu pagamento.
              </p>
              <p className="text-sm text-muted-foreground">
                Isso pode acontecer por diversos motivos, como dados incorretos,
                limite insuficiente ou problemas na operadora.
              </p>
            </div>
            
            {paymentId && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium">ID da Tentativa:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {paymentId}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">
                O que fazer agora:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Verifique os dados do seu cartão</li>
                <li>• Confirme se há limite disponível</li>
                <li>• Tente novamente ou use outro método</li>
                <li>• Entre em contato com seu banco se persistir</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={() => navigate(-2)} // Volta 2 páginas para tentar novamente
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}