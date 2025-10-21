import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Wallet, Clock, Shield } from "lucide-react";

const Pagamentos = () => {
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
          <Wallet className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Como Funcionam os Pagamentos</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Sistema transparente e seguro para montadores receberem pelos serviços prestados
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Fluxo de Pagamento</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cliente Realiza o Pagamento</h3>
                <p className="text-muted-foreground">
                  Quando o cliente aceita sua proposta, ele realiza o pagamento através da plataforma. 
                  O valor fica retido em segurança até a conclusão do serviço.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Você Executa o Serviço</h3>
                <p className="text-muted-foreground">
                  Realize a montagem com qualidade na data e horário agendados. Tire fotos do trabalho concluído 
                  e solicite a validação do cliente através do código de validação.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Cliente Valida o Trabalho</h3>
                <p className="text-muted-foreground">
                  O cliente confirma que o serviço foi realizado conforme o acordado. 
                  Após a validação, o valor é liberado para sua carteira Youly.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Solicite o Saque</h3>
                <p className="text-muted-foreground">
                  Com o valor em sua carteira, você pode solicitar o saque a qualquer momento. 
                  O pagamento é feito via PIX em até 48 horas úteis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Taxas e Comissões</h2>
          <div className="bg-background p-8 rounded-lg">
            <div className="flex items-start gap-4 mb-6">
              <DollarSign className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-2xl font-semibold mb-3">Taxa da Plataforma</h3>
                <p className="text-muted-foreground mb-4">
                  A Youly cobra uma comissão de <strong>15%</strong> sobre o valor total de cada serviço concluído. 
                  Esta taxa cobre:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Processamento de pagamentos</li>
                  <li>• Suporte ao cliente</li>
                  <li>• Marketing e divulgação da plataforma</li>
                  <li>• Seguro e garantia dos serviços</li>
                  <li>• Manutenção e desenvolvimento da plataforma</li>
                </ul>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg">
              <h4 className="font-semibold mb-2">Exemplo de Cálculo:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Valor do serviço: <strong>R$ 200,00</strong></p>
                <p>Taxa da plataforma (15%): <strong>R$ 30,00</strong></p>
                <p className="text-lg font-semibold text-primary">Você recebe: R$ 170,00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Carteira Youly</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-6 rounded-lg">
              <Clock className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Saldo Disponível</h3>
              <p className="text-muted-foreground">
                Valores de serviços concluídos e validados ficam disponíveis para saque imediato. 
                Você controla quando quer receber.
              </p>
            </div>

            <div className="border p-6 rounded-lg">
              <Shield className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Saldo Bloqueado</h3>
              <p className="text-muted-foreground">
                Valores de serviços concluídos mas ainda dentro do período de garantia (90 dias) 
                ficam retidos como garantia de qualidade.
              </p>
            </div>
          </div>

          <div className="mt-8 bg-muted/50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Política de Saques</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Valor mínimo:</strong> R$ 50,00 por saque</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Prazo:</strong> Pagamento via PIX em até 48 horas úteis após solicitação</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span><strong>Sem taxas:</strong> Não cobramos taxa adicional para saques via PIX</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Perguntas Frequentes</h2>
          <div className="space-y-6">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Quando recebo meu pagamento?</h3>
              <p className="text-muted-foreground">
                Após o cliente validar o serviço, o valor é creditado na sua carteira Youly. 
                Você pode solicitar o saque imediatamente, e receberá em até 48 horas úteis via PIX.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">E se o cliente não validar o serviço?</h3>
              <p className="text-muted-foreground">
                Após 48 horas da conclusão do serviço, se o cliente não se manifestar, 
                o sistema valida automaticamente e libera o pagamento.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Posso receber em dinheiro?</h3>
              <p className="text-muted-foreground">
                Não. Todos os pagamentos devem ser processados exclusivamente através da plataforma 
                para garantir a segurança de ambas as partes e a proteção da garantia.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Como emito nota fiscal?</h3>
              <p className="text-muted-foreground">
                Se você possui MEI ou CNPJ, pode emitir nota fiscal diretamente. 
                A plataforma gera um recibo de cada serviço que pode ser usado para sua contabilidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Ganhar Dinheiro?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e comece a receber por seus serviços de forma segura e rápida
          </p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Cadastrar como Montador
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Pagamentos;