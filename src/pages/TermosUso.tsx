import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermosUso = () => {
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

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2025</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar a plataforma Youly, você concorda em cumprir e estar vinculado aos seguintes termos e
                condições de uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos
                serviços.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground mb-4">
                A Youly é uma plataforma digital que conecta clientes que necessitam de serviços de montagem e
                instalação de móveis com profissionais montadores qualificados. A Youly atua como intermediária,
                facilitando a conexão entre as partes.
              </p>
              <p className="text-muted-foreground">
                <strong>Importante:</strong> A Youly não é prestadora direta dos serviços de montagem. Os montadores são
                profissionais autônomos responsáveis pela execução dos serviços contratados.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Cadastro e Conta de Usuário</h2>
              <h3 className="text-xl font-semibold mb-3">3.1 Requisitos de Cadastro</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Ser maior de 18 anos</li>
                <li>Fornecer informações verdadeiras, precisas e completas</li>
                <li>Manter suas informações atualizadas</li>
                <li>Manter a confidencialidade de sua senha</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">3.2 Responsabilidades do Usuário</h3>
              <p className="text-muted-foreground">
                Você é responsável por todas as atividades realizadas em sua conta e deve notificar imediatamente a
                Youly sobre qualquer uso não autorizado.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Uso da Plataforma</h2>
              <h3 className="text-xl font-semibold mb-3">4.1 Para Clientes</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Publicar pedidos de montagem com informações precisas e completas</li>
                <li>Avaliar propostas de montadores de forma justa</li>
                <li>Realizar pagamentos através da plataforma</li>
                <li>Validar serviços concluídos de boa-fé</li>
                <li>Fornecer acesso adequado ao local da montagem</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">4.2 Para Montadores</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Fornecer documentação válida e verdadeira</li>
                <li>Enviar propostas realistas e honestas</li>
                <li>Comparecer nas datas e horários agendados</li>
                <li>Executar serviços com qualidade profissional</li>
                <li>Respeitar o período de garantia de até 60 dias</li>
                <li>Manter conduta profissional e respeitosa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Pagamentos e Taxas</h2>
              <h3 className="text-xl font-semibold mb-3">5.1 Processamento de Pagamentos</h3>
              <p className="text-muted-foreground mb-4">
                Todos os pagamentos devem ser processados exclusivamente através da plataforma Youly. Pagamentos diretos
                entre clientes e montadores são proibidos e podem resultar no banimento da plataforma.
              </p>

              <h3 className="text-xl font-semibold mb-3">5.2 Taxa de Serviço</h3>
              <p className="text-muted-foreground mb-4">
                A Youly cobra uma comissão de 20% sobre o valor de cada serviço concluído. Esta taxa cobre processamento
                de pagamentos, suporte, garantia e manutenção da plataforma.
              </p>

              <h3 className="text-xl font-semibold mb-3">5.3 Reembolsos</h3>
              <p className="text-muted-foreground">
                Reembolsos são processados em casos de não comparecimento injustificado do montador ou cancelamento
                antes da confirmação do serviço, conforme nossa política de cancelamento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Garantia e Assistência</h2>
              <p className="text-muted-foreground mb-4">
                Todos os serviços realizados através da Youly possuem garantia de até 60 dias para defeitos de montagem.
                O montador é obrigado a retornar e corrigir problemas decorrentes de sua execução sem custo adicional ao
                cliente.
              </p>
              <p className="text-muted-foreground">
                A garantia não cobre defeitos de fábrica, danos causados por uso inadequado ou alterações feitas por
                terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Conduta Proibida</h2>
              <p className="text-muted-foreground mb-4">É estritamente proibido:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Fornecer informações falsas ou enganosas</li>
                <li>Usar a plataforma para fins ilegais</li>
                <li>Assediar, ameaçar ou intimidar outros usuários</li>
                <li>Burlar o sistema de pagamentos da plataforma</li>
                <li>Criar múltiplas contas para manipular avaliações</li>
                <li>Copiar, modificar ou distribuir conteúdo da plataforma sem autorização</li>
                <li>Usar automação (bots) para acessar a plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Responsabilidades e Limitações</h2>
              <h3 className="text-xl font-semibold mb-3">8.1 Limitação de Responsabilidade</h3>
              <p className="text-muted-foreground mb-4">
                A Youly atua como intermediária e não é responsável pela qualidade, segurança ou legalidade dos serviços
                prestados pelos montadores. Não garantimos que os serviços atendam às suas expectativas ou que os
                montadores cumpram todas as obrigações.
              </p>

              <h3 className="text-xl font-semibold mb-3">8.2 Isenção de Garantias</h3>
              <p className="text-muted-foreground">
                A plataforma é fornecida "como está" e "conforme disponível". Não garantimos operação ininterrupta,
                livre de erros ou vírus.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todo o conteúdo da plataforma Youly, incluindo textos, gráficos, logos, ícones, imagens e software, é
                propriedade da Youly ou de seus licenciadores e está protegido por leis de direitos autorais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Modificações dos Termos</h2>
              <p className="text-muted-foreground">
                A Youly reserva-se o direito de modificar estes termos a qualquer momento. Notificaremos os usuários
                sobre mudanças significativas. O uso continuado da plataforma após as alterações constitui aceitação dos
                novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Rescisão</h2>
              <p className="text-muted-foreground">
                A Youly pode suspender ou encerrar sua conta a qualquer momento, com ou sem aviso prévio, por violação
                destes termos ou por conduta prejudicial à plataforma ou outros usuários.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável e Jurisdição</h2>
              <p className="text-muted-foreground">
                Estes termos são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será resolvida
                nos tribunais do Brasil.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
              <p className="text-muted-foreground">Para dúvidas sobre estes termos, entre em contato:</p>
              <ul className="list-none text-muted-foreground mt-4">
                <li>Email: legal@youly.com.br</li>
                <li>Telefone: (11) 0000-0000</li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermosUso;
