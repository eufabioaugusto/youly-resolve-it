import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, FileText, Wrench, MapPin } from "lucide-react";

const Requisitos = () => {
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
          <CheckCircle className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Requisitos para Montadores</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Veja o que você precisa para se tornar um montador Youly
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Documentação Obrigatória</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>RG ou CNH (documento de identidade com foto)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>CPF válido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Comprovante de residência atualizado (últimos 3 meses)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Dados bancários (conta corrente ou poupança) para recebimento via PIX</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Telefone celular com WhatsApp ativo</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Ferramentas e Equipamentos</h3>
                <p className="text-muted-foreground mb-4">
                  É necessário possuir ferramentas básicas de montagem:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Furadeira/parafusadeira (preferencialmente sem fio)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Jogo de chaves (allen, philips, fenda)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Martelo de borracha</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Trena e nível</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Alicate e chave inglesa</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  * Ferramentas específicas podem ser necessárias dependendo do tipo de trabalho
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Disponibilidade e Mobilidade</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Capacidade de se deslocar até o local dos serviços (veículo próprio ou uso de transporte público)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Flexibilidade de horários (incluindo finais de semana)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Disponibilidade para atender chamados na sua região de atuação</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8">Requisitos Profissionais</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Experiência Mínima</h3>
              <p className="text-muted-foreground">
                Não é necessária experiência prévia formal, mas é importante ter conhecimento prático em montagem de móveis. 
                Montadores iniciantes são bem-vindos, mas devem ser honestos sobre seu nível de experiência.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Habilidades Necessárias</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• Interpretação de manuais de montagem</li>
                <li>• Atenção aos detalhes</li>
                <li>• Capacidade de organização</li>
                <li>• Bom relacionamento com clientes</li>
                <li>• Pontualidade e comprometimento</li>
              </ul>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Idade Mínima</h3>
              <p className="text-muted-foreground">
                É necessário ter no mínimo 18 anos completos para se cadastrar como montador na plataforma Youly.
              </p>
            </div>

            <div className="bg-background p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Código de Conduta</h3>
              <p className="text-muted-foreground">
                Todos os montadores devem concordar com nosso código de conduta, que inclui respeito ao cliente, 
                pontualidade, cuidado com o ambiente de trabalho e compromisso com a qualidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Diferenciais Valorizados</h3>
            <p className="text-muted-foreground mb-4">
              Embora não sejam obrigatórios, os seguintes itens aumentam suas chances de aprovação e de receber mais trabalhos:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Certificados de cursos relacionados (marcenaria, design de interiores, etc.)</li>
              <li>• Portfolio com fotos de trabalhos anteriores</li>
              <li>• Referências de clientes anteriores</li>
              <li>• MEI ou CNPJ ativo</li>
              <li>• Seguro de responsabilidade civil</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Atende aos Requisitos?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Cadastre-se agora e faça parte da nossa rede de montadores profissionais
          </p>
          <Button size="lg" onClick={() => navigate("/register")}>
            Iniciar Cadastro
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Requisitos;