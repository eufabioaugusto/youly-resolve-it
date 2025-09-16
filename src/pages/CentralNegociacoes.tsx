import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useNegociacoes } from "@/hooks/useNegociacoes";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Wrench
} from "lucide-react";
import { useState, useEffect } from "react";

const CentralNegociacoes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, clienteProfile } = useProfile();
  const { negociacoes, loading, refetch, responderOrcamento } = useNegociacoes();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (clienteProfile) {
      refetch();
    }
  }, [clienteProfile, refetch]);

  const handleAceitarOrcamento = async (negociacaoId: string) => {
    setActionLoading(negociacaoId);
    try {
      await responderOrcamento(negociacaoId, 'aceito');
      toast({
        title: "Orçamento aceito!",
        description: "O montador foi notificado e o trabalho será iniciado."
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao aceitar orçamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecusarOrcamento = async (negociacaoId: string) => {
    setActionLoading(negociacaoId);
    try {
      await responderOrcamento(negociacaoId, 'recusado');
      toast({
        title: "Orçamento recusado",
        description: "O montador foi notificado sobre sua decisão."
      });
      refetch();
    } catch (error) {
      toast({
        title: "Erro ao recusar orçamento",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <Badge variant="outline">Aguardando orçamento</Badge>;
      case "orcamento_enviado":
        return <Badge className="bg-warning text-warning-foreground">Orçamento recebido</Badge>;
      case "aceito":
        return <Badge className="bg-success text-success-foreground">Aceito</Badge>;
      case "recusado":
        return <Badge variant="destructive">Recusado</Badge>;
      case "contra_proposta":
        return <Badge className="bg-info text-info-foreground">Contra-proposta</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Carregando negociações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">YOULY</span>
          </Link>
          
          <Link 
            to="/cliente" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Central de Negociações</h1>
          <p className="text-muted-foreground">Acompanhe e gerencie suas negociações com montadores</p>
        </div>

        {/* Negociações */}
        <div className="space-y-6">
          {negociacoes.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma negociação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não possui negociações ativas. Crie um novo pedido para começar.
                </p>
                <Link to="/criar-pedido">
                  <Button className="bg-gradient-primary">Criar Novo Pedido</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            negociacoes.map((negociacao) => (
              <Card key={negociacao.id} className="shadow-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl mb-2">
                        {negociacao.jobs?.descricao || 'Trabalho'}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {negociacao.jobs?.endereco?.cidade || 'Local não informado'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(negociacao.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {negociacao.montadores?.profiles?.nome || 'Montador'}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(negociacao.status)}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Informações do montador */}
                  {negociacao.montadores && (
                    <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Montador</h4>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {negociacao.montadores.profiles?.nome || 'Nome não informado'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="text-sm">
                            {negociacao.montadores.avaliacao_media?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {negociacao.montadores.projetos_realizados || 0} projetos realizados
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Valores propostos */}
                  {negociacao.status !== 'pendente' && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {negociacao.valor_proposto_montador && (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm font-medium mb-1">Proposta do Montador</p>
                            <p className="text-xl font-bold text-success">
                              R$ {negociacao.valor_proposto_montador.toFixed(2)}
                            </p>
                            {negociacao.observacoes_montador && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {negociacao.observacoes_montador}
                              </p>
                            )}
                          </div>
                        )}

                        {negociacao.valor_proposto_cliente && (
                          <div className="p-3 border rounded-lg">
                            <p className="text-sm font-medium mb-1">Sua Contra-proposta</p>
                            <p className="text-xl font-bold text-info">
                              R$ {negociacao.valor_proposto_cliente.toFixed(2)}
                            </p>
                            {negociacao.observacoes_cliente && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {negociacao.observacoes_cliente}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  {/* Actions */}
                  <div className="flex gap-3">
                    {negociacao.status === 'orcamento_enviado' && (
                      <>
                        <Button 
                          onClick={() => handleAceitarOrcamento(negociacao.id)}
                          disabled={actionLoading === negociacao.id}
                          className="bg-gradient-primary hover:shadow-glow"
                        >
                          {actionLoading === negociacao.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Aceitando...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Aceitar Orçamento
                            </div>
                          )}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleRecusarOrcamento(negociacao.id)}
                          disabled={actionLoading === negociacao.id}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Recusar
                        </Button>
                        <Button 
                          variant="secondary"
                          onClick={() => navigate(`/cliente/negociacao/${negociacao.job_id}`)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contra-proposta
                        </Button>
                      </>
                    )}

                    {negociacao.status === 'pendente' && (
                      <div className="text-muted-foreground">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Aguardando o montador enviar o orçamento
                      </div>
                    )}

                    {(negociacao.status === 'aceito' || negociacao.status === 'recusado') && (
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/cliente/negociacao/${negociacao.job_id}`)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CentralNegociacoes;