import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Clock,
  Star,
  Search,
  Filter
} from "lucide-react";
import { useState, useEffect } from "react";
import CandidateModal from "@/components/CandidateModal";
import JobDetailsModal from "@/components/JobDetailsModal";

interface Job {
  id: string;
  descricao: string;
  categoria: string;
  endereco: any;
  data_opcoes: any;
  valor_estimado?: number;
  created_at: string;
  status: string;
  clientes: {
    avaliacao_media: number;
    pedidos_total: number;
    profiles: any;
  };
}

const AvailableJobs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { montadorProfile } = useProfile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidaturas, setCandidaturas] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [jobDetailsModalOpen, setJobDetailsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect montadorProfile mudou:', montadorProfile);
    if (montadorProfile) {
      console.log('✅ Montador profile disponível, iniciando buscas...');
      setLoading(true);
      setHasError(false);
      fetchJobs();
      fetchCandidaturas();

      // Configurar listener de realtime para candidaturas
      const channel = supabase
        .channel('candidaturas-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'candidaturas',
            filter: `montador_id=eq.${montadorProfile.id}`
          },
          (payload) => {
            console.log('🔔 Nova candidatura detectada via Realtime:', payload);
            fetchCandidaturas(); // Recarregar candidaturas do banco
          }
        )
        .subscribe();

      return () => {
        console.log('🧹 Limpando canal Realtime');
        supabase.removeChannel(channel);
      };
    }
  }, [montadorProfile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clientes!inner(
            avaliacao_media,
            pedidos_total,
            profiles!clientes_user_id_fkey(nome)
          )
        `)
        .eq('status', 'aberto')
        .not('id', 'in', `(SELECT job_id FROM timeout_montador WHERE expirado = true)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setHasError(false);
    } catch (error) {
      console.error('Erro ao buscar jobs:', error);
      setHasError(true);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos disponíveis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidaturas = async () => {
    if (!montadorProfile) {
      console.log('❌ fetchCandidaturas: montadorProfile não disponível');
      return;
    }

    try {
      console.log('🔍 INICIANDO BUSCA DE CANDIDATURAS');
      console.log('🆔 Montador Profile ID:', montadorProfile.id);
      console.log('👤 User ID do montador:', montadorProfile.user_id);
      
      const { data, error } = await supabase
        .from('candidaturas')
        .select('job_id, montador_id, status, proposta')
        .eq('montador_id', montadorProfile.id);

      console.log('📦 Resposta bruta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro na query de candidaturas:', error);
        throw error;
      }
      
      const jobIds = data?.map(c => c.job_id) || [];
      console.log('✅ Job IDs encontrados:', jobIds);
      console.log('📊 Total de candidaturas:', jobIds.length);
      console.log('🎯 Candidaturas completas:', data);
      
      setCandidaturas(jobIds);
      
      console.log('✔️ Estado atualizado com:', jobIds);
    } catch (error) {
      console.error('❌ Erro ao buscar candidaturas:', error);
    }
  };

  const openCandidateModal = (job: Job) => {
    setSelectedJob(job);
    setCandidateModalOpen(true);
  };

  const handleCandidaturaSuccess = async () => {
    console.log('Candidatura enviada com sucesso, buscando do banco...');
    // Buscar candidaturas diretamente do banco de dados
    await fetchCandidaturas();
  };

  const isJobAvailable = (job: Job) => {
    // Verificar se as datas estão pelo menos 48h no futuro
    const now = new Date();
    const minDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const dataOpcoes = Array.isArray(job.data_opcoes) ? job.data_opcoes : [];
    return dataOpcoes.some(opcao => {
      const dataOpcao = new Date(opcao.data);
      return dataOpcao >= minDate;
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || job.categoria === categoryFilter;
    
    return matchesSearch && matchesCategory && isJobAvailable(job);
  });

  const formatPeriodo = (periodo: string) => {
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Mostra loading enquanto carrega o profile OU durante o fetch
  if (loading || !montadorProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando trabalhos disponíveis...</p>
        </div>
      </div>
    );
  }

  // Mostra erro apenas se realmente houve um erro no fetch (não apenas profile carregando)
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
            <CardDescription>
              Não foi possível carregar os pedidos disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/montador" 
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Pedidos Disponíveis</h1>
            <p className="text-white/80">Encontre trabalhos que combinam com você</p>
          </div>

          {/* Filtros */}
          <Card className="mb-6 shadow-glow border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar pedidos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="guarda-roupa">Guarda-roupa</SelectItem>
                      <SelectItem value="cama">Cama</SelectItem>
                      <SelectItem value="mesa">Mesa de jantar</SelectItem>
                      <SelectItem value="estante">Estante</SelectItem>
                      <SelectItem value="rack">Rack/Painel TV</SelectItem>
                      <SelectItem value="outros">Outros móveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Jobs */}
          <div className="grid gap-6">
            {filteredJobs.length === 0 ? (
              <Card className="shadow-glow border-0 bg-white">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {jobs.length === 0 
                      ? "Nenhum pedido disponível no momento."
                      : "Nenhum pedido encontrado com os filtros aplicados."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} className="shadow-glow border-0">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{job.descricao}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.endereco.cidade}, {job.endereco.estado}
                          </div>
                          {job.valor_estimado && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              R$ {job.valor_estimado.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">{job.categoria}</Badge>
                        {candidaturas.includes(job.id) && (
                          <Badge variant="secondary">Candidatura enviada</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Informações do Cliente */}
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{job.clientes.profiles?.nome || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.clientes.pedidos_total} pedidos realizados
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {job.clientes.avaliacao_media.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Datas Disponíveis */}
                    <div className="mb-4">
                      <p className="font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Datas disponíveis:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(job.data_opcoes) ? job.data_opcoes : [])
                          .filter(opcao => new Date(opcao.data) >= new Date(Date.now() + 48 * 60 * 60 * 1000))
                          .map((opcao, index) => (
                            <Badge key={index} variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {job.endereco.rua}, {job.endereco.numero} - {job.endereco.bairro}
                      </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedJob(job);
                          setJobDetailsModalOpen(true);
                        }}
                        className="flex-1"
                      >
                        Ver detalhes
                      </Button>
                      <Button 
                        onClick={() => {
                          console.log('🖱️ Clique no botão do job:', job.id);
                          console.log('📋 Array de candidaturas atual:', candidaturas);
                          console.log('🔍 Job está na lista?', candidaturas.includes(job.id));
                          openCandidateModal(job);
                        }}
                        disabled={candidaturas.includes(job.id)}
                        className="flex-1 bg-gradient-primary hover:shadow-glow"
                      >
                        {candidaturas.includes(job.id) 
                          ? "Candidatura Enviada" 
                          : "Candidatar-se"
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Modal de Detalhes */}
          <JobDetailsModal
            job={selectedJob}
            open={jobDetailsModalOpen}
            onOpenChange={setJobDetailsModalOpen}
          />

          {/* Modal de Candidatura */}
          <CandidateModal
            job={selectedJob}
            open={candidateModalOpen}
            onOpenChange={setCandidateModalOpen}
            onSuccess={handleCandidaturaSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default AvailableJobs;