import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NivelBadge } from "@/components/ui/nivel-badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar, 
  DollarSign,
  Clock,
  CheckCircle,
  Award,
  Briefcase
} from "lucide-react";
import { useState, useEffect } from "react";

interface Candidatura {
  id: string;
  proposta?: number;
  observacoes?: string;
  status: string;
  created_at: string;
  montadores: {
    id: string;
    user_id: string;
    avaliacao_media: number;
    projetos_realizados: number;
    preco_hora?: number;
    especialidades?: string[];
    badges?: string[];
    foto_perfil_url?: string;
    nivel_gamificacao?: string;
    is_premium?: boolean;
    profiles?: any;
  };
}

interface Job {
  id: string;
  descricao: string;
  categoria: string;
  endereco: any;
  data_opcoes: any;
  valor_estimado?: number;
  status: string;
}

const JobCandidates = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clienteProfile } = useProfile();
  const [job, setJob] = useState<Job | null>(null);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [negotiatingWith, setNegotiatingWith] = useState<string | null>(null);

  useEffect(() => {
    if (jobId && clienteProfile) {
      fetchJobAndCandidates();
    }
  }, [jobId, clienteProfile]);

  const fetchJobAndCandidates = async () => {
    if (!jobId) return;

    try {
      // Buscar job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('cliente_id', clienteProfile?.id)
        .maybeSingle();

      if (jobError) throw jobError;
      setJob(jobData);

      // Buscar candidaturas
      const { data: candidaturasData, error: candidaturasError } = await supabase
        .from('candidaturas')
        .select(`
          *,
          montadores!inner(
            id,
            user_id,
            avaliacao_media,
            projetos_realizados,
            preco_hora,
            especialidades,
            badges,
            foto_perfil_url,
            nivel_gamificacao,
            is_premium
          )
        `)
        .eq('job_id', jobId)
        .order('created_at');

      if (candidaturasError) throw candidaturasError;

      // Buscar perfis dos montadores separadamente
      if (candidaturasData && candidaturasData.length > 0) {
        const userIds = candidaturasData.map(c => c.montadores.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        // Combinar dados
        candidaturasData.forEach((candidatura: any) => {
          candidatura.montadores.profiles = profiles?.find(p => p.user_id === candidatura.montadores.user_id) || { nome: 'Montador' };
        });
      }

      if (candidaturasError) throw candidaturasError;

      // Buscar perfis dos montadores separadamente
      if (candidaturasData && candidaturasData.length > 0) {
        const userIds = candidaturasData.map(c => c.montadores.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        // Combinar dados
        candidaturasData.forEach((candidatura: any) => {
          candidatura.montadores.profiles = profiles?.find(p => p.user_id === candidatura.montadores.user_id) || { nome: 'Montador' };
        });
      }

      setCandidaturas(candidaturasData || []);
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as candidaturas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCandidate = async (candidaturaId: string, montadorId: string, selectedDate: any) => {
    try {
      // Iniciar transação - aceitar candidatura e atualizar job
      const { error: candidaturaError } = await supabase
        .from('candidaturas')
        .update({ status: 'aceito' })
        .eq('id', candidaturaId);

      if (candidaturaError) throw candidaturaError;

      // Atualizar job com montador e data escolhida
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          montador_id: montadorId,
          status: 'em_andamento',
          data_opcoes: [selectedDate] // Manter apenas a data escolhida
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Rejeitar outras candidaturas
      const { error: rejectError } = await supabase
        .from('candidaturas')
        .update({ status: 'recusado' })
        .eq('job_id', jobId)
        .neq('id', candidaturaId);

      if (rejectError) throw rejectError;

      toast({
        title: "Candidatura aceita!",
        description: "O montador foi selecionado e notificado."
      });

      navigate('/cliente');
    } catch (error: any) {
      toast({
        title: "Erro ao aceitar candidatura",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStartNegotiation = async (montadorId: string) => {
    if (!job || !clienteProfile) return;
    
    setNegotiatingWith(montadorId);
    try {
      // Criar negociação
      const { error: negociacaoError } = await supabase
        .from('negociacoes')
        .insert({
          job_id: job.id,
          montador_id: montadorId,
          cliente_id: clienteProfile.id,
          status: 'pendente'
        });

      if (negociacaoError) throw negociacaoError;

      // Atualizar job status
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          status: 'em_negociacao',
          montador_id: montadorId
        })
        .eq('id', job.id);

      if (jobError) throw jobError;

      toast({
        title: "Negociação iniciada!",
        description: "Você será redirecionado para a central de negociação."
      });

      // Navegar para central de negociação
      navigate(`/cliente/negociacao/${job.id}`);

    } catch (error: any) {
      toast({
        title: "Erro ao iniciar negociação",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setNegotiatingWith(null);
    }
  };

  const formatPeriodo = (periodo: string) => {
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Carregando candidaturas...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Pedido não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/cliente" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos meus pedidos
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Informações do Job */}
          <Card className="mb-6 shadow-glow border-0 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-xl">{job.descricao}</CardTitle>
              <CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant="outline">{job.categoria}</Badge>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.endereco.cidade}, {job.endereco.estado}
                          </span>
                          {job.valor_estimado && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              R$ {job.valor_estimado.toFixed(2)}
                            </span>
                          )}
                        </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Suas opções de data:
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.data_opcoes.map((opcao, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidaturas */}
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                Candidaturas Recebidas ({candidaturas.length})
              </h2>
              <p className="text-white/80">Escolha o montador ideal para seu projeto</p>
            </div>

            {candidaturas.length === 0 ? (
              <Card className="shadow-glow border-0 bg-gray-50">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Ainda não há candidaturas para este pedido.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Os montadores serão notificados automaticamente sobre seu pedido.
                  </p>
                </CardContent>
              </Card>
            ) : (
              candidaturas.map((candidatura) => (
                <Card key={candidatura.id} className="shadow-glow border-0">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={candidatura.montadores.foto_perfil_url || ""} />
                          <AvatarFallback>
                            {((candidatura as any).montadores.profiles?.nome || 'M').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                              {(candidatura as any).montadores.profiles?.nome || 'Montador'}
                            </CardTitle>
                            <NivelBadge 
                              nivel={candidatura.montadores.nivel_gamificacao || 'Bronze'} 
                              isPremium={candidatura.montadores.is_premium || false}
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {candidatura.montadores.avaliacao_media.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span className="text-sm">
                                {candidatura.montadores.projetos_realizados} projetos
                              </span>
                            </div>
                            {candidatura.montadores.preco_hora && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-sm">
                                  R$ {candidatura.montadores.preco_hora}/hora
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={candidatura.status === 'aceito' ? 'default' : 'outline'}
                        className={candidatura.status === 'aceito' ? 'bg-green-500' : ''}
                      >
                        {candidatura.status === 'pendente' ? 'Aguardando' : 
                         candidatura.status === 'aceito' ? 'Aceita' : 'Rejeitada'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Especialidades */}
                    {candidatura.montadores.especialidades && candidatura.montadores.especialidades.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Especialidades:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidatura.montadores.especialidades.map((spec, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Badges */}
                    {candidatura.montadores.badges && candidatura.montadores.badges.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Conquistas:</p>
                        <div className="flex flex-wrap gap-2">
                          {candidatura.montadores.badges.map((badge, index) => (
                            <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Proposta e Observações */}
                    {(candidatura.proposta || candidatura.observacoes) && (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                        {candidatura.proposta && (
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Proposta:</span>
                            <span className="text-xl font-bold text-success">
                              R$ {candidatura.proposta.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {candidatura.observacoes && (
                          <div>
                            <p className="text-sm font-medium mb-1">Observações:</p>
                            <p className="text-sm text-muted-foreground">
                              {candidatura.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Data da candidatura */}
                    <p className="text-xs text-muted-foreground mb-4">
                      Candidatura enviada em {new Date(candidatura.created_at).toLocaleString('pt-BR')}
                    </p>

                    {/* Actions */}
                    {candidatura.status === 'pendente' && job.status === 'aberto' && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => handleStartNegotiation(candidatura.montadores.id)}
                            disabled={negotiatingWith === candidatura.montadores.id}
                            className="bg-gradient-primary hover:shadow-glow"
                          >
                            {negotiatingWith === candidatura.montadores.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Iniciando...
                              </div>
                            ) : (
                              "Iniciar Negociação"
                            )}
                          </Button>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-2">Ou aceitar candidatura escolhendo uma data:</p>
                          <div className="grid gap-2">
                            {(Array.isArray(job.data_opcoes) ? job.data_opcoes : []).map((opcao, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                className="justify-start h-auto p-3"
                                onClick={() => handleAcceptCandidate(candidatura.id, candidatura.montadores.id, opcao)}
                              >
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <div>
                                    <p className="font-medium">
                                      {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Aceitar candidatura para esta data
                                    </p>
                                  </div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCandidates;