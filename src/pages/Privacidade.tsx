import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const Privacidade = () => {
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
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">Última atualização: Janeiro de 2025</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground">
                A Youly ("nós", "nosso" ou "plataforma") está comprometida em proteger sua privacidade. 
                Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas 
                informações pessoais quando você usa nossa plataforma, em conformidade com a 
                Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Informações de Cadastro</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Nome completo</li>
                <li>CPF/CNPJ</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>Endereço residencial ou comercial</li>
                <li>Data de nascimento</li>
                <li>Documentos de identificação (RG, CNH)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.2 Informações de Pagamento</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Dados de cartão de crédito (processados por gateway seguro)</li>
                <li>Chave PIX para montadores</li>
                <li>Histórico de transações</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.3 Informações de Uso</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Endereço IP</li>
                <li>Tipo e versão do navegador</li>
                <li>Páginas visitadas</li>
                <li>Tempo de acesso</li>
                <li>Dispositivo utilizado</li>
                <li>Localização geográfica aproximada</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.4 Informações de Serviços</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Detalhes de pedidos de montagem</li>
                <li>Propostas enviadas e recebidas</li>
                <li>Avaliações e comentários</li>
                <li>Fotos de trabalhos realizados</li>
                <li>Mensagens trocadas na plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
              <p className="text-muted-foreground mb-4">Utilizamos suas informações para:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Criar e gerenciar sua conta</li>
                <li>Processar transações e pagamentos</li>
                <li>Conectar clientes e montadores</li>
                <li>Enviar notificações sobre serviços</li>
                <li>Fornecer suporte ao cliente</li>
                <li>Melhorar e personalizar nossos serviços</li>
                <li>Prevenir fraudes e garantir segurança</li>
                <li>Cumprir obrigações legais</li>
                <li>Enviar comunicações de marketing (com seu consentimento)</li>
                <li>Realizar análises estatísticas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Base Legal para Processamento</h2>
              <p className="text-muted-foreground mb-4">
                Processamos seus dados pessoais com base nas seguintes bases legais da LGPD:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Execução de contrato:</strong> Para fornecer os serviços que você solicitou</li>
                <li><strong>Consentimento:</strong> Para enviar comunicações de marketing</li>
                <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e prevenir fraudes</li>
                <li><strong>Obrigação legal:</strong> Para cumprir leis e regulamentos aplicáveis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Compartilhamento de Informações</h2>
              <p className="text-muted-foreground mb-4">
                Podemos compartilhar suas informações com:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Entre usuários:</strong> Informações necessárias para execução do serviço (nome, telefone, endereço)</li>
                <li><strong>Processadores de pagamento:</strong> Para processar transações financeiras</li>
                <li><strong>Fornecedores de serviços:</strong> Que nos auxiliam na operação da plataforma</li>
                <li><strong>Autoridades legais:</strong> Quando exigido por lei ou para proteger direitos</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Não vendemos suas informações pessoais a terceiros.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Segurança dos Dados</h2>
              <p className="text-muted-foreground mb-4">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Criptografia SSL/TLS para transmissão de dados</li>
                <li>Criptografia de dados sensíveis em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Monitoramento de segurança 24/7</li>
                <li>Backups regulares</li>
                <li>Auditorias de segurança periódicas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground mb-4">
                De acordo com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Confirmação e acesso:</strong> Saber se processamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> De dados desnecessários ou excessivos</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                <li><strong>Eliminação:</strong> Solicitar exclusão de dados tratados com base em consentimento</li>
                <li><strong>Informação sobre compartilhamento:</strong> Saber com quem compartilhamos seus dados</li>
                <li><strong>Revogação do consentimento:</strong> Retirar consentimento a qualquer momento</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Para exercer seus direitos, entre em contato através de: <strong>privacidade@youly.com.br</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Retenção de Dados</h2>
              <p className="text-muted-foreground">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos 
                descritos nesta política ou conforme exigido por lei. Após esse período, os dados são 
                excluídos ou anonimizados de forma segura.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Cookies e Tecnologias Semelhantes</h2>
              <p className="text-muted-foreground mb-4">
                Utilizamos cookies e tecnologias semelhantes para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Manter você conectado à sua conta</li>
                <li>Entender como você usa nossa plataforma</li>
                <li>Personalizar sua experiência</li>
                <li>Melhorar nossos serviços</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Você pode gerenciar preferências de cookies nas configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Transferência Internacional de Dados</h2>
              <p className="text-muted-foreground">
                Seus dados são armazenados e processados em servidores localizados no Brasil. 
                Caso ocorra transferência internacional, garantiremos medidas de proteção adequadas 
                em conformidade com a LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Menores de Idade</h2>
              <p className="text-muted-foreground">
                Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente 
                informações de menores. Se tomarmos conhecimento de que coletamos dados de um menor, 
                excluiremos tais informações imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre 
                alterações significativas por e-mail ou através de aviso na plataforma. 
                A data de "Última atualização" no topo indica quando a política foi revisada pela última vez.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Encarregado de Proteção de Dados (DPO)</h2>
              <p className="text-muted-foreground">
                Para questões relacionadas à proteção de dados, entre em contato com nosso DPO:
              </p>
              <ul className="list-none text-muted-foreground mt-4">
                <li>Email: dpo@youly.com.br</li>
                <li>Endereço: [Endereço completo da empresa]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contato</h2>
              <p className="text-muted-foreground mb-4">
                Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados:
              </p>
              <ul className="list-none text-muted-foreground">
                <li>Email: privacidade@youly.com.br</li>
                <li>Telefone: (11) 0000-0000</li>
                <li>Endereço: [Endereço completo da empresa]</li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacidade;