import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Briefcase, TrendingUp, Star, DollarSign } from "lucide-react";

const ComoTrabalhar = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <img src="https://storage.googleapis.com/gpt-engineer-file-uploads/HuLLY2XYTgNcG9iwF9oWsCLkpi53/social-images/social-1758541291424-Youly-Logo.png" alt="Youly" className="h-8" />
        </div>
      </header>

      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <Briefcase className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Como Trabalhar na Youly</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Faça parte da maior rede de montadores profissionais do Brasil
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Cadastre-se Gratuitamente</h3>
                <p className="text-muted-foreground mb-4">
                  Preencha seu cadastro com informações profissionais:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Dados pessoais e de contato</li>
                  <li>Experiência e especialidades</li>
                  <li>Documentos necessários (RG, CPF, comprovante de residência)</li>
                  <li>Fotos de trabalhos anteriores (opcional mas recomendado)</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Aguarde Aprovação</h3>
                <p className="text-muted-foreground mb-4">
                  Nossa equipe analisa seu cadastro em até 48 horas. Verificamos:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Autenticidade dos documentos</li>
                  <li>Informações de contato</li>
                  <li>Experiência profissional declarada</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Receba Oportunidades</h3>
                <p className="text-muted-foreground mb-4">
                  Após aprovação, você começa a receber notificações de trabalhos na sua região:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Veja detalhes dos pedidos disponíveis</li>
                  <li>Analise fotos, localização e complexidade</li>
                  <li>Envie propostas competitivas</li>
                  <li>Negocie valores diretamente com o cliente</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Execute e Receba</h3>
                <p className="text-muted-foreground mb-4">
                  Realize o serviço com qualidade e receba seu pagamento:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Cliente valida a conclusão do trabalho</li>
                  <li>Pagamento liberado em até 48h após validação</li>
                  <li>Receba via PIX na sua conta</li>
                  <li>Construa sua reputação com avaliações positivas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Vantagens de Ser um Montador Youly</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background p-6 rounded-lg text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Renda Extra Garantida</h3>
              <p className="text-muted-foreground">
                Defina seus próprios preços e trabalhe quando quiser. Sem metas ou horários fixos.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg text-center">
              <Star className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Construa sua Reputação</h3>
              <p className="text-muted-foreground">
                Sistema de avaliações e níveis de gamificação. Quanto melhor seu trabalho, mais oportunidades.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Crescimento Profissional</h3>
              <p className="text-muted-foreground">
                Evolua de Bronze a Diamante e tenha acesso a trabalhos mais lucrativos e clientes premium.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Sistema de Níveis</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-orange-500">🥉</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Bronze</h4>
                <p className="text-sm text-muted-foreground">Nível inicial. Disponível ao criar conta aprovada.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gray-400/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-400">🥈</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Prata</h4>
                <p className="text-sm text-muted-foreground">10+ trabalhos concluídos | 4.5+ de avaliação média</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-yellow-500">🥇</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Ouro</h4>
                <p className="text-sm text-muted-foreground">50+ trabalhos concluídos | 4.7+ de avaliação média | 95%+ taxa de sucesso</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-blue-500">💎</span>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Diamante</h4>
                <p className="text-sm text-muted-foreground">100+ trabalhos concluídos | 4.9+ de avaliação média | 98%+ taxa de sucesso</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para Começar?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e comece a receber oportunidades de trabalho na sua região
          </p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Cadastrar como Montador
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ComoTrabalhar;