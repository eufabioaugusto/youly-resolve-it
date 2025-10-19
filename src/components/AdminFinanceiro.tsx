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

  const loadData = async () => {
    logger.adminAction('Carregando dados financeiros');
    setLoading(true);

    try {
      // Calcular data de início baseada no período
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - parseInt(filtroPeriodo));

      // Buscar pagamentos
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from('pagamentos')
        .select(`
          *,
          jobs (*),
          montadores (*)
        `)
        .gte('created_at', dataInicio.toISOString())
        .order('created_at', { ascending: false });

      if (pagamentosError) throw pagamentosError;

      // Buscar profiles dos montadores dos pagamentos separadamente
      let pagamentosComProfiles = pagamentosData;
      if (pagamentosData && pagamentosData.length > 0) {
        const montadorUserIds = pagamentosData
          .map(p => p.montadores?.user_id)
          .filter(Boolean);
        
        if (montadorUserIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('*')
            .in('user_id', montadorUserIds);
          
          // Combinar dados
          pagamentosComProfiles = pagamentosData.map(p => ({
            ...p,
            montadores: p.montadores ? {
              ...p.montadores,
              profiles: profilesData?.find(pr => pr.user_id === p.montadores?.user_id)
            } : null
          }));
        }
      }

      console.log('✅ [AdminFinanceiro] Pagamentos carregados', pagamentosComProfiles);
      setPagamentos(pagamentosComProfiles || []);

      // Buscar montadores com carteiras
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select(`
          *,
          carteira (*)
        `)
        .order('total_valor_movimentado', { ascending: false });
      
      // Buscar profiles dos montadores separadamente
      let montadoresComProfiles = montadoresData;
      if (montadoresData && montadoresData.length > 0) {
        const userIds = montadoresData.map(m => m.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);
        
        // Combinar dados
        montadoresComProfiles = montadoresData.map(m => ({
          ...m,
          profiles: profilesData?.find(p => p.user_id === m.user_id)
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
      const carteira = m.carteira?.[0];
      return [
        m.profiles?.nome || 'N/A',
        m.profiles?.documento || 'N/A',
        m.total_valor_movimentado?.toFixed(2) || '0.00',
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
    const totalMovimentado = montadores.reduce((acc, m) => acc + (m.total_valor_movimentado || 0), 0);
    const totalDisponivel = montadores.reduce((acc, m) => {
      const carteira = m.carteira?.[0];
      return acc + (carteira?.saldo_disponivel || 0);
    }, 0);
    const totalProcessamento = montadores.reduce((acc, m) => {
      const carteira = m.carteira?.[0];
      return acc + (carteira?.saldo_em_processamento || 0);
    }, 0);

    return { totalMovimentado, totalDisponivel, totalProcessamento };
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold">R$ {resumo.totalMovimentado.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-success">R$ {resumo.totalDisponivel.toFixed(2)}</p>
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
                const carteira = montador.carteira?.[0];
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
                      R$ {montador.total_valor_movimentado?.toFixed(2) || '0.00'}
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
                <SelectItem value="aprovado">Aprovados</SelectItem>
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
                    {pagamento.montadores?.profiles?.nome}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    R$ {pagamento.valor_total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        pagamento.status === 'aprovado'
                          ? 'default'
                          : pagamento.status === 'pendente'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {pagamento.status}
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
