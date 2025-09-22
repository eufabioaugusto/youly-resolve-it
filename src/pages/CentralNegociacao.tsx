import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NivelBadge } from "@/components/ui/nivel-badge";
import { ArrowLeft, Clock, MapPin, DollarSign, MessageSquare, CheckCircle, XCircle, AlertCircle, Star, Send, History } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNegociacoes } from "@/hooks/useNegociacoes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PagamentoModal } from "@/components/PagamentoModal";

const CentralNegociacao = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, montadorProfile, clienteProfile } = useProfile();
  const { fetchNegociacao, enviarOrcamento, responderOrcamento } = useNegociacoes();
  
  const [negociacao, setNegociacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  
  // Form states
  const [valorProposta, setValorProposta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [valorContraproposta, setValorContraproposta] = useState('');
  const [observacoesContraproposta, setObservacoesContraproposta] = useState('');
  
  const isCliente = profile?.role === 'client';
  const isMontador = profile?.role === 'montador';

  useEffect(() => {
    if (jobId) {
      loadNegociacao();
    }
  }, [jobId]);

  // Escutar atualizações em tempo real
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`negociacao-realtime-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negociacoes',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          console.log('Negociação atualizada em tempo real:', payload);
          loadNegociacao();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Escutar atualizações em tempo real
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`negociacao-realtime-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'negociacoes',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          console.log('Negociação atualizada em tempo real:', payload);
          loadNegociacao();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const loadNegociacao = async (tentativa = 1) => {
    setLoading(true);
    try {
      console.log(`Tentativa ${tentativa} de carregar negociação para jobId:`, jobId);
      
      // Primeiro, verificar se existe uma negociação para este job
      const { data: negociacaoData, error: negociacaoError } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle();

      if (negociacaoError) {
        console.error('Erro ao buscar negociação básica:', negociacaoError);
        throw negociacaoError;
      }

      if (!negociacaoData) {
        if (tentativa < 3) {
          console.log(`Negociação não encontrada, tentando novamente em 2s...`);
          setTimeout(() => {
            loadNegociacao(tentativa + 1);
          }, 2000);
          return;
        } else {
          console.log('Negociação não encontrada após todas as tentativas');
          setNegociacao(null);
          setLoading(false);
          return;
        }
      }

      // Se a negociação existe, buscar com joins
      const data = await fetchNegociacao(jobId);
      
      if (!data && tentativa < 3) {
        console.log(`Dados completos não encontrados, tentando novamente em 2s...`);
        setTimeout(() => {
          loadNegociacao(tentativa + 1);
        }, 2000);
        return;
      }
      
      if (!data) {
        console.log('Dados completos não encontrados após todas as tentativas');
        setNegociacao(null);
      } else {
        console.log('Negociação carregada com sucesso:', data);
        setNegociacao(data);
        
        if (data?.valor_proposto_montador) {
          setValorContraproposta(data.valor_proposto_montador.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar negociação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a negociação",
        variant: "destructive"
      });
      setNegociacao(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarOrcamento = async () => {
    if (!valorProposta || !negociacao) return;
    
    setActionLoading(true);
    try {
      await enviarOrcamento(negociacao.id, parseFloat(valorProposta), observacoes);
      toast({
        title: "Orçamento enviado!",
        description: "O cliente foi notificado sobre seu orçamento."
      });
      await loadNegociacao();
      setValorProposta('');
      setObservacoes('');
    } catch (error) {
      toast({
        title: "Erro ao enviar orçamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResponderOrcamento = async (acao: 'aceito' | 'recusado' | 'contra_proposta') => {
    if (!negociacao) return;
    
    setActionLoading(true);
    try {
      const valorContra = acao === 'contra_proposta' ? parseFloat(valorContraproposta) : undefined;
      
      const result = await responderOrcamento(
        negociacao.id, 
        acao, 
        valorContra,
        observacoesContraproposta
      );
      
      const messages = {
        aceito: "Orçamento aceito! O trabalho foi confirmado.",
        recusado: "Orçamento recusado. O montador foi notificado.",
        contra_proposta: "Contra-proposta enviada. O montador foi notificado."
      };
      
      toast({
        title: "Sucesso!",
        description: messages[acao]
      });
      
      await loadNegociacao();
      setObservacoesContraproposta('');
      
      // Se aceito, abrir modal de pagamento
      if (acao === 'aceito' && result?.success) {
        setPagamentoModalOpen(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar sua resposta.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: "outline", text: "Aguardando orçamento" },
      orcamento_enviado: { variant: "default", text: "Orçamento recebido", className: "bg-warning text-warning-foreground" },
      aceito: { variant: "default", text: "Aceito", className: "bg-success text-success-foreground" },
      recusado: { variant: "destructive", text: "Recusado" },
      contra_proposta: { variant: "default", text: "Contra-proposta", className: "bg-info text-info-foreground" }
    };
    
    const config = statusConfig[status] || { variant: "secondary", text: status };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPeriodo = (periodo: string) => {
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-lg">Carregando negociação...</div>
      </div>
    );
  }

  if (!negociacao) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Negociação não encontrada</h3>
            <p className="text-white/80 mb-4">
              Esta negociação pode ter sido cancelada ou ainda está sendo processada.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => loadNegociacao(1)}
                variant="outline"
                className="mr-3"
              >
                Tentar novamente
              </Button>
              <Button
                onClick={() => navigate(isCliente ? "/cliente" : "/montador")}
                className="bg-gradient-primary"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to={isCliente ? "/cliente" : "/montador"}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Central de Negociação</h1>
            <p className="text-white/80 mb-4">
              Negocie diretamente {isCliente ? 'com o montador' : 'com o cliente'} sobre preço e detalhes do serviço
            </p>
            <div className="flex justify-center">
              {getStatusBadge(negociacao.status)}
            </div>
          </div>

          {/* Informações do Job */}
          <Card className="shadow-glow border-0 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Informações do Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{negociacao.jobs?.descricao}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{negociacao.jobs?.categoria}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {negociacao.jobs?.endereco?.cidade}, {negociacao.jobs?.endereco?.estado}
                    </div>
                    {negociacao.jobs?.valor_estimado && !negociacao.valor_proposto_montador && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Valor estimado: R$ {negociacao.jobs.valor_estimado.toFixed(2)}
                      </div>
                    )}
                    {negociacao.valor_proposto_montador && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Orçamento: R$ {negociacao.valor_proposto_montador.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Opções de Data:</h4>
                  <div className="space-y-1">
                    {negociacao.jobs?.data_opcoes?.map((opcao, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Clock className="w-3 h-3" />
                        {new Date(opcao.data).toLocaleDateString('pt-BR')} - {formatPeriodo(opcao.periodo)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Montador/Cliente */}
          <Card className="shadow-glow border-0 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isCliente ? "Montador" : "Cliente"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCliente && negociacao.montadores ? (
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={negociacao.montadores?.foto_perfil_url || ""} />
                    <AvatarFallback>
                      {(negociacao.montadores.profiles?.nome || 'M').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{negociacao.montadores.profiles?.nome}</h3>
                      <NivelBadge 
                        nivel={negociacao.montadores.nivel_gamificacao || 'Bronze'} 
                        isPremium={negociacao.montadores.is_premium || false}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{negociacao.montadores.avaliacao_media?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span>{negociacao.montadores.projetos_realizados || 0} projetos</span>
                      {negociacao.montadores.preco_hora && (
                        <span>R$ {negociacao.montadores.preco_hora}/hora</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : negociacao.clientes ? (
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback>
                      {(negociacao.clientes.profiles?.nome || 'C')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{negociacao.clientes.profiles?.nome}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{negociacao.clientes.avaliacao_media?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span>{negociacao.clientes.pedidos_total || 0} pedidos</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Histórico de Propostas */}
          {(negociacao.valor_proposto_montador || negociacao.valor_proposto_cliente) && (
            <Card className="shadow-glow border-0 mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Propostas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {negociacao.valor_proposto_montador && (
                    <div className="p-4 border border-success/20 bg-success/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Proposta do Montador</span>
                        <span className="text-xl font-bold text-success">
                          R$ {negociacao.valor_proposto_montador.toFixed(2)}
                        </span>
                      </div>
                      {negociacao.observacoes_montador && (
                        <p className="text-sm text-muted-foreground">
                          {negociacao.observacoes_montador}
                        </p>
                      )}
                    </div>
                  )}

                  {negociacao.valor_proposto_cliente && (
                    <div className="p-4 border border-info/20 bg-info/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Contra-proposta do Cliente</span>
                        <span className="text-xl font-bold text-info">
                          R$ {negociacao.valor_proposto_cliente.toFixed(2)}
                        </span>
                      </div>
                      {negociacao.observacoes_cliente && (
                        <p className="text-sm text-muted-foreground">
                          {negociacao.observacoes_cliente}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações - Montador */}
          {isMontador && negociacao.status === 'pendente' && (
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Enviar Orçamento
                </CardTitle>
                <CardDescription>
                  Envie sua proposta de valor para este trabalho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="valor">Valor da Proposta (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={valorProposta}
                      onChange={(e) => setValorProposta(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="obs">Observações (opcional)</Label>
                    <Textarea
                      id="obs"
                      placeholder="Detalhe sua proposta, prazo de execução, materiais inclusos, etc."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleEnviarOrcamento}
                    disabled={!valorProposta || actionLoading}
                    className="bg-gradient-primary hover:shadow-glow w-full"
                  >
                    {actionLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Enviar Orçamento
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações - Cliente */}
          {isCliente && negociacao.status === 'orcamento_enviado' && (
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle>Responder Orçamento</CardTitle>
                <CardDescription>
                  Avalie a proposta do montador e tome uma decisão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Botões de Ação Rápida */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleResponderOrcamento('aceito')}
                      disabled={actionLoading}
                      className="bg-gradient-primary hover:shadow-glow flex-1"
                    >
                      {actionLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aceitar Orçamento
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleResponderOrcamento('recusado')}
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Recusar
                    </Button>
                  </div>

                  <Separator />

                  {/* Contra-proposta */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Ou faça uma contra-proposta:</h4>
                    <div>
                      <Label htmlFor="contravalor">Novo Valor (R$)</Label>
                      <Input
                        id="contravalor"
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={valorContraproposta}
                        onChange={(e) => setValorContraproposta(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contraobs">Observações (opcional)</Label>
                      <Textarea
                        id="contraobs"
                        placeholder="Explique o motivo da contra-proposta..."
                        value={observacoesContraproposta}
                        onChange={(e) => setObservacoesContraproposta(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => handleResponderOrcamento('contra_proposta')}
                      disabled={!valorContraproposta || actionLoading}
                      variant="secondary"
                      className="w-full"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Contra-proposta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações - Montador responder contra-proposta */}
          {isMontador && negociacao.status === 'contra_proposta' && (
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle>Responder Contra-proposta</CardTitle>
                <CardDescription>
                  O cliente fez uma contra-proposta. O que você decide?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleResponderOrcamento('aceito')}
                    disabled={actionLoading}
                    className="bg-gradient-primary hover:shadow-glow flex-1"
                  >
                    {actionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aceitar Contra-proposta
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResponderOrcamento('recusado')}
                    disabled={actionLoading}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Recusar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Final */}
          {(negociacao.status === 'aceito' || negociacao.status === 'recusado') && (
            <Card className="shadow-glow border-0">
              <CardContent className="p-8 text-center">
                {negociacao.status === 'aceito' ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Negociação Finalizada!</h3>
                    <p className="text-muted-foreground mb-4">
                      O orçamento foi aceito e o trabalho está confirmado.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Negociação Encerrada</h3>
                    <p className="text-muted-foreground mb-4">
                      O orçamento foi recusado. A negociação foi finalizada.
                    </p>
                  </>
                )}
                <Button
                  onClick={() => navigate(isCliente ? "/cliente" : "/montador")}
                  className="bg-gradient-primary"
                >
                  Voltar ao Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Modal de Pagamento */}
        {negociacao && (
          <PagamentoModal
            open={pagamentoModalOpen}
            onOpenChange={setPagamentoModalOpen}
            jobId={negociacao.job_id || ''}
            montadorId={negociacao.montador_id || ''}
            valor={negociacao.valor_proposto_montador || negociacao.valor_proposto_cliente || 0}
            jobDescricao={negociacao.jobs?.descricao || ''}
            montadorNome={negociacao.montadores?.profiles?.nome || ''}
          />
        )}
      </div>
    </div>
  );
};

export default CentralNegociacao;