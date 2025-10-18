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

  useEffect(() => {
    if (montadorProfile) {
      fetchJobs();
      fetchCandidaturas();
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Erro ao buscar jobs:', error);
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
    if (!montadorProfile) return;

    try {
      const { data, error } = await supabase
        .from('candidaturas')
        .select('job_id')
        .eq('montador_id', montadorProfile.id);

      if (error) throw error;
      
      const jobIds = data?.map(c => c.job_id) || [];
      console.log('Candidaturas carregadas:', jobIds);
      setCandidaturas(jobIds);
    } catch (error) {
      console.error('Erro ao buscar candidaturas:', error);
    }
  };

  const openCandidateModal = (job: Job) => {
    setSelectedJob(job);
    setCandidateModalOpen(true);
  };

  const handleCandidaturaSuccess = async () => {
    if (selectedJob) {
      console.log('Adicionando job às candidaturas:', selectedJob.id);
      // Atualizar estado local imediatamente
      setCandidaturas(prev => {
        const updated = [...prev, selectedJob.id];
        console.log('Candidaturas atualizadas:', updated);
        return updated;
      });
    }
    // Refresh candidaturas do servidor para garantir sincronização
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Carregando disponíveis...</div>
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
                        onClick={() => openCandidateModal(job)}
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