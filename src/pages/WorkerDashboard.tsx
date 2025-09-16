import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  Star, 
  MapPin, 
  Calendar,
  DollarSign,
  User,
  Bell,
  LogOut,
  Eye,
  Clock,
  Wallet,
  TrendingUp,
  CheckCircle,
  Filter
} from "lucide-react";

const WorkerDashboard = () => {
  // Mock data
  const availableJobs = [
    {
      id: "1",
      title: "Montagem de Guarda-roupa 6 portas",
      client: "Maria Silva",
      location: "Vila Madalena - SP",
      distance: "2.5 km",
      estimatedHours: 4,
      suggestedPrice: 200,
      urgency: "high",
      postedAt: "2 horas atrás"
    },
    {
      id: "2", 
      title: "Mesa de jantar + 6 cadeiras",
      client: "João Santos",
      location: "Pinheiros - SP",
      distance: "5.1 km",
      estimatedHours: 3,
      suggestedPrice: 150,
      urgency: "medium",
      postedAt: "4 horas atrás"
    },
    {
      id: "3",
      title: "Cama box + cabeceira",
      client: "Ana Costa",
      location: "Jardins - SP", 
      distance: "1.8 km",
      estimatedHours: 2,
      suggestedPrice: 100,
      urgency: "low",
      postedAt: "6 horas atrás"
    }
  ];

  const myJobs = [
    {
      id: "1",
      title: "Rack para TV 65 polegadas",
      client: "Carlos Oliveira", 
      status: "scheduled",
      scheduledDate: "2024-09-22T14:00:00Z",
      price: 120,
      location: "Mooca - SP"
    },
    {
      id: "2",
      title: "Estante modulada escritório",
      client: "Fernanda Lima",
      status: "completed", 
      completedDate: "2024-09-18T16:30:00Z",
      price: 180,
      location: "Vila Olímpia - SP",
      rating: 5
    }
  ];

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge className="bg-destructive text-destructive-foreground">Urgente</Badge>;
      case "medium":
        return <Badge className="bg-warning text-warning-foreground">Moderado</Badge>;
      case "low":
        return <Badge variant="secondary">Flexível</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-primary text-primary-foreground">Agendado</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

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
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <LogOut className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Bem-vindo, Roberto! 🔧</h1>
          <p className="text-muted-foreground">Encontre novos trabalhos ou acompanhe seus serviços.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">R$ 1.250</h3>
                  <p className="text-sm text-muted-foreground">Saldo disponível</p>
                </div>
                <Wallet className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">4.9</h3>
                  <p className="text-sm text-muted-foreground">Avaliação média</p>
                </div>
                <Star className="w-8 h-8 text-warning fill-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">23</h3>
                  <p className="text-sm text-muted-foreground">Trabalhos este mês</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">87h</h3>
                  <p className="text-sm text-muted-foreground">Horas trabalhadas</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="available">Trabalhos Disponíveis</TabsTrigger>
            <TabsTrigger value="my-jobs">Meus Trabalhos</TabsTrigger>
            <TabsTrigger value="wallet">Carteira</TabsTrigger>
          </TabsList>
          
          <TabsContent value="available" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Trabalhos Disponíveis</CardTitle>
                    <CardDescription>Encontre novos trabalhos na sua região</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{job.title}</h3>
                            {getUrgencyBadge(job.urgency)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {job.client}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location} • {job.distance}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              ~{job.estimatedHours}h
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{job.postedAt}</span>
                            <span className="font-bold text-xl text-success">R$ {job.suggestedPrice}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Ver detalhes
                        </Button>
                        <Button size="sm" className="bg-gradient-primary">
                          Candidatar-se
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="my-jobs" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Meus Trabalhos</CardTitle>
                <CardDescription>Acompanhe seus trabalhos aceitos e histórico</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {myJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {job.client}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </div>
                            {job.scheduledDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(job.scheduledDate).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            {getJobStatusBadge(job.status)}
                            <span className="font-bold text-lg">R$ {job.price}</span>
                          </div>
                          {job.rating && (
                            <div className="flex items-center gap-1 mt-2">
                              <Star className="w-4 h-4 fill-warning text-warning" />
                              <span className="text-sm font-medium">{job.rating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm">Ver detalhes</Button>
                        {job.status === "scheduled" && (
                          <Button size="sm" variant="outline">Iniciar trabalho</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Saldo Disponível</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success mb-2">R$ 1.250,00</div>
                  <p className="text-sm text-muted-foreground">Pronto para saque</p>
                  <Button className="w-full mt-4 bg-gradient-primary">
                    Solicitar Saque
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Saques Solicitados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-warning mb-2">R$ 800,00</div>
                  <p className="text-sm text-muted-foreground">Em processamento</p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Prazo: até 2 dias úteis
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg">Total Recebido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">R$ 12.450,00</div>
                  <p className="text-sm text-muted-foreground">Este mês</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">+15% vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkerDashboard;