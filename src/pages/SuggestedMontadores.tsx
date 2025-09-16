import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Clock, Users, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useNegociacoes } from "@/hooks/useNegociacoes";

interface Montador {
  id: string;
  user_id: string;
  avaliacao_media: number;
  projetos_realizados: number;
  especialidades: string[];
  preco_hora: number;
  profiles: {
    nome: string;
  } | null;
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

const SuggestedMontadores = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clienteProfile } = useProfile();
  const { criarNegociacao } = useNegociacoes();
  
  const [job, setJob] = useState<Job | null>(null);
  const [montadores, setMontadores] = useState<Montador[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHire, setLoadingHire] = useState<string | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJobAndMontadores();
    }
  }, [jobId]);

  const fetchJobAndMontadores = async () => {
    try {
      // Buscar o job criado
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Buscar montadores ativos que têm especialidades relacionadas ao job
      const { data: montadoresData, error: montadoresError } = await supabase
        .from('montadores')
        .select('id, user_id, avaliacao_media, projetos_realizados, especialidades, preco_hora')
        .eq('status', 'ativo')
        .order('avaliacao_media', { ascending: false })
        .order('projetos_realizados', { ascending: false });

      if (montadoresError) throw montadoresError;

      // Buscar profiles dos montadores
      if (montadoresData && montadoresData.length > 0) {
        const userIds = montadoresData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, nome')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combinar dados e filtrar por especialidades relacionadas ao job
        let montadoresWithProfiles = montadoresData.map(montador => {
          const profile = profilesData?.find(p => p.user_id === montador.user_id);
          return {
            ...montador,
            profiles: profile || { nome: 'Montador' }
          };
        });

        // Filtrar montadores que têm especialidades relacionadas ao job
        if (jobData.categoria) {
          montadoresWithProfiles = montadoresWithProfiles.filter(montador => {
            if (!montador.especialidades) return false;
            
            const jobCategoria = jobData.categoria.toLowerCase();
            return montador.especialidades.some(esp => {
              const especialidade = esp.toLowerCase();
              return especialidade.includes(jobCategoria) || 
                     jobCategoria.includes(especialidade) ||
                     (jobCategoria === 'mesa' && especialidade === 'mesa') ||
                     (jobCategoria === 'guarda-roupa' && especialidade === 'guarda-roupa') ||
                     (jobCategoria === 'cama' && especialidade === 'cama') ||
                     (jobCategoria === 'estante' && especialidade === 'estante');
            });
          });
        }

        // Se não há montadores com especialidades específicas, mostrar todos os ativos (máximo 3)
        if (montadoresWithProfiles.length === 0) {
          montadoresWithProfiles = montadoresData.map(montador => {
            const profile = profilesData?.find(p => p.user_id === montador.user_id);
            return {
              ...montador,
              profiles: profile || { nome: 'Montador' }
            };
          }).slice(0, 3);
        } else {
          // Pegar até 3 montadores especializados
          montadoresWithProfiles = montadoresWithProfiles.slice(0, 3);
        }
        setMontadores(montadoresWithProfiles);
      } else {
        setMontadores([]);
      }

    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHireMontador = async (montadorId: string) => {
    if (!job || !clienteProfile) return;
    
    setLoadingHire(montadorId);
    try {
      console.log('Iniciando contratação:', { jobId: job.id, montadorId, clienteId: clienteProfile.id });
      
      // Criar negociação usando o hook
      const negociacao = await criarNegociacao(job.id, montadorId, clienteProfile.id);
      
      if (!negociacao) {
        throw new Error('Falha ao criar negociação');
      }

      // Atualizar job para "em_negociacao"
      const { error: jobError } = await supabase
        .from('jobs')
        .update({ 
          status: 'em_negociacao',
          montador_id: montadorId
        })
        .eq('id', job.id);

      if (jobError) {
        console.error('Erro ao atualizar job:', jobError);
        throw jobError;
      }

      toast({
        title: "Negociação iniciada!",
        description: "Você será redirecionado para a central de negociação."
      });

      // Aguardar um pouco antes de navegar para garantir que os dados foram persistidos
      setTimeout(() => {
        navigate(`/cliente/negociacao/${job.id}`);
      }, 1000);

    } catch (error: any) {
      console.error('Erro completo na contratação:', error);
      toast({
        title: "Erro ao iniciar negociação",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setLoadingHire(null);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatPeriodo = (periodo: string) => {
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Buscando os melhores montadores para você...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <p>Pedido não encontrado</p>
          <Link to="/cliente" className="text-white/80 hover:text-white mt-4 inline-block">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/cliente" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Pedido criado com sucesso!</h1>
            <p className="text-white/80 mb-6">
              Montadores próximos foram notificados. Aqui estão 3 montadores recomendados para seu projeto:
            </p>
          </div>

          {/* Job Summary */}
          <Card className="shadow-glow border-0 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Resumo do seu pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{job.descricao}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Categoria:</strong> {job.categoria}
                  </div>
                  {job.valor_estimado && (
                    <div>
                      <strong>Valor estimado:</strong> R$ {job.valor_estimado.toFixed(2)}
                    </div>
                  )}
                  <div>
                    <strong>Endereço:</strong> {job.endereco?.bairro}, {job.endereco?.cidade}
                  </div>
                </div>
              </div>
              
              <div>
                <strong className="text-sm">Datas disponíveis:</strong>
                <div className="flex flex-wrap gap-2 mt-2">
                  {job.data_opcoes?.map((opcao: any, index: number) => (
                    <Badge key={index} variant="outline">
                      {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Montadores */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white text-center mb-6">
              Montadores Recomendados
            </h2>
            
            {montadores.length === 0 ? (
              <Card className="shadow-glow border-0 text-center p-8">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Ainda não há montadores disponíveis em sua região.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Seu pedido foi enviado e montadores poderão se candidatar através da plataforma.
                    Você será notificado assim que houver candidaturas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {montadores.map((montador) => (
                  <Card key={montador.id} className="shadow-glow border-0">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-primary text-white text-lg font-bold">
                            {getInitials(montador.profiles?.nome || 'MT')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-1">
                                {montador.profiles?.nome || 'Montador'}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span>{montador.avaliacao_media.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{montador.projetos_realizados} projetos</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-semibold text-primary">R$ {montador.preco_hora?.toFixed(2) || '50,00'}/hora</span>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => handleHireMontador(montador.id)}
                              disabled={loadingHire === montador.id}
                              className="bg-gradient-primary hover:shadow-glow"
                            >
                              {loadingHire === montador.id ? (
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Contratando...
                                </div>
                              ) : (
                                "Contratar Montador"
                              )}
                            </Button>
                          </div>
                          
                          {montador.especialidades && montador.especialidades.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium mb-2">Especialidades:</p>
                              <div className="flex flex-wrap gap-2">
                                {montador.especialidades.map((especialidade, index) => (
                                  <Badge key={index} variant="secondary">
                                    {especialidade}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {montador.projetos_realizados === 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm text-blue-800">
                                <strong>Montador Novato:</strong> Novo na plataforma, mas verificado e qualificado. 
                                Perfeito para começar com projetos simples!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-white/80 text-sm">
              Você também pode aguardar que outros montadores se candidatem ao seu pedido.
              <br />
              Acesse seu dashboard para acompanhar as candidaturas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestedMontadores;