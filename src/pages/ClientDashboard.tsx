import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wrench, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Bell,
  LogOut
} from "lucide-react";

const ClientDashboard = () => {
  // Mock data
  const orders = [
    {
      id: "1",
      description: "Guarda-roupa 6 portas MadeiraMadeira",
      status: "in_progress",
      worker: "João Silva",
      workerRating: 4.8,
      scheduledDate: "2024-09-20T14:00:00Z",
      price: 180,
      address: "Rua das Flores, 123 - São Paulo"
    },
    {
      id: "2",
      description: "Cama box casal + cabeceira",
      status: "completed",
      worker: "Maria Santos",
      workerRating: 5.0,
      scheduledDate: "2024-09-15T09:00:00Z",
      price: 120,
      address: "Av. Paulista, 456 - São Paulo"
    },
    {
      id: "3",
      description: "Mesa de jantar 6 lugares",
      status: "awaiting_payment",
      worker: "Carlos Oliveira",
      workerRating: 4.9,
      scheduledDate: "2024-09-25T10:00:00Z",
      price: 150,
      address: "Rua Augusta, 789 - São Paulo"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      case "completed":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      case "awaiting_payment":
        return <Badge variant="outline">Aguardando pagamento</Badge>;
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
          <h1 className="text-3xl font-bold mb-2">Olá, Maria! 👋</h1>
          <p className="text-muted-foreground">Aqui estão seus pedidos e atividades recentes.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card hover:shadow-elegant transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Novo Pedido</h3>
                  <p className="text-sm text-muted-foreground">Solicitar montagem</p>
                </div>
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">3</h3>
                  <p className="text-sm text-muted-foreground">Pedidos ativos</p>
                </div>
                <Clock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">R$ 450</h3>
                  <p className="text-sm text-muted-foreground">Total economizado</p>
                </div>
                <DollarSign className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Meus Pedidos</CardTitle>
            <CardDescription>Acompanhe o status dos seus pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{order.description}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {order.address}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.scheduledDate).toLocaleDateString('pt-BR')} às {new Date(order.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{order.worker}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-warning text-warning" />
                          <span className="text-sm">{order.workerRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {getStatusBadge(order.status)}
                        <span className="font-bold text-lg">R$ {order.price}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">Ver detalhes</Button>
                    {order.status === "awaiting_payment" && (
                      <Button size="sm" className="bg-gradient-primary">Pagar agora</Button>
                    )}
                    {order.status === "completed" && (
                      <Button variant="outline" size="sm">Avaliar</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;