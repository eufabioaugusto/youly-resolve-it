import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEstorno, Estorno, EstornoStatus, MOTIVO_CATEGORIAS } from '@/hooks/useEstorno';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_CONFIG: Record<EstornoStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  solicitado: { label: 'Aguardando', variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
  aprovado: { label: 'Aprovado', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
  processando: { label: 'Processando', variant: 'outline', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  concluido: { label: 'Concluído', variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
  recusado: { label: 'Recusado', variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
  falhou: { label: 'Falhou', variant: 'destructive', icon: <AlertTriangle className="w-3 h-3" /> },
};

interface EstornoComDetalhes {
  id: string;
  pagamento_id: string;
  job_id: string;
  ordem_servico_id?: string | null;
  cliente_id: string;
  montador_id: string;
  valor_estorno: number;
  valor_original: number;
  tipo: 'total' | 'parcial';
  motivo: string;
  motivo_categoria: string;
  solicitado_por: string;
  aprovado_por?: string | null;
  status: EstornoStatus;
  mercado_pago_refund_id?: string | null;
  error_message?: string | null;
  metadata?: unknown;
  created_at: string;
  processed_at?: string | null;
  jobs?: { descricao: string } | null;
  clientes?: { profiles?: { nome: string } | null } | null;
  montadores?: { profiles?: { nome: string } | null } | null;
}

export function AdminEstornos() {
  const { aprovarEstorno, recusarEstorno, reprocessarEstorno, loading: actionLoading } = useEstorno();
  
  const [estornos, setEstornos] = useState<EstornoComDetalhes[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<EstornoStatus | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  
  // Modal de detalhes/ação
  const [modalOpen, setModalOpen] = useState(false);
  const [estornoSelecionado, setEstornoSelecionado] = useState<EstornoComDetalhes | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [acao, setAcao] = useState<'aprovar' | 'recusar' | 'reprocessar' | null>(null);

  useEffect(() => {
    loadEstornos();
  }, [filtroStatus]);

  const loadEstornos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('estornos')
        .select(`
          *,
          jobs:job_id(descricao)
        `)
        .order('created_at', { ascending: false });

      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes de clientes e montadores
      const estornosComNomes = await Promise.all(
        (data || []).map(async (estorno) => {
          // Cliente
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('user_id')
            .eq('id', estorno.cliente_id)
            .single();

          let clienteNome = 'N/A';
          if (clienteData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', clienteData.user_id)
              .single();
            clienteNome = profileData?.nome || 'N/A';
          }

          // Montador
          const { data: montadorData } = await supabase
            .from('montadores')
            .select('user_id')
            .eq('id', estorno.montador_id)
            .single();

          let montadorNome = 'N/A';
          if (montadorData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', montadorData.user_id)
              .single();
            montadorNome = profileData?.nome || 'N/A';
          }

          return {
            ...estorno,
            clientes: { profiles: { nome: clienteNome } },
            montadores: { profiles: { nome: montadorNome } }
          };
        })
      );

      setEstornos(estornosComNomes);
    } catch (error) {
      console.error('Erro ao carregar estornos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    if (!estornoSelecionado) return;
    
    const sucesso = await aprovarEstorno(estornoSelecionado.id);
    if (sucesso) {
      setModalOpen(false);
      setEstornoSelecionado(null);
      loadEstornos();
    }
  };

  const handleRecusar = async () => {
    if (!estornoSelecionado || motivoRecusa.length < 10) return;
    
    const sucesso = await recusarEstorno(estornoSelecionado.id, motivoRecusa);
    if (sucesso) {
      setModalOpen(false);
      setEstornoSelecionado(null);
      setMotivoRecusa('');
      loadEstornos();
    }
  };

  const handleReprocessar = async () => {
    if (!estornoSelecionado) return;
    
    const sucesso = await reprocessarEstorno(estornoSelecionado.id);
    if (sucesso) {
      setModalOpen(false);
      setEstornoSelecionado(null);
      loadEstornos();
    }
  };

  const abrirModal = (estorno: EstornoComDetalhes, acaoInicial?: 'aprovar' | 'recusar' | 'reprocessar') => {
    setEstornoSelecionado(estorno);
    setAcao(acaoInicial || null);
    setMotivoRecusa('');
    setModalOpen(true);
  };

  const estornosFiltrados = estornos.filter(e => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      e.id.toLowerCase().includes(termo) ||
      e.motivo.toLowerCase().includes(termo) ||
      e.clientes?.profiles?.nome?.toLowerCase().includes(termo) ||
      e.montadores?.profiles?.nome?.toLowerCase().includes(termo)
    );
  });

  const contadores = {
    solicitado: estornos.filter(e => e.status === 'solicitado').length,
    processando: estornos.filter(e => e.status === 'processando').length,
    concluido: estornos.filter(e => e.status === 'concluido').length,
    falhou: estornos.filter(e => e.status === 'falhou' || e.status === 'recusado').length,
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFiltroStatus('solicitado')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{contadores.solicitado}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFiltroStatus('processando')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processando</p>
                <p className="text-2xl font-bold text-blue-600">{contadores.processando}</p>
              </div>
              <Loader2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFiltroStatus('concluido')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{contadores.concluido}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setFiltroStatus('falhou')}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Falhas/Recusas</p>
                <p className="text-2xl font-bold text-destructive">{contadores.falhou}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gestão de Estornos</span>
            <Button variant="outline" size="sm" onClick={loadEstornos} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, motivo, cliente ou montador..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as EstornoStatus | 'todos')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="solicitado">Aguardando</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
                <SelectItem value="falhou">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : estornosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum estorno encontrado
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Montador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estornosFiltrados.map((estorno) => {
                    const statusConfig = STATUS_CONFIG[estorno.status];
                    const categoriaLabel = MOTIVO_CATEGORIAS.find(c => c.value === estorno.motivo_categoria)?.label || estorno.motivo_categoria;
                    
                    return (
                      <TableRow key={estorno.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(estorno.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>{estorno.clientes?.profiles?.nome || 'N/A'}</TableCell>
                        <TableCell>{estorno.montadores?.profiles?.nome || 'N/A'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-medium">{formatCurrency(estorno.valor_estorno)}</span>
                          {estorno.tipo === 'parcial' && (
                            <span className="text-xs text-muted-foreground ml-1">
                              / {formatCurrency(estorno.valor_original)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {categoriaLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className="gap-1">
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirModal(estorno)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {estorno.status === 'solicitado' && (
                                <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => abrirModal(estorno, 'aprovar')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => abrirModal(estorno, 'recusar')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            {(estorno.status === 'concluido' && estorno.error_message) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModal(estorno, 'reprocessar')}
                                title="Reprocessar - corrigir registros pendentes"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            {estorno.status === 'falhou' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => abrirModal(estorno, 'reprocessar')}
                                title="Reprocessar estorno falho"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes/ação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {acao === 'aprovar' ? 'Aprovar Estorno' : acao === 'recusar' ? 'Recusar Estorno' : acao === 'reprocessar' ? 'Reprocessar Estorno' : 'Detalhes do Estorno'}
            </DialogTitle>
            <DialogDescription>
              ID: {estornoSelecionado?.id.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {estornoSelecionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{estornoSelecionado.clientes?.profiles?.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montador</p>
                  <p className="font-medium">{estornoSelecionado.montadores?.profiles?.nome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor do Estorno</p>
                  <p className="font-medium text-destructive">{formatCurrency(estornoSelecionado.valor_estorno)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor Original</p>
                  <p className="font-medium">{formatCurrency(estornoSelecionado.valor_original)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Categoria</p>
                  <p className="font-medium">
                    {MOTIVO_CATEGORIAS.find(c => c.value === estornoSelecionado.motivo_categoria)?.label}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Motivo Detalhado</p>
                  <p className="font-medium bg-muted/50 p-2 rounded">{estornoSelecionado.motivo}</p>
                </div>
                {estornoSelecionado.error_message && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Mensagem de Erro</p>
                    <p className="text-destructive text-sm">{estornoSelecionado.error_message}</p>
                  </div>
                )}
              </div>

              {acao === 'recusar' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Motivo da Recusa *</p>
                  <Textarea
                    placeholder="Explique o motivo da recusa (mínimo 10 caracteres)..."
                    value={motivoRecusa}
                    onChange={(e) => setMotivoRecusa(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {acao === 'aprovar' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Atenção:</strong> Ao aprovar, o estorno será processado automaticamente no Mercado Pago 
                    e o valor será debitado da carteira do montador.
                  </p>
                </div>
              )}

              {acao === 'reprocessar' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Reprocessar:</strong> Isso vai forçar a atualização da OS para "cancelada", 
                    o job para "cancelado" e o pagamento para "estornado". Use quando o estorno foi aprovado 
                    no MP mas os registros internos ficaram inconsistentes.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              {acao ? 'Cancelar' : 'Fechar'}
            </Button>
            {acao === 'aprovar' && estornoSelecionado?.status === 'solicitado' && (
              <Button onClick={handleAprovar} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar Aprovação
              </Button>
            )}
            {acao === 'recusar' && estornoSelecionado?.status === 'solicitado' && (
              <Button variant="destructive" onClick={handleRecusar} disabled={actionLoading || motivoRecusa.length < 10}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Confirmar Recusa
              </Button>
            )}
            {acao === 'reprocessar' && (
              <Button onClick={handleReprocessar} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Reprocessar Estorno
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
