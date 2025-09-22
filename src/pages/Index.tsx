import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wrench, 
  Users, 
  Shield, 
  Star, 
  CheckCircle, 
  Clock,
  MapPin,
  Smartphone
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold"><img src="https://storage.googleapis.com/gpt-engineer-file-uploads/HuLLY2XYTgNcG9iwF9oWsCLkpi53/social-images/social-1758540706926-Youly-Logo.png"></span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="#" className="text-sm hover:text-primary transition-colors">Como funciona</Link>
            <Link to="#" className="text-sm hover:text-primary transition-colors">Para empresas</Link>
            <Link to="/login" className="text-sm hover:text-primary transition-colors">Entrar</Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/register">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="secondary" className="mb-6">
            🚀 Nova plataforma de serviços
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Chamou. Resolveu.
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            A plataforma que conecta você aos melhores montadores de móveis da sua região. 
            Rápido, seguro e com garantia.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all" asChild>
              <Link to="/register?type=client" className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quero contratar
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="hover:bg-primary/10" asChild>
              <Link to="/register?type=worker" className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Quero trabalhar
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">1000+</div>
                <div className="text-muted-foreground">Montadores verificados</div>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">5000+</div>
                <div className="text-muted-foreground">Móveis montados</div>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">4.9</div>
                <div className="text-muted-foreground">Avaliação média</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Por que escolher a YOULY?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Segurança garantida</h3>
              <p className="text-muted-foreground">Todos os montadores são verificados e têm documentação completa</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Avaliações reais</h3>
              <p className="text-muted-foreground">Sistema transparente de avaliações de clientes anteriores</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Agilidade</h3>
              <p className="text-muted-foreground">Agendamento em até 3 opções de data e horário</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Garantia</h3>
              <p className="text-muted-foreground">30 dias de garantia em todos os serviços realizados</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Como funciona</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Descreva seu projeto</h3>
                <p className="text-muted-foreground">Conte sobre o móvel que precisa montar, envie a nota fiscal e escolha até 3 opções de data</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Escolha seu montador</h3>
                <p className="text-muted-foreground">Receba propostas de montadores verificados ou convide diretamente quem você preferir</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Serviço realizado</h3>
                <p className="text-muted-foreground">Pagamento seguro, execução profissional e garantia de 30 dias ativada</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Pronto para começar?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já resolveram suas necessidades com a YOULY
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register?type=client">Contratar agora</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary" asChild>
              <Link to="/register?type=worker">Trabalhar conosco</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 bg-gradient-primary rounded flex items-center justify-center">
                  <Wrench className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="font-bold">YOULY</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma que conecta você aos melhores prestadores de serviço.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Para clientes</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Como contratar</Link></li>
                <li><Link to="#" className="hover:text-primary">Garantia</Link></li>
                <li><Link to="#" className="hover:text-primary">Suporte</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Para montadores</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Como trabalhar</Link></li>
                <li><Link to="#" className="hover:text-primary">Requisitos</Link></li>
                <li><Link to="#" className="hover:text-primary">Pagamentos</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Sobre nós</Link></li>
                <li><Link to="#" className="hover:text-primary">Termos de uso</Link></li>
                <li><Link to="#" className="hover:text-primary">Privacidade</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 YOULY. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;