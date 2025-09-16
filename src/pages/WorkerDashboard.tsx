import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Calendar,
  User,
  Settings,
  LogOut,
  Eye,
  Clock as TimeClock,
  Wallet,
  TrendingUp,
  CheckCircle,
  Filter,
  AlertTriangle
} from "lucide-react";

const WorkerDashboard = () => {
  const { signOut } = useAuth();
  const { profile, montadorProfile, loading } = useProfile();
  const { isComplete: isProfileComplete } = useProfileCompletion();
  
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [carteira, setCarteira] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (montadorProfile) {
      fetchAvailableJobs();
      fetchMyJobs();
      fetchCarteira();
    }
  }, [montadorProfile]);

  const fetchAvailableJobs = async () => {
    if (!montadorProfile) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clientes!inner(
            id,
            user_id,
            avaliacao_media,
            pedidos_total,
            profiles!inner(nome)
          )
        `)
        .eq('status', 'aberto')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAvailableJobs(data || []);
    } catch (error) {
      console.error('Erro ao buscar trabalhos disponíveis:', error);
    }
  };

  const fetchMyJobs = async () => {
    if (!montadorProfile) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clientes!inner(
            id,
            user_id,
            avaliacao_media,
            pedidos_total,
            profiles!inner(nome)
          )
        `)
        .eq('montador_id', montadorProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMyJobs(data || []);
    } catch (error) {
      console.error('Erro ao buscar meus trabalhos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCarteira = async () => {
    if (!montadorProfile) return;

    try {
      const { data, error } = await supabase
        .from('carteira')
        .select('*')
        .eq('montador_id', montadorProfile.id)
        .single();

      if (error) throw error;
      setCarteira(data);
    } catch (error) {
      console.error('Erro ao buscar carteira:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Bem-vindo, {profile?.nome || 'Montador'}! 🔧
            </h1>
            <p className="text-muted-foreground mt-1">
              Encontre novos trabalhos ou acompanhe seus serviços.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/montador/perfil">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Minha Conta
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Incomplete Profile Alert */}
        {!isProfileComplete && (
          <Card className="mb-8 border-destructive bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-destructive mb-2">
                    Complete seu cadastro para receber trabalhos
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Preencha todos os seus dados para aparecer nas buscas dos clientes e receber propostas de trabalho.
                  </p>
                  <Link to="/montador/profile">
                    <Button variant="destructive" size="sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Cadastro
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saldo disponível</p>
                  <p className="text-2xl font-bold">
                    R$ {carteira?.saldo_disponivel?.toFixed(2) || '0,00'}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avaliação média</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.avaliacao_media?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Trabalhos realizados</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.projetos_realizados || 0}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Horas trabalhadas</p>
                  <p className="text-2xl font-bold">
                    {montadorProfile?.horas_trabalhadas || 0}h
                  </p>
                </div>
                <TimeClock className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Trabalhos Disponíveis</TabsTrigger>
            <TabsTrigger value="my-jobs">Meus Trabalhos</TabsTrigger>
            <TabsTrigger value="wallet">Carteira</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Trabalhos Disponíveis</CardTitle>
                <CardDescription>Encontre novos trabalhos na sua região</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando trabalhos...</p>
                  </div>
                ) : availableJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum trabalho disponível no momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.descricao}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {job.clientes?.profiles?.nome || 'Cliente'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.endereco?.bairro}, {job.endereco?.cidade}
                                </span>
                                {job.categoria && (
                                  <Badge variant="outline">{job.categoria}</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {job.valor_estimado && (
                                <p className="text-2xl font-bold text-green-600 mb-1">
                                  R$ {job.valor_estimado.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {new Date(job.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            <div className="flex gap-2">
                              <Link to={`/trabalho/${job.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver detalhes
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="my-jobs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Meus Trabalhos</CardTitle>
                <CardDescription>Acompanhe seus trabalhos aceitos e histórico</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando seus trabalhos...</p>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Você ainda não tem trabalhos.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Candidate-se aos trabalhos disponíveis para começar!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myJobs.map((job) => (
                      <Card key={job.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">{job.descricao}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {job.clientes?.profiles?.nome || 'Cliente'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.endereco?.bairro}, {job.endereco?.cidade}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(job.created_at).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              {job.valor_estimado && (
                                <p className="text-2xl font-bold text-green-600 mb-1">
                                  R$ {job.valor_estimado.toFixed(2)}
                                </p>
                              )}
                              <Badge variant={
                                job.status === 'em_andamento' ? 'default' :
                                job.status === 'concluido' ? 'secondary' : 'outline'
                              }>
                                {job.status === 'em_andamento' ? 'Em Andamento' : 
                                 job.status === 'concluido' ? 'Concluído' : 
                                 job.status === 'aberto' ? 'Aberto' : job.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Ver detalhes
                              </Button>
                              {job.status === 'em_andamento' && (
                                <Button size="sm">
                                  Finalizar trabalho
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wallet" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Carteira</CardTitle>
                <CardDescription>Gerencie seus ganhos e saques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wallet className="w-5 h-5" />
                          Disponível
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-green-600">
                          R$ {carteira?.saldo_disponivel?.toFixed(2) || '0,00'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Valor disponível para saque
                        </p>
                        <Button className="w-full mt-4" variant="outline">
                          Solicitar Saque
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Bloqueado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold text-yellow-600">
                          R$ {carteira?.saldo_bloqueado?.toFixed(2) || '0,00'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Valores em processamento
                        </p>
                        <Button className="w-full mt-4" variant="outline" disabled>
                          Aguardando...
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Total Sacado
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">
                          R$ {carteira?.total_sacado?.toFixed(2) || '0,00'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Total já sacado
                        </p>
                        <Button className="w-full mt-4" variant="outline">
                          Ver Histórico
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkerDashboard;