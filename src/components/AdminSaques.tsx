import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, X, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Saque {
  id: string;
  montador_id: string;
  valor: number;
  chave_pix: string;
  status: 'solicitado' | 'aprovado' | 'rejeitado' | 'pago';
  created_at: string;
  updated_at: string;
  montadores?: {
    user_id: string;
    profiles?: {
      nome: string;
      documento: string;
      telefone: string;
    };
  };
}

export function AdminSaques() {
  const { toast } = useToast();
  const [saques, setSaques] = useState<Saque[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'aprovar' | 'recusar' | null;
    saqueId: string | null;
    valor: number;
  }>({
    open: false,
    type: null,
    saqueId: null,
    valor: 0,
  });

  useEffect(() => {
    loadSaques();
  }, []);

  // Realtime para saques
  useEffect(() => {
    console.log('🔔 Configurando realtime para saques no Admin');
    
    const channel = supabase
      .channel('admin-saques-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saques'
        },
        (payload) => {
          console.log('💰 Saque atualizado no Admin:', payload);
          loadSaques();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSaques = async () => {
    try {
      setLoading(true);
      
      const { data: saquesData, error } = await supabase
        .from('saques')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar montadores e seus profiles separadamente
      if (saquesData && saquesData.length > 0) {
        const montadorIds = saquesData.map(s => s.montador_id);
        const { data: montadoresData } = await supabase
          .from('montadores')
          .select('id, user_id')
          .in('id', montadorIds);

        const userIds = montadoresData?.map(m => m.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nome, documento, telefone')
          .in('user_id', userIds);

        // Combinar dados
        const saquesCompletos = saquesData.map(saque => ({
          ...saque,
          montadores: {
            user_id: montadoresData?.find(m => m.id === saque.montador_id)?.user_id || '',
            profiles: profilesData?.find(p => 
              p.user_id === montadoresData?.find(m => m.id === saque.montador_id)?.user_id
            )
          }
        }));

        console.log('📋 Saques carregados:', saquesCompletos);
        setSaques(saquesCompletos as any);
      } else {
        setSaques([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar saques:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os saques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    if (!actionDialog.saqueId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('aprovar_saque', {
        p_saque_id: actionDialog.saqueId,
        p_admin_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Saque aprovado!',
        description: 'O montador foi notificado sobre a aprovação.',
      });

      setActionDialog({ open: false, type: null, saqueId: null, valor: 0 });
      loadSaques();
    } catch (error: any) {
      console.error('Erro ao aprovar saque:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível aprovar o saque',
        variant: 'destructive',
      });
    }
  };

  const handleRecusar = async () => {
    if (!actionDialog.saqueId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase.rpc('recusar_saque', {
        p_saque_id: actionDialog.saqueId,
        p_admin_user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Saque recusado',
        description: 'O valor foi devolvido para o montador.',
      });

      setActionDialog({ open: false, type: null, saqueId: null, valor: 0 });
      loadSaques();
    } catch (error: any) {
      console.error('Erro ao recusar saque:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível recusar o saque',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'solicitado':
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" /> Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Recusado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const calcularResumo = () => {
    const pendentes = saques.filter(s => s.status === 'solicitado').length;
    const valorPendente = saques
      .filter(s => s.status === 'solicitado')
      .reduce((acc, s) => acc + s.valor, 0);
    const aprovados = saques.filter(s => s.status === 'aprovado').length;
    const valorAprovado = saques
      .filter(s => s.status === 'aprovado')
      .reduce((acc, s) => acc + s.valor, 0);

    return { pendentes, valorPendente, aprovados, valorAprovado };
  };

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
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold text-warning">{resumo.pendentes}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(resumo.valorPendente)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saques Aprovados</p>
                <p className="text-2xl font-bold text-success">{resumo.aprovados}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(resumo.valorAprovado)}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Saques</p>
                <p className="text-2xl font-bold">{saques.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(resumo.valorPendente + resumo.valorAprovado)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Saques */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Saque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Montador</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {saques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma solicitação de saque encontrada
                  </TableCell>
                </TableRow>
              ) : (
                saques.map((saque) => (
                  <TableRow key={saque.id}>
                    <TableCell className="text-sm">
                      {new Date(saque.created_at).toLocaleDateString('pt-BR')}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {new Date(saque.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{saque.montadores?.profiles?.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {saque.montadores?.profiles?.telefone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {saque.chave_pix || 'Não informada'}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(saque.valor)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(saque.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {saque.status === 'solicitado' ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'aprovar',
                                saqueId: saque.id,
                                valor: saque.valor,
                              })
                            }
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: 'recusar',
                                saqueId: saque.id,
                                valor: saque.valor,
                              })
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Recusar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {saque.status === 'aprovado' ? 'Processado' : 'Recusado'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={actionDialog.open} onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, saqueId: null, valor: 0 })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'aprovar' ? 'Aprovar Saque' : 'Recusar Saque'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.type === 'aprovar' ? (
                <>
                  Você está prestes a aprovar um saque no valor de{' '}
                  <strong>{formatCurrency(actionDialog.valor)}</strong>.
                  <br />
                  <br />
                  O montador será notificado e o valor será marcado como sacado.
                  Confirme que o pagamento foi realizado antes de aprovar.
                </>
              ) : (
                <>
                  Você está prestes a recusar um saque no valor de{' '}
                  <strong>{formatCurrency(actionDialog.valor)}</strong>.
                  <br />
                  <br />
                  O valor será devolvido para a conta do montador.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionDialog.type === 'aprovar' ? handleAprovar : handleRecusar}
              className={actionDialog.type === 'aprovar' ? '' : 'bg-destructive hover:bg-destructive/90'}
            >
              {actionDialog.type === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Recusa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
