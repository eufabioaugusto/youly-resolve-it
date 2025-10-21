import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, FileText, CreditCard, CheckCircle } from "lucide-react";

const ComoContratar = () => {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Como Contratar um Montador</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Processo simples e seguro para encontrar o profissional ideal
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <UserPlus className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">1. Crie sua Conta</h3>
                <p className="text-muted-foreground mb-4">
                  Cadastro rápido e gratuito. Preencha seus dados básicos e confirme seu e-mail. Sem taxas de inscrição ou mensalidades.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <FileText className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">2. Publique seu Pedido</h3>
                <p className="text-muted-foreground mb-4">
                  Descreva detalhadamente o serviço que precisa. Inclua:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Tipo de móvel a ser montado</li>
                  <li>Fotos dos produtos (se possível da nota fiscal)</li>
                  <li>Endereço completo da montagem</li>
                  <li>Suas datas e horários disponíveis</li>
                  <li>Observações especiais (elevador, escadas, etc.)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">3. Analise as Propostas</h3>
                <p className="text-muted-foreground mb-4">
                  Montadores qualificados enviarão propostas. Compare:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Preço oferecido</li>
                  <li>Avaliação e comentários de outros clientes</li>
                  <li>Tempo de experiência</li>
                  <li>Nível do profissional (Bronze, Prata, Ouro, Diamante)</li>
                  <li>Taxa de conclusão com sucesso</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <CreditCard className="h-6 w-6" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">4. Confirme e Pague</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha o montador ideal e confirme a data. Pague de forma segura através da plataforma:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>PIX (aprovação instantânea)</li>
                  <li>Cartão de crédito (até 12x)</li>
                  <li>Pagamento protegido até conclusão do serviço</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Dicas para uma Boa Contratação</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Seja Detalhista</h3>
              <p className="text-sm text-muted-foreground">
                Quanto mais informações você fornecer, mais precisa será a proposta do montador.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Verifique Avaliações</h3>
              <p className="text-sm text-muted-foreground">
                Leia comentários de outros clientes para escolher o melhor profissional.
              </p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Comunique-se</h3>
              <p className="text-sm text-muted-foreground">
                Use o chat da plataforma para tirar dúvidas antes de confirmar.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Comece Agora</h2>
          <Button size="lg" onClick={() => navigate("/register")}>
            Criar Conta e Publicar Pedido
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ComoContratar;