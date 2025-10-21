import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, MessageSquare, Calendar, CheckCircle } from "lucide-react";

const ComoFunciona = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Como Funciona a Youly</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Conectamos você aos melhores montadores profissionais de forma simples, rápida e segura
          </p>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  1
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Publique seu Pedido</h3>
                </div>
                <p className="text-muted-foreground">
                  Descreva o serviço de montagem que você precisa, anexe fotos dos produtos e informe suas datas disponíveis. É rápido e fácil!
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  2
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Receba Propostas</h3>
                </div>
                <p className="text-muted-foreground">
                  Montadores verificados enviam propostas personalizadas para o seu serviço. Compare preços, avaliações e escolha o melhor profissional.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  3
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Agende e Pague</h3>
                </div>
                <p className="text-muted-foreground">
                  Confirme a data e horário com o montador escolhido. Pague de forma segura através da plataforma com PIX ou cartão de crédito.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  4
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Receba o Serviço</h3>
                </div>
                <p className="text-muted-foreground">
                  O montador realiza o serviço na data agendada. Após a conclusão, você valida o trabalho e conta com 90 dias de garantia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Por que Escolher a Youly?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Segurança Total</h3>
              <p className="text-muted-foreground">
                Todos os montadores são verificados e avaliados. Seu pagamento fica seguro até a conclusão do serviço.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Garantia Estendida</h3>
              <p className="text-muted-foreground">
                90 dias de garantia em todos os serviços. Se algo der errado, o montador retorna sem custo adicional.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Melhor Preço</h3>
              <p className="text-muted-foreground">
                Compare propostas de diferentes profissionais e escolha a que melhor se encaixa no seu orçamento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Começar?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Publique seu pedido agora e receba propostas em minutos
          </p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Criar Conta Grátis
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ComoFunciona;