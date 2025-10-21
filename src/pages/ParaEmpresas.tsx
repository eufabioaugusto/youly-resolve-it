import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Users, TrendingUp, Shield, Clock, DollarSign } from "lucide-react";

const ParaEmpresas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <img src="/images/hero-youly-1.png" alt="Youly" className="h-8" />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Building2 className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Youly para Empresas</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Soluções corporativas em montagem e instalação para empresas de todos os portes
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Benefícios para sua Empresa</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Rede Nacional</h3>
              <p className="text-muted-foreground">
                Acesso a milhares de montadores qualificados em todo o Brasil para atender suas demandas corporativas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Agilidade</h3>
              <p className="text-muted-foreground">
                Gestão centralizada de múltiplos pedidos simultaneamente com acompanhamento em tempo real.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Economia</h3>
              <p className="text-muted-foreground">
                Reduza custos operacionais com preços competitivos e sem necessidade de equipe própria.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Casos de Uso Corporativos</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">E-commerce e Varejo</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Montagem de produtos vendidos online</li>
                <li>• Serviço pós-venda diferenciado</li>
                <li>• Aumento da satisfação do cliente final</li>
                <li>• Redução de devoluções</li>
              </ul>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Escritórios e Coworking</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Montagem de estações de trabalho</li>
                <li>• Instalação de móveis corporativos</li>
                <li>• Reformas e mudanças</li>
                <li>• Manutenção periódica</li>
              </ul>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Construtoras e Imobiliárias</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Montagem de apartamentos decorados</li>
                <li>• Entrega de imóveis mobiliados</li>
                <li>• Projetos em larga escala</li>
                <li>• Prazos garantidos</li>
              </ul>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Hotéis e Hospitalidade</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Montagem de mobiliário hoteleiro</li>
                <li>• Reformas de quartos</li>
                <li>• Instalações comerciais</li>
                <li>• Serviço 24/7 disponível</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Recursos Corporativos</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Faturamento Corporativo</h3>
                <p className="text-muted-foreground">
                  Emissão de notas fiscais e gestão financeira simplificada para sua contabilidade.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Relatórios e Analytics</h3>
                <p className="text-muted-foreground">
                  Dashboard completo com métricas de desempenho, custos e satisfação.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Gestor de Conta Dedicado</h3>
                <p className="text-muted-foreground">
                  Suporte personalizado com um gerente exclusivo para sua empresa.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">SLA Garantido</h3>
                <p className="text-muted-foreground">
                  Acordos de nível de serviço personalizados para suas necessidades específicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Escalar seu Negócio?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Entre em contato e descubra como a Youly pode otimizar as operações da sua empresa
          </p>
          <Button size="lg">
            Falar com Especialista
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ParaEmpresas;