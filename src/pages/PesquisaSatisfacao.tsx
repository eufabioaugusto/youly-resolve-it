import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';

const aspectosPositivosOpcoes = [
  'Pontualidade',
  'Profissionalismo',
  'Qualidade da montagem',
  'Limpeza',
  'Simpatia',
  'Rapidez',
];

const aspectosNegativosOpcoes = [
  'Atraso',
  'Falta de profissionalismo',
  'Montagem mal feita',
  'Deixou sujeira',
  'Mal educado',
  'Muito lento',
];

export default function PesquisaSatisfacao() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { criarAvaliacao, loading } = useAvaliacoes();

  const [ordemServico, setOrdemServico] = useState<any>(null);
  const [loadingOS, setLoadingOS] = useState(true);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');
  const [aspectosPositivos, setAspectosPositivos] = useState<string[]>([]);
  const [aspectosNegativos, setAspectosNegativos] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrdemServico();
    }
  }, [token]);

  const loadOrdemServico = async () => {
    console.log('🚀 [PesquisaSatisfacao] Carregando OS com token', token);
    setLoadingOS(true);

    try {
      // Token é o ID da ordem de serviço (simplificado por ora)
      const { data, error } = await supabase
        .from('ordem_servico')
        .select(`
          *,
          jobs (*),
          montadores (*, profiles:user_id(*)),
          clientes (*, profiles:user_id(*))
        `)
        .eq('id', token)
        .single();

      if (error) throw error;

      // Verificar se já existe avaliação
      const { data: avaliacaoExistente } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('ordem_servico_id', token)
        .maybeSingle();

      if (avaliacaoExistente) {
        setEnviado(true);
      }

      console.log('✅ [PesquisaSatisfacao] OS carregada', data);
      setOrdemServico(data);
    } catch (error) {
      console.error('❌ [PesquisaSatisfacao] Erro ao carregar OS', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da pesquisa',
        variant: 'destructive',
      });
    } finally {
      setLoadingOS(false);
    }
  };

  const handleToggleAspecto = (tipo: 'positivo' | 'negativo', aspecto: string) => {
    if (tipo === 'positivo') {
      setAspectosPositivos((prev) =>
        prev.includes(aspecto) ? prev.filter((a) => a !== aspecto) : [...prev, aspecto]
      );
    } else {
      setAspectosNegativos((prev) =>
        prev.includes(aspecto) ? prev.filter((a) => a !== aspecto) : [...prev, aspecto]
      );
    }
  };

  const handleEnviarAvaliacao = async () => {
    if (nota === 0) {
      toast({
        title: 'Atenção',
        description: 'Por favor, selecione uma nota',
        variant: 'destructive',
      });
      return;
    }

    console.log('🚀 [PesquisaSatisfacao] Enviando avaliação', {
      nota,
      comentario,
      aspectosPositivos,
      aspectosNegativos,
    });

    try {
      await criarAvaliacao({
        ordemServicoId: ordemServico.id,
        jobId: ordemServico.job_id,
        clienteId: ordemServico.cliente_id,
        montadorId: ordemServico.montador_id,
        nota,
        comentario,
        aspectosPositivos,
        aspectosNegativos,
      });

      setEnviado(true);
      toast({
        title: 'Obrigado!',
        description: 'Sua avaliação foi enviada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a avaliação',
        variant: 'destructive',
      });
    }
  };

  if (loadingOS) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ordemServico) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Pesquisa não encontrada ou inválida</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Avaliação enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Obrigado por avaliar o serviço. Sua opinião é muito importante para nós!
            </p>
            <Button onClick={() => navigate('/')}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pesquisa de Satisfação</CardTitle>
            <CardDescription>
              Avalie o serviço prestado por {ordemServico.montadores?.profiles?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do Serviço */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Serviço</p>
              <p className="font-medium">{ordemServico.jobs?.descricao}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Concluído em: {new Date(ordemServico.data_hora_conclusao).toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Seleção de Nota */}
            <div>
              <label className="text-sm font-medium mb-3 block">
                Como você avalia o serviço? *
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <button
                    key={estrela}
                    onClick={() => setNota(estrela)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-12 h-12 ${
                        estrela <= nota
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {nota > 0 && (
                <p className="text-center mt-2 text-sm font-medium">
                  {nota === 5 && '🤩 Excelente!'}
                  {nota === 4 && '😊 Muito bom!'}
                  {nota === 3 && '😐 Bom'}
                  {nota === 2 && '😕 Ruim'}
                  {nota === 1 && '😞 Muito ruim'}
                </p>
              )}
            </div>

            {/* Aspectos Positivos */}
            <div>
              <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-success" />
                O que você mais gostou?
              </label>
              <div className="flex flex-wrap gap-2">
                {aspectosPositivosOpcoes.map((aspecto) => (
                  <Badge
                    key={aspecto}
                    variant={aspectosPositivos.includes(aspecto) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleToggleAspecto('positivo', aspecto)}
                  >
                    {aspecto}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Aspectos Negativos */}
            {nota < 5 && (
              <div>
                <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-destructive" />
                  O que pode melhorar?
                </label>
                <div className="flex flex-wrap gap-2">
                  {aspectosNegativosOpcoes.map((aspecto) => (
                    <Badge
                      key={aspecto}
                      variant={aspectosNegativos.includes(aspecto) ? 'destructive' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleToggleAspecto('negativo', aspecto)}
                    >
                      {aspecto}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Comentário */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Deixe um comentário (opcional)
              </label>
              <Textarea
                placeholder="Conte-nos mais sobre sua experiência..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={4}
              />
            </div>

            {/* Botão Enviar */}
            <Button
              onClick={handleEnviarAvaliacao}
              disabled={loading || nota === 0}
              className="w-full bg-gradient-primary"
              size="lg"
            >
              {loading ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
