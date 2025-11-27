import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NivelBadge } from "@/components/ui/nivel-badge";
import { Star, MapPin, Clock, Users, ArrowLeft, CheckCircle, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useNegociacoes } from "@/hooks/useNegociacoes";
import { calcularDistanciaEntreCeps } from "@/lib/geoUtils";

interface Montador {
  id: string;
  user_id: string;
  avaliacao_media: number;
  projetos_realizados: number;
  especialidades: string[];
  preco_hora: number;
  foto_perfil_url?: string;
  score?: number;
  nivel_gamificacao?: string;
  is_premium?: boolean;
  distancia_km?: number;
  profiles: {
    nome: string;
    endereco?: any;
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
      const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", jobId).single();

      if (jobError) throw jobError;
      setJob(jobData);

      // Buscar montadores ativos
      const { data: montadoresData, error: montadoresError } = await supabase
        .from("montadores")
        .select(`
          id, user_id, avaliacao_media, projetos_realizados, especialidades, 
          preco_hora, foto_perfil_url, nivel_gamificacao, is_premium
        `)
        .eq("status", "ativo")
        .order("avaliacao_media", { ascending: false })
        .order("projetos_realizados", { ascending: false });

      if (montadoresError) {
        console.error("Erro ao buscar montadores:", montadoresError);
        throw montadoresError;
      }

      console.log("Montadores carregados:", montadoresData);

      // Buscar profiles dos montadores
      if (montadoresData && montadoresData.length > 0) {
        const userIds = montadoresData.map((m) => m.user_id);
        console.log("User IDs para buscar profiles:", userIds);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, nome, endereco")
          .in("user_id", userIds);

        if (profilesError) {
          console.error("Erro ao buscar profiles:", profilesError);
          throw profilesError;
        }

        console.log("Profiles carregados:", profilesData);

        // Combinar dados dos montadores com seus profiles e calcular distâncias
        // Usar Promise.allSettled para não falhar tudo se uma requisição falhar
        const montadoresPromises = montadoresData.map(async (montador) => {
          const profile = profilesData?.find((p) => p.user_id === montador.user_id);
          let distancia_km: number | undefined;

          // Calcular distância se ambos CEPs estiverem disponíveis
          const jobCep = (jobData.endereco as any)?.cep;
          const montadorCep = (profile?.endereco as any)?.cep;

          if (jobCep && montadorCep) {
            try {
              console.log(`📍 Calculando distância: Job CEP ${jobCep} <-> Montador CEP ${montadorCep} (${profile?.nome})`);
              distancia_km = await calcularDistanciaEntreCeps(jobCep, montadorCep);
              console.log(`📏 Distância calculada para ${profile?.nome}: ${distancia_km}km`);
            } catch (error) {
              console.error(`❌ Erro ao calcular distância para ${profile?.nome}:`, error);
              distancia_km = undefined; // Falha silenciosa
            }
          } else {
            console.warn(`⚠️ CEPs faltando - Job: ${jobCep}, Montador ${profile?.nome}: ${montadorCep}`);
          }

          return {
            ...montador,
            profiles: profile || { nome: "Montador" },
            distancia_km,
          };
        });

        const montadoresResults = await Promise.allSettled(montadoresPromises);
        
        // Filtrar apenas resultados bem-sucedidos
        const montadoresWithProfiles = montadoresResults
          .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
          .map(result => result.value);

        console.log(`✅ ${montadoresWithProfiles.length}/${montadoresData.length} montadores processados com sucesso`);

        // Filtrar montadores dentro do raio de 20km
        // IMPORTANTE: Se a distância não puder ser calculada, NÃO exibir o montador
        const montadoresDentroRaio = montadoresWithProfiles.filter(
          (m) => m.distancia_km !== undefined && m.distancia_km <= 20
        );

        console.log(`📍 Total de montadores: ${montadoresWithProfiles.length}`);
        console.log(`✅ Montadores dentro de 20km: ${montadoresDentroRaio.length}`);

        // 🎯 Sistema de Scoring Inteligente
        const calculateMontadorScore = (montador: any, jobCategoria: string) => {
          let score = 0;
          
          // 1. ESPECIALIDADE (peso 40) - match com a categoria do job
          if (montador.especialidades && jobCategoria) {
            const jobCat = jobCategoria.toLowerCase();
            const hasExactMatch = montador.especialidades.some((esp: string) => {
              const especialidade = esp.toLowerCase();
              return (
                especialidade.includes(jobCat) ||
                jobCat.includes(especialidade) ||
                especialidade === jobCat
              );
            });
            
            if (hasExactMatch) {
              score += 40; // Match exato com especialidade
            } else if (montador.especialidades.length > 0) {
              score += 10; // Tem especialidades mas não match exato
            }
          }
          
          // 2. AVALIAÇÃO (peso 30) - montadores bem avaliados
          const avaliacaoNormalizada = (montador.avaliacao_media / 5) * 30;
          score += avaliacaoNormalizada;
          
          // 3. EXPERIÊNCIA (peso 20) - projetos realizados
          const experienciaNormalizada = Math.min(montador.projetos_realizados / 10, 1) * 20;
          score += experienciaNormalizada;
          
          // 4. FATOR ALEATORIEDADE (peso 10) - dar chance a novos montadores
          const randomBonus = Math.random() * 10;
          score += randomBonus;
          
          // 5. BONUS para montadores novos (incentivo)
          if (montador.projetos_realizados === 0) {
            score += 5; // Pequeno boost para dar oportunidade
          }
          
          return score;
        };

        // Calcular score para cada montador (somente os dentro do raio)
        const montadoresComScore = montadoresDentroRaio.map((montador) => {
          let score = calculateMontadorScore(montador, jobData.categoria || '');
          
          // Bonus por proximidade (peso adicional de até 15 pontos)
          if (montador.distancia_km !== undefined) {
            const bonusProximidade = Math.max(0, 15 - montador.distancia_km);
            score += bonusProximidade;
          }
          
          return {
            ...montador,
            score,
          };
        });

        // Ordenar por distância primeiro, depois por score
        const montadoresSorted = montadoresComScore.sort((a, b) => {
          // Priorizar montadores com distância conhecida
          if (a.distancia_km !== undefined && b.distancia_km === undefined) return -1;
          if (a.distancia_km === undefined && b.distancia_km !== undefined) return 1;
          
          // Se ambos têm distância, ordenar por distância
          if (a.distancia_km !== undefined && b.distancia_km !== undefined) {
            if (a.distancia_km !== b.distancia_km) {
              return a.distancia_km - b.distancia_km;
            }
          }
          
          // Caso contrário, ordenar por score
          return b.score - a.score;
        });

        // Pegar os TOP 5 montadores (não apenas 3!)
        const topMontadores = montadoresSorted.slice(0, 5);

        console.log('🎯 Montadores com score:', topMontadores.map(m => ({
          nome: m.profiles?.nome,
          score: m.score.toFixed(2),
          especialidades: m.especialidades,
          avaliacao: m.avaliacao_media,
          projetos: m.projetos_realizados
        })));

        setMontadores(topMontadores);
      } else {
        setMontadores([]);
      }
    } catch (error: any) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHireMontador = async (montadorId: string) => {
    if (!job || !clienteProfile) return;

    setLoadingHire(montadorId);
    try {
      console.log("Iniciando contratação:", { jobId: job.id, montadorId, clienteId: clienteProfile.id });

      // Verificar se já existe uma negociação ATIVA com ESTE montador
      const { data: existingNegociacao, error: checkError } = await supabase
        .from("negociacoes")
        .select("id, status")
        .eq("job_id", job.id)
        .eq("montador_id", montadorId)
        .neq("status", "recusado") // Ignorar negociações recusadas
        .maybeSingle();

      if (checkError) {
        console.error("Erro ao verificar negociação existente:", checkError);
        throw checkError;
      }

      if (existingNegociacao) {
        console.log("Negociação ativa já existe com este montador, redirecionando...");
        navigate(`/cliente/negociacao/${job.id}`);
        return;
      }

      // Criar negociação usando o hook
      const negociacao = await criarNegociacao(job.id, montadorId, clienteProfile.id);

      if (!negociacao) {
        throw new Error("Falha ao criar negociação");
      }

      // Atualizar job para "em_negociacao"
      const { error: jobError } = await supabase
        .from("jobs")
        .update({
          status: "em_negociacao",
          montador_id: montadorId,
        })
        .eq("id", job.id);

      if (jobError) {
        console.error("Erro ao atualizar job:", jobError);
        throw jobError;
      }

      toast({
        title: "Negociação iniciada!",
        description: "Você será redirecionado para a central de negociação.",
      });

      // Aguardar mais tempo antes de navegar
      setTimeout(() => {
        navigate(`/cliente/negociacao/${job.id}`, { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error("Erro completo na contratação:", error);
      toast({
        title: "Erro ao iniciar negociação",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setLoadingHire(null);
    }
  };

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPeriodo = (periodo: string) => {
    return periodo === "manha" ? "Manhã (08h-12h)" : "Tarde (13h-18h)";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary mx-auto"></div>
            <Navigation className="w-6 h-6 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Buscando os melhores montadores para você
          </h2>
          <p className="text-muted-foreground text-sm">
            Analisando distância, experiência e especialidades...
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Pedido não encontrado</p>
          <Link to="/cliente" className="text-destructive hover:text-destructive/80 mt-4 inline-block">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          to="/cliente"
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
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
            <h1 className="text-3xl font-bold text-black mb-2">Pedido criado com sucesso!</h1>
            <p className="text-black/80 mb-6">
              Montadores próximos foram notificados. Aqui estão os montadores mais qualificados para seu projeto:
            </p>
          </div>

          {/* Job Summary */}
          <Card className="shadow-glow border-0 mb-8 bg-white">
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
            {montadores.length === 0 ? (
              <>
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4 animate-scale-in">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-black">
                    Seu trabalho foi publicado!
                  </h2>
                </div>
                <Card className="shadow-glow border-0 bg-white text-center p-8">
                  <CardContent>
                    <p className="text-lg text-foreground mb-4">
                      Os montadores têm até <strong>40 minutos</strong> para enviar orçamento.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Se não ocorrer, nosso time vai cuidar pra você. Você será notificado assim que houver candidaturas.
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-black text-center mb-6">Montadores Recomendados</h2>
              </>
            )}

            {montadores.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {montadores.map((montador) => (
                  <Card key={montador.id} className="shadow-glow border-0 bg-white relative">
                    {/* Badge de Nível no canto superior direito */}
                    <div className="absolute top-4 right-4 z-10">
                      <NivelBadge 
                        nivel={montador.nivel_gamificacao || 'Bronze'} 
                        isPremium={montador.is_premium || false}
                      />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        {/* Avatar */}
                        <Avatar className="w-20 h-20">
                          <AvatarImage
                            src={montador.foto_perfil_url || ""}
                            alt={`Foto de ${montador.profiles?.nome || "Montador"}`}
                          />
                          <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                            {getInitials(montador.profiles?.nome || "MT")}
                          </AvatarFallback>
                        </Avatar>

                        {/* Nome */}
                        <h3 className="text-lg font-bold text-foreground">{montador.profiles?.nome || "Montador"}</h3>

                        {/* Stats em coluna */}
                        <div className="w-full space-y-2">
                          {montador.distancia_km !== undefined && (
                            <div className="flex items-center justify-center gap-1 text-sm bg-primary/10 py-1 px-3 rounded-full">
                              <Navigation className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-primary">
                                {montador.distancia_km < 1 ? "≈ 1 km" : `${montador.distancia_km.toFixed(1)} km`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-foreground">{montador.avaliacao_media.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{montador.projetos_realizados} projetos</span>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-semibold text-primary">
                              R$ {montador.preco_hora?.toFixed(2) || "50,00"}/hora
                            </span>
                          </div>
                        </div>

                        {/* Especialidades */}
                        {montador.especialidades && montador.especialidades.length > 0 && (
                          <div className="w-full">
                            <p className="text-xs font-medium mb-2 text-muted-foreground">Especialidades:</p>
                            <div className="flex overflow-x-auto gap-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                              {montador.especialidades.map((especialidade, index) => (
                                <Badge key={index} variant="secondary" className="text-xs whitespace-nowrap flex-shrink-0">
                                  {especialidade}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Match Score Visual */}
                        {montador.score && (
                          <div className="w-full bg-primary/10 border border-primary/20 rounded-lg p-3">
                            <p className="text-xs text-center">
                              <strong className="text-primary">Match: {Math.round((montador.score / 100) * 100)}%</strong>
                              <span className="block text-muted-foreground mt-1">
                                {montador.score >= 60 ? '🎯 Altamente recomendado' : 
                                 montador.score >= 40 ? '✓ Boa opção' : 
                                 '⭐ Novo na plataforma'}
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Nota para novos */}
                        {montador.projetos_realizados === 0 && (
                          <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground">
                              <strong className="text-foreground">Nota:</strong> Novo na plataforma, mas verificado e qualificado. Perfeito para começar com projetos simples!
                            </p>
                          </div>
                        )}

                        {/* Botão */}
                        <Button
                          onClick={() => handleHireMontador(montador.id)}
                          disabled={loadingHire === montador.id}
                          className="w-full bg-gradient-primary hover:shadow-glow"
                        >
                          {loadingHire === montador.id ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Contratando...
                            </div>
                          ) : (
                            "Iniciar Negociação"
                          )}
                        </Button>
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
