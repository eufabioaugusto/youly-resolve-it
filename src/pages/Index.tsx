import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Users, Shield, Star, CheckCircle, Clock, MapPin, Smartphone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="https://storage.googleapis.com/gpt-engineer-file-uploads/HuLLY2XYTgNcG9iwF9oWsCLkpi53/social-images/social-1758541291424-Youly-Logo.png"
              alt="Youly Logo"
              className="h-9 object-contain"
            />
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="#" className="text-sm hover:text-primary transition-colors">
              Como funciona
            </Link>
            <Link to="#" className="text-sm hover:text-primary transition-colors">
              Para empresas
            </Link>
            <Link to="/login" className="text-sm hover:text-primary transition-colors">
              Entrar
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link to="/register">Cadastrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* HERO — estilo impact (degradê full, headline forte, CTAs duplos, chips/estatísticas) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-5">
              🚀 Nova plataforma de serviços
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-white">
              Chamou. <span className="opacity-90">Resolveu.</span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl">
              Conecte-se a montadores verificados, agende na hora e ative a garantia de 30 dias. Rápido, seguro e do seu
              jeito.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" variant="secondary" className="hover:shadow-glow" asChild>
                <Link to="/register?type=client" className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Quero contratar
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-primary"
                asChild
              >
                <Link to="/register?type=worker" className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Quero trabalhar
                </Link>
              </Button>
            </div>

            {/* Chips/mini cards de prova social no hero */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">1000+</div>
                <div className="text-sm opacity-90">Montadores verificados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">5000+</div>
                <div className="text-sm opacity-90">Móveis montados</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
                <div className="text-2xl font-bold">4.9★</div>
                <div className="text-sm opacity-90">Avaliação média</div>
              </div>
            </div>
          </div>
        </div>

        {/* Elementos decorativos “bolhas” tipo impact */}
        <div className="pointer-events-none absolute -right-20 top-20 hidden md:block">
          <div className="size-44 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
        <div className="pointer-events-none absolute right-10 bottom-10 hidden md:block">
          <div className="size-24 rounded-full bg-white/10 backdrop-blur-sm" />
        </div>
      </section>

      {/* BARRA DE CONFIANÇA — estilo faixa simples (dados chave) */}
      <section className="py-10 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Cobertura</div>
              <div className="font-semibold flex items-center justify-center gap-2">
                <MapPin className="w-4 h-4" /> Principais capitais
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Agendamento</div>
              <div className="font-semibold">3 opções de data/hora</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Garantia</div>
              <div className="font-semibold">30 dias em todos os serviços</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Atendimento</div>
              <div className="font-semibold flex items-center justify-center gap-2">
                <Smartphone className="w-4 h-4" /> 100% online
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS — grid 2x2 com cards elevados, ícones grandes */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Por que escolher a YOULY?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Segurança garantida</h3>
                  <p className="text-muted-foreground">
                    Todos os montadores são verificados e têm documentação completa. Você contrata com tranquilidade.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <Star className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Avaliações reais</h3>
                  <p className="text-muted-foreground">
                    Sistema transparente de avaliações e histórico de serviços para você escolher com confiança.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Agilidade</h3>
                  <p className="text-muted-foreground">
                    Agende em até 3 opções de data e horário, com confirmação rápida e comunicação dentro da plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 flex gap-6">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Garantia ativa</h3>
                  <p className="text-muted-foreground">
                    30 dias de garantia em todos os serviços realizados. Se precisar, a gente resolve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA — cards numerados estilo “flow” */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Como funciona</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Descreva seu projeto</h3>
                <p className="text-muted-foreground">
                  Conte sobre o móvel que precisa montar, envie a nota fiscal e escolha até 3 opções de data.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Escolha seu montador</h3>
                <p className="text-muted-foreground">
                  Receba propostas de profissionais verificados ou convide diretamente quem preferir.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Serviço realizado</h3>
                <p className="text-muted-foreground">
                  Pagamento seguro, execução profissional e garantia de 30 dias ativada.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA inline abaixo do fluxo, estilo impact */}
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow" asChild>
              <Link to="/register?type=client">Começar agora</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* RESULTADOS — blocos de ROI (números grandes) */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-extrabold text-primary mb-2">+46%</div>
                <div className="font-semibold">Mais rapidez na contratação</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Processo simples reduz tempo de espera e retrabalho.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-extrabold text-primary mb-2">22%</div>
                <div className="font-semibold">Menos imprevistos</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Documentação e avaliações minimizam surpresas na execução.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-elegant transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-4xl font-extrabold text-primary mb-2">4.9★</div>
                <div className="font-semibold">Satisfação média</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Atendimento humanizado e garantia ativa pós-serviço.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA FINAL — banner em degradê forte, estilo impact */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Pronto para começar?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já resolveram suas necessidades com a YOULY.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register?type=client">Contratar agora</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-primary"
              asChild
            >
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
                <li>
                  <Link to="#" className="hover:text-primary">
                    Como contratar
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Garantia
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Suporte
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Para montadores</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Como trabalhar
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Requisitos
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Pagamentos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="#" className="hover:text-primary">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-primary">
                    Privacidade
                  </Link>
                </li>
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
