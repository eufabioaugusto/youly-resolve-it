import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, DollarSign, CheckCircle, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface CarteiraProcessamento {
  id: string;
  montador_id: string;
  saldo_em_processamento: number;
  data_liberacao_admin: string;
  montadores: {
    user_id: string;
    profiles: {
      nome: string;
    };
  };
  carteira_transacoes: Array<{
    id: string;
    valor: number;
    descricao: string;
    created_at: string;
    job_id: string;
    jobs?: {
      descricao: string;
    };
  }>;
}

export function AdminCarteiraGestao() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [carteiras, setCarteiras] = useState<CarteiraProcessamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [liberandoId, setLiberandoId] = useState<string | null>(null);

  useEffect(() => {
    carregarCarteirasProcessamento();
  }, []);

  const carregarCarteirasProcessamento = async () => {
    logger.adminAction('Carregando carteiras em processamento');
    setLoading(true);
    try {
      console.log('🔍 [AdminCarteiraGestao] Buscando carteiras...');
      
      // Buscar carteiras com saldo em processamento
      const { data: carteirasData, error: carteirasError } = await supabase
        .from('carteira')
        .select('id, montador_id, saldo_em_processamento, data_liberacao_admin')
        .gt('saldo_em_processamento', 0)
        .order('data_liberacao_admin', { ascending: true });

      if (carteirasError) throw carteirasError;
      
      console.log('✅ [AdminCarteiraGestao] Carteiras encontradas:', carteirasData?.length);

      if (!carteirasData || carteirasData.length === 0) {
        setCarteiras([]);
        setLoading(false);
        return;
      }

      // Buscar montadores
      const montadorIds = carteirasData.map(c => c.montador_id);
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select('id, user_id')
        .in('id', montadorIds);

      if (montadoresError) throw montadoresError;

      // Buscar profiles
      const userIds = montadoresData?.map(m => m.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combinar dados
      const carteirasCompletas = carteirasData.map(carteira => {
        const montador = montadoresData?.find(m => m.id === carteira.montador_id);
        const profile = profilesData?.find(p => p.user_id === montador?.user_id);
        
        return {
          ...carteira,
          montadores: {
            user_id: montador?.user_id,
            profiles: {
              nome: profile?.nome || 'Nome não disponível'
            }
          }
        };
      });

      console.log('✅ [AdminCarteiraGestao] Carteiras completas:', carteirasCompletas);
      logger.info('wallet', 'Carteiras em processamento carregadas', { total: carteirasCompletas.length });
      setCarteiras(carteirasCompletas as any);
    } catch (error: any) {
      console.error('❌ [AdminCarteiraGestao] Erro:', error);
      logger.apiError('wallet', 'AdminCarteiraGestao.carregarCarteirasProcessamento', error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar as carteiras",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const liberarValor = async (carteiraId: string) => {
    if (!user) return;

    logger.adminAction('Liberando valor da carteira', user.id, { carteiraId });
    setLiberandoId(carteiraId);
    try {
      const { error } = await supabase.rpc('liberar_valor_carteira', {
        p_carteira_id: carteiraId,
        p_admin_user_id: user.id
      });

      if (error) {
        throw error;
      }

      logger.info('wallet', 'Valor liberado com sucesso', { carteiraId }, user.id);
      toast({
        title: "Sucesso",
        description: "Valor liberado com sucesso!",
      });

      // Recarregar dados
      await carregarCarteirasProcessamento();
    } catch (error: any) {
      logger.apiError('wallet', 'AdminCarteiraGestao.liberarValor', error, user.id);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível liberar o valor",
        variant: "destructive"
      });
    } finally {
      setLiberandoId(null);
    }
  };

  const calcularDiasRestantes = (dataLiberacao: string) => {
    const dataLib = new Date(dataLiberacao);
    const agora = new Date();
    const diffTime = dataLib.getTime() - agora.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestão de Carteiras - Valores em Processamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Gestão de Carteiras - Valores em Processamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Valores bloqueados aguardando liberação de 3 dias
        </p>
      </CardHeader>
      <CardContent>
        {carteiras.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">
              Não há valores em processamento no momento
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Montador</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data de Liberação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carteiras.map((carteira) => {
                const diasRestantes = calcularDiasRestantes(carteira.data_liberacao_admin);
                const podeLiberar = diasRestantes <= 0;
                
                return (
                  <TableRow key={carteira.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {carteira.montadores?.profiles?.nome || 'Nome não disponível'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(carteira.saldo_em_processamento)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <p className="text-sm">
                            {formatDate(carteira.data_liberacao_admin)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {diasRestantes > 0 ? `${diasRestantes} dias restantes` : 'Pode liberar'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {podeLiberar ? (
                        <Badge variant="destructive">
                          <Clock className="h-3 w-3 mr-1" />
                          Pronto para liberar
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Em processamento
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => liberarValor(carteira.id)}
                        disabled={liberandoId === carteira.id}
                        variant={podeLiberar ? "default" : "outline"}
                      >
                        {liberandoId === carteira.id ? (
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {podeLiberar ? 'Liberar Agora' : 'Liberar Antecipado'}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">
            Como funciona o sistema de maturação:
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Quando um pagamento é aprovado, o valor fica bloqueado por 3 dias</li>
            <li>• Após 3 dias, o valor pode ser liberado automaticamente</li>
            <li>• Como admin, você pode liberar antecipadamente se necessário</li>
            <li>• Valores liberados ficam disponíveis para saque pelo montador</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}