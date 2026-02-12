import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Download, Filter, TrendingUp } from 'lucide-react';
import { logger } from '@/lib/logger';

export function AdminFinanceiro() {
  const { toast } = useToast();
  const [montadores, setMontadores] = useState<any[]>([]);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('all');
  const [filtroPeriodo, setFiltroPeriodo] = useState('30');

  useEffect(() => {
    loadData();
  }, [filtroPeriodo]);

  // Realtime para pagamentos e carteira
  useEffect(() => {
    console.log('🔔 Configurando realtime para pagamentos e carteira no Admin');
    
    const channel = supabase
      .channel('admin-financeiro-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pagamentos'
        },
        (payload) => {
          console.log('🔥 Pagamento atualizado no Admin:', payload);
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'carteira'
        },
        (payload) => {
          console.log('💰 Carteira atualizada no Admin:', payload);
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'montadores'
        },
        (payload) => {
          console.log('👷 Montador atualizado no Admin:', payload);
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    logger.adminAction('Carregando dados financeiros');
    setLoading(true);

    try {
      // Buscar TODOS os pagamentos (sem filtro de data)
      console.log('🔍 [AdminFinanceiro] Buscando todos os pagamentos...');
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from('pagamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (pagamentosError) throw pagamentosError;

      // Buscar jobs relacionados
      const jobIds = pagamentosData?.map(p => p.job_id).filter(Boolean) || [];
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, descricao, categoria')
        .in('id', jobIds);

      // Buscar montadores e profiles dos pagamentos
      const montadorIds = pagamentosData?.map(p => p.montador_id).filter(Boolean) || [];
      const { data: montadoresPagData } = await supabase
        .from('montadores')
        .select('id, user_id')
        .in('id', montadorIds);

      const userIds = montadoresPagData?.map(m => m.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      // Combinar dados
      const pagamentosCompletos = pagamentosData?.map(pag => ({
        ...pag,
        jobs: jobsData?.find(j => j.id === pag.job_id),
        montadores: montadoresPagData?.find(m => m.id === pag.montador_id),
        montador_nome: profilesData?.find(p => 
          p.user_id === montadoresPagData?.find(m => m.id === pag.montador_id)?.user_id
        )?.nome
      }));

      console.log('✅ [AdminFinanceiro] Pagamentos carregados', pagamentosCompletos);
      setPagamentos(pagamentosCompletos || []);

      // Calcular total movimentado por montador a partir dos pagamentos PAGOS
      const totalMovimentadoPorMontador = new Map<string, number>();
      pagamentosCompletos?.forEach(pag => {
        if (pag.status === 'pago' && pag.montador_id) {
          const atual = totalMovimentadoPorMontador.get(pag.montador_id) || 0;
          totalMovimentadoPorMontador.set(pag.montador_id, atual + (pag.valor_montador || 0));
        }
      });

      // Buscar montadores com carteiras
      console.log('🔍 [AdminFinanceiro] Buscando montadores e carteiras...');
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select(`
          *,
          carteira (*)
        `)
        .order('total_valor_movimentado', { ascending: false });
      
      console.log('📊 [AdminFinanceiro] Montadores carregados:', montadoresData?.length);
      console.log('💰 [AdminFinanceiro] Exemplo carteira:', montadoresData?.[0]?.carteira);
      console.log('🔍 [AdminFinanceiro] Tipo carteira:', Array.isArray(montadoresData?.[0]?.carteira) ? 'ARRAY' : 'OBJECT');
      console.log('🧪 [AdminFinanceiro] Teste acesso [0]:', montadoresData?.[0]?.carteira?.[0]);
      console.log('🧪 [AdminFinanceiro] Teste acesso direto:', montadoresData?.[0]?.carteira);
      
      // Buscar profiles dos montadores separadamente
      let montadoresComProfiles = montadoresData;
      if (montadoresData && montadoresData.length > 0) {
        const userIds = montadoresData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        
      // Combinar dados e adicionar total_movimentado calculado
      montadoresComProfiles = montadoresData.map(m => ({
        ...m,
        profiles: profilesData?.find(p => p.user_id === m.user_id),
        total_movimentado_calculado: totalMovimentadoPorMontador.get(m.id) || 0
      }));
    }

      if (montadoresError) throw montadoresError;

      logger.info('admin', 'Dados financeiros carregados', { montadores: montadoresComProfiles?.length });
      setMontadores(montadoresComProfiles || []);
    } catch (error: any) {
      logger.apiError('admin', 'AdminFinanceiro.loadData', error);
      toast({
        title: 'Erro',
        description: error?.message || 'Não foi possível carregar os dados financeiros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = () => {
    logger.adminAction('Exportando relatório financeiro');
    
    // Preparar dados para CSV
    const csvHeader = 'Montador,CPF,Total Movimentado,Saldo Disponível,Em Processamento,Total Sacado\n';
    const csvRows = montadores.map((m) => {
      const carteira = Array.isArray(m.carteira) ? m.carteira[0] : m.carteira;
      return [
        m.profiles?.nome || 'N/A',
        m.profiles?.documento || 'N/A',
        (m.total_movimentado_calculado || 0).toFixed(2),
        carteira?.saldo_disponivel?.toFixed(2) || '0.00',
        carteira?.saldo_em_processamento?.toFixed(2) || '0.00',
        carteira?.total_sacado?.toFixed(2) || '0.00',
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Relatório exportado!',
      description: 'O arquivo CSV foi baixado com sucesso',
    });
  };

  const calcularResumo = () => {
    // APENAS pagamentos com status 'pago' devem ser considerados para cálculos financeiros
    const pagamentosPagos = pagamentos.filter(p => p.status === 'pago');
    const totalMovimentado = pagamentosPagos.reduce((acc, p) => acc + (p.valor_total || 0), 0);
    const totalComissaoPlataforma = pagamentosPagos.reduce((acc, p) => acc + (p.comissao_plataforma || 0), 0);
    const totalMontadores = pagamentosPagos.reduce((acc, p) => acc + (p.valor_montador || 0), 0);
    
    // Saldos das carteiras
    const totalDisponivel = montadores.reduce((acc, m) => {
      const carteira = Array.isArray(m.carteira) ? m.carteira[0] : m.carteira;
      return acc + (Number(carteira?.saldo_disponivel || 0));
    }, 0);
    const totalProcessamento = montadores.reduce((acc, m) => {
      const carteira = Array.isArray(m.carteira) ? m.carteira[0] : m.carteira;
      return acc + (Number(carteira?.saldo_em_processamento || 0));
    }, 0);

    return { 
      totalMovimentado, 
      totalComissaoPlataforma, 
      totalMontadores, 
      totalDisponivel, 
      totalProcessamento,
      totalPagos: pagamentosPagos.length,
      totalPagamentos: pagamentos.length
    };
  };

  const filteredPagamentos = pagamentos.filter((p) => {
    if (filtroStatus !== 'all' && p.status !== filtroStatus) return false;
    return true;
  });

  const resumo = calcularResumo();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume Pago</p>
                <p className="text-2xl font-bold">R$ {resumo.totalMovimentado.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {resumo.totalPagos} pagos de {resumo.totalPagamentos} total
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comissão Plataforma</p>
                <p className="text-2xl font-bold text-primary">R$ {resumo.totalComissaoPlataforma.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">20% dos pagamentos</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Montadores</p>
                <p className="text-2xl font-bold text-success">R$ {resumo.totalMontadores.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">80% dos pagamentos</p>
              </div>
              <DollarSign className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Processamento</p>
                <p className="text-2xl font-bold text-warning">R$ {resumo.totalProcessamento.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Liberação em 3 dias</p>
              </div>
              <DollarSign className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Exportação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Relatório de Montadores</CardTitle>
            <div className="flex gap-2">
              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportarRelatorio} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Montador</TableHead>
                <TableHead className="text-right">Total Movimentado</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="text-right">Em Processo</TableHead>
                <TableHead className="text-right">Sacado</TableHead>
                <TableHead className="text-center">Projetos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {montadores.map((montador) => {
                const carteira = Array.isArray(montador.carteira) ? montador.carteira[0] : montador.carteira;
                return (
                  <TableRow key={montador.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{montador.profiles?.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {montador.profiles?.documento}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R$ {(montador.total_movimentado_calculado || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-success">
                      R$ {carteira?.saldo_disponivel?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right text-warning">
                      R$ {carteira?.saldo_em_processamento?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {carteira?.total_sacado?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{montador.projetos_realizados || 0}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <CardDescription>Últimos pagamentos processados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pago">Pagos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Montador</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Parcelas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPagamentos.map((pagamento) => (
                <TableRow key={pagamento.id}>
                  <TableCell className="text-sm">
                    {new Date(pagamento.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {pagamento.jobs?.descricao?.substring(0, 30)}...
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {pagamento.montador_nome || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {pagamento.valor_total?.toFixed(2) || '0.00'}
                    <p className="text-xs text-muted-foreground mt-1">
                      Plataforma: R$ {pagamento.comissao_plataforma?.toFixed(2) || '0.00'} | 
                      Montador: R$ {pagamento.valor_montador?.toFixed(2) || '0.00'}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        pagamento.status === 'pago'
                          ? 'default'
                          : pagamento.status === 'pendente'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {pagamento.status === 'pago' ? 'Pago' : pagamento.status === 'pendente' ? 'Pendente' : 'Rejeitado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {pagamento.installments || 1}x
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
