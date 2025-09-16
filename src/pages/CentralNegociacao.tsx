import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, DollarSign, MessageSquare, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useNegociacoes } from "@/hooks/useNegociacoes";
import { useProfile } from "@/hooks/useProfile";

const CentralNegociacao = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { negociacoes, loading, enviarOrcamento, responderOrcamento, aceitarContraproposta, recusarContraproposta } = useNegociacoes();
  const { profile } = useProfile();
  
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [valorContraproposta, setValorContraproposta] = useState('');
  const [observacoesCliente, setObservacoesCliente] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Encontrar a negociação para este job
  const negociacao = negociacoes.find(n => n.job_id === jobId);
  const isCliente = profile?.role === 'client';
  const isMontador = profile?.role === 'montador';

  useEffect(() => {
    if (!loading && !negociacao) {
      navigate(isCliente ? '/cliente' : '/montador');
    }
  }, [loading, negociacao, navigate, isCliente]);

  const handleEnviarOrcamento = async () => {
    if (!negociacao || !valorOrcamento) return;
    
    setLoadingAction('orcamento');
    const success = await enviarOrcamento(
      negociacao.id,
      parseFloat(valorOrcamento),
      observacoes
    );
    
    if (success) {
      setValorOrcamento('');
      setObservacoes('');
    }
    setLoadingAction(null);
  };

  const handleResposta = async (acao: 'aceito' | 'recusado' | 'contra_proposta') => {
    if (!negociacao) return;
    
    setLoadingAction(acao);
    let success = false;
    
    if (acao === 'contra_proposta') {
      success = await responderOrcamento(
        negociacao.id,
        acao,
        parseFloat(valorContraproposta),
        observacoesCliente
      );
      if (success) {
        setValorContraproposta('');
        setObservacoesCliente('');
      }
    } else {
      success = await responderOrcamento(negociacao.id, acao);
    }
    
    if (success && (acao === 'aceito' || acao === 'recusado')) {
      navigate('/cliente');
    }
    
    setLoadingAction(null);
  };

  const handleAcaoContraproposta = async (acao: 'aceitar' | 'recusar') => {
    if (!negociacao) return;
    
    setLoadingAction(acao);
    const success = acao === 'aceitar' 
      ? await aceitarContraproposta(negociacao.id)
      : await recusarContraproposta(negociacao.id);
    
    if (success) {
      navigate(isMontador ? '/montador' : '/cliente');
    }
    setLoadingAction(null);
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusInfo = (status: string) => {
    const statusMap = {
      'pendente': { 
        icon: AlertCircle, 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100', 
        text: 'Aguardando Orçamento' 
      },
      'orcamento_enviado': { 
        icon: DollarSign, 
        color: 'text-blue-600', 
        bg: 'bg-blue-100', 
        text: 'Orçamento Enviado' 
      },
      'contra_proposta': { 
        icon: MessageSquare, 
        color: 'text-purple-600', 
        bg: 'bg-purple-100', 
        text: 'Contra-proposta' 
      },
      'aceito': { 
        icon: CheckCircle, 
        color: 'text-green-600', 
        bg: 'bg-green-100', 
        text: 'Aceito' 
      },
      'recusado': { 
        icon: XCircle, 
        color: 'text-red-600', 
        bg: 'bg-red-100', 
        text: 'Recusado' 
      }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pendente;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando negociação...</p>
        </div>
      </div>
    );
  }

  if (!negociacao) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <p>Negociação não encontrada</p>
          <Link 
            to={isCliente ? "/cliente" : "/montador"} 
            className="text-white/80 hover:text-white mt-4 inline-block"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(negociacao.status);
  const StatusIcon = statusInfo.icon;

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
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 ${statusInfo.bg} rounded-full mb-4`}>
              <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Central de Negociação</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {statusInfo.text}
            </Badge>
          </div>

          {/* Job Details */}
          <Card className="shadow-glow border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Detalhes do Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{negociacao.jobs?.descricao}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Categoria:</strong> {negociacao.jobs?.categoria}
                  </div>
                  {negociacao.jobs?.valor_estimado && (
                    <div>
                      <strong>Valor estimado:</strong> R$ {negociacao.jobs.valor_estimado.toFixed(2)}
                    </div>
                  )}
                  <div>
                    <strong>Endereço:</strong> {negociacao.jobs?.endereco?.bairro}, {negociacao.jobs?.endereco?.cidade}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card className="shadow-glow border-0 mb-8">
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {getInitials(negociacao.clientes?.profiles?.nome || 'Cliente')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{negociacao.clientes?.profiles?.nome || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-8 h-px bg-border"></div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-secondary text-white">
                      {getInitials(negociacao.montadores?.profiles?.nome || 'Montador')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{negociacao.montadores?.profiles?.nome || 'Montador'}</p>
                    <p className="text-sm text-muted-foreground">
                      Montador • R$ {negociacao.montadores?.preco_hora?.toFixed(2) || '50,00'}/hora
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área específica por status e usuário */}
          {negociacao.status === 'pendente' && isMontador && (
            <Card className="shadow-glow border-0 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Enviar Orçamento
                </CardTitle>
                <CardDescription>
                  Analise o trabalho e envie seu orçamento para o cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="valor">Valor Proposto (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    placeholder="0,00"
                    value={valorOrcamento}
                    onChange={(e) => setValorOrcamento(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="obs">Observações (opcional)</Label>
                  <Textarea
                    id="obs"
                    placeholder="Descreva detalhes do orçamento, prazo, materiais inclusos, etc."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleEnviarOrcamento}
                  disabled={!valorOrcamento || loadingAction === 'orcamento'}
                  className="w-full bg-gradient-primary hover:shadow-glow"
                >
                  {loadingAction === 'orcamento' ? 'Enviando...' : 'Enviar Orçamento'}
                </Button>
              </CardContent>
            </Card>
          )}

          {negociacao.status === 'orcamento_enviado' && isCliente && (
            <Card className="shadow-glow border-0 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Orçamento Recebido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Valor Proposto:</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {negociacao.valor_proposto_montador?.toFixed(2)}
                    </span>
                  </div>
                  {negociacao.observacoes_montador && (
                    <div>
                      <strong>Observações do montador:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {negociacao.observacoes_montador}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleResposta('aceito')}
                    disabled={loadingAction === 'aceito'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loadingAction === 'aceito' ? 'Processando...' : 'Aceitar'}
                  </Button>
                  <Button
                    onClick={() => handleResposta('recusado')}
                    disabled={loadingAction === 'recusado'}
                    variant="destructive"
                    className="flex-1"
                  >
                    {loadingAction === 'recusado' ? 'Processando...' : 'Recusar'}
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Fazer Contra-proposta</h4>
                  <div>
                    <Label htmlFor="contraproposta">Seu Valor (R$)</Label>
                    <Input
                      id="contraproposta"
                      type="number"
                      placeholder="0,00"
                      value={valorContraproposta}
                      onChange={(e) => setValorContraproposta(e.target.value)}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="obs-cliente">Observações (opcional)</Label>
                    <Textarea
                      id="obs-cliente"
                      placeholder="Explique sua contra-proposta..."
                      value={observacoesCliente}
                      onChange={(e) => setObservacoesCliente(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button
                    onClick={() => handleResposta('contra_proposta')}
                    disabled={!valorContraproposta || loadingAction === 'contra_proposta'}
                    variant="outline"
                    className="w-full"
                  >
                    {loadingAction === 'contra_proposta' ? 'Enviando...' : 'Enviar Contra-proposta'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {negociacao.status === 'contra_proposta' && isMontador && (
            <Card className="shadow-glow border-0 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Contra-proposta Recebida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Valor Proposto pelo Cliente:</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {negociacao.valor_proposto_cliente?.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <strong>Seu orçamento original:</strong> R$ {negociacao.valor_proposto_montador?.toFixed(2)}
                  </div>
                  {negociacao.observacoes_cliente && (
                    <div className="mt-2">
                      <strong>Observações do cliente:</strong>
                      <p className="text-sm text-muted-foreground mt-1">
                        {negociacao.observacoes_cliente}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAcaoContraproposta('aceitar')}
                    disabled={loadingAction === 'aceitar'}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loadingAction === 'aceitar' ? 'Processando...' : 'Aceitar Contra-proposta'}
                  </Button>
                  <Button
                    onClick={() => handleAcaoContraproposta('recusar')}
                    disabled={loadingAction === 'recusar'}
                    variant="destructive"
                    className="flex-1"
                  >
                    {loadingAction === 'recusar' ? 'Processando...' : 'Recusar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(negociacao.status === 'aceito' || negociacao.status === 'recusado') && (
            <Card className="shadow-glow border-0 mb-8">
              <CardContent className="text-center py-8">
                {negociacao.status === 'aceito' ? (
                  <div className="text-green-600">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Negociação Concluída!</h3>
                    <p>O trabalho foi confirmado e já está em andamento.</p>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <XCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Negociação Recusada</h3>
                    <p>O trabalho foi liberado para outros montadores.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentralNegociacao;