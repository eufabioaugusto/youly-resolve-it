import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Target, Heart, Users, TrendingUp } from "lucide-react";

const SobreNos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <img src="/images/hero-youly-1.png" alt="Youly" className="h-8" />
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Sobre a Youly</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conectando pessoas e transformando a experiência de montagem de móveis no Brasil
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-3xl font-bold mb-6">Nossa História</h2>
            <p className="text-muted-foreground mb-6">
              A Youly nasceu da frustração de milhares de brasileiros que compravam móveis online ou em lojas físicas 
              e enfrentavam dificuldades para encontrar montadores confiáveis e qualificados. Percebemos que havia 
              uma desconexão entre quem precisava de serviços de montagem e os profissionais qualificados disponíveis.
            </p>
            <p className="text-muted-foreground mb-6">
              Fundada em 2024, nossa missão é simplificar esse processo, criando uma ponte segura e eficiente entre 
              clientes e montadores profissionais. Utilizamos tecnologia para garantir transparência, segurança e 
              qualidade em cada serviço realizado.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nossos Valores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Compromisso</h3>
              <p className="text-muted-foreground">
                Comprometidos com a excelência em cada serviço, do primeiro contato até o pós-venda.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Empatia</h3>
              <p className="text-muted-foreground">
                Entendemos as necessidades de clientes e montadores, criando soluções que beneficiam todos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Comunidade</h3>
              <p className="text-muted-foreground">
                Construímos uma comunidade de profissionais qualificados e clientes satisfeitos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Inovação</h3>
              <p className="text-muted-foreground">
                Utilizamos tecnologia de ponta para melhorar continuamente nossa plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">Missão, Visão e Valores</h2>
          <div className="space-y-8">
            <div className="bg-muted/50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Nossa Missão</h3>
              <p className="text-muted-foreground">
                Facilitar a conexão entre clientes e montadores profissionais, oferecendo uma plataforma 
                segura, transparente e eficiente que garanta qualidade, confiança e satisfação em cada serviço realizado.
              </p>
            </div>

            <div className="bg-muted/50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Nossa Visão</h3>
              <p className="text-muted-foreground">
                Ser a maior e mais confiável plataforma de serviços de montagem e instalação do Brasil, 
                reconhecida pela excelência, inovação e pelo impacto positivo na vida de clientes e profissionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Nosso Impacto</h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10.000+</div>
              <p className="text-muted-foreground">Serviços Realizados</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Montadores Ativos</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.8</div>
              <p className="text-muted-foreground">Avaliação Média</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <p className="text-muted-foreground">Clientes Satisfeitos</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Faça Parte da Nossa História</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de clientes satisfeitos e montadores profissionais que confiam na Youly
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/register")}>
              Criar Conta
            </Button>
            <Button size="lg" variant="outline">
              Falar Conosco
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SobreNos;