import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";

const Garantia = () => {
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
          <Shield className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Garantia Youly</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            90 dias de proteção em todos os serviços realizados pela plataforma
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-lg mb-12">
            <h2 className="text-2xl font-bold mb-4">O que é a Garantia Youly?</h2>
            <p className="text-muted-foreground">
              A Garantia Youly é uma proteção de 90 dias que cobre todos os serviços de montagem realizados através da nossa plataforma. 
              Se algo der errado com a montagem dentro desse período, o montador retorna para corrigir sem custo adicional para você.
            </p>
          </div>

          <div className="space-y-8 mb-12">
            <div className="flex gap-4">
              <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">O que está Coberto</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Peças montadas incorretamente</li>
                  <li>• Móveis instáveis ou que apresentem defeitos na montagem</li>
                  <li>• Parafusos ou fixações que se soltaram</li>
                  <li>• Problemas decorrentes de erro na execução do serviço</li>
                  <li>• Danos causados durante a montagem pelo profissional</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">O que NÃO está Coberto</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Defeitos de fábrica dos produtos</li>
                  <li>• Danos causados por uso inadequado</li>
                  <li>• Desgaste natural dos móveis</li>
                  <li>• Mudança de endereço ou desmontagem</li>
                  <li>• Alterações feitas por terceiros após a montagem</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Como Acionar a Garantia</h3>
                <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
                  <li>Acesse sua conta na plataforma Youly</li>
                  <li>Localize a ordem de serviço concluída</li>
                  <li>Clique em "Solicitar Assistência Técnica"</li>
                  <li>Descreva o problema e envie fotos</li>
                  <li>Aguarde o contato do montador para agendamento</li>
                </ol>
                <p className="mt-4 text-sm">
                  <strong>Prazo de resposta:</strong> O montador tem até 48h para responder à solicitação de garantia.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Proteção do Cliente</h3>
            <p className="text-muted-foreground mb-4">
              Seu pagamento fica retido na plataforma até a conclusão e validação do serviço. Isso garante que:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>✓ O montador só recebe após você validar o trabalho</li>
              <li>✓ Você pode solicitar correções antes da validação final</li>
              <li>✓ Em caso de não comparecimento, você recebe reembolso total</li>
              <li>✓ Suporte da Youly disponível para mediar qualquer questão</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Dúvidas sobre a Garantia?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Nossa equipe está pronta para ajudar com qualquer questão relacionada à garantia dos serviços
          </p>
          <Button size="lg">
            Falar com Suporte
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Garantia;