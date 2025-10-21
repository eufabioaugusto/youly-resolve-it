import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Mail, Phone, Clock, HelpCircle } from "lucide-react";

const Suporte = () => {
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
          <HelpCircle className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Central de Suporte</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Estamos aqui para ajudar você com qualquer dúvida ou problema
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Como Podemos Ajudar?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Chat Online</h3>
              <p className="text-muted-foreground mb-4">
                Converse em tempo real com nossa equipe
              </p>
              <Button variant="outline">
                Iniciar Chat
              </Button>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">E-mail</h3>
              <p className="text-muted-foreground mb-4">
                Envie sua dúvida detalhada
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:suporte@youly.com.br">
                  Enviar E-mail
                </a>
              </Button>
            </div>

            <div className="text-center p-6 border rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">WhatsApp</h3>
              <p className="text-muted-foreground mb-4">
                Suporte direto pelo WhatsApp
              </p>
              <Button variant="outline">
                Chamar no WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-start gap-4 mb-8">
            <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold mb-4">Horário de Atendimento</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Segunda a Sexta:</strong> 8h às 18h</p>
                <p><strong>Sábados:</strong> 9h às 14h</p>
                <p><strong>Domingos e Feriados:</strong> Fechado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Como cancelo um pedido?</h3>
              <p className="text-muted-foreground">
                Você pode cancelar um pedido antes da confirmação do pagamento sem custos. Após o pagamento, consulte nossa política de cancelamento na sua ordem de serviço.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">O montador não compareceu, o que faço?</h3>
              <p className="text-muted-foreground">
                Entre em contato imediatamente com nosso suporte. Você receberá reembolso total em caso de não comparecimento sem justificativa do montador.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Como funciona o reembolso?</h3>
              <p className="text-muted-foreground">
                Reembolsos são processados em até 7 dias úteis e retornam para a mesma forma de pagamento utilizada na compra.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Posso alterar a data agendada?</h3>
              <p className="text-muted-foreground">
                Sim, entre em contato com o montador através do chat da plataforma para reagendar. Alterações devem ser feitas com pelo menos 24h de antecedência.
              </p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Como avalio o serviço?</h3>
              <p className="text-muted-foreground">
                Após a conclusão do serviço, você receberá um link por e-mail e SMS para avaliar o trabalho do montador. Sua avaliação é muito importante!
              </p>
            </div>

            <div className="pb-6">
              <h3 className="text-lg font-semibold mb-2">Meus dados estão seguros?</h3>
              <p className="text-muted-foreground">
                Sim, utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. Seus dados pessoais e de pagamento são protegidos conforme a LGPD.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Suporte;