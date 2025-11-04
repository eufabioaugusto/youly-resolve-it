import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, DollarSign, User, CreditCard, CheckCircle2, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobDetailsModalProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailsModal = ({ job, open, onOpenChange }: JobDetailsModalProps) => {
  if (!job) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatPeriodo = (periodo: string) => {
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberto":
        return <Badge variant="outline">Aberto</Badge>;
      case "aguardando_pagamento":
        return <Badge variant="outline" className="bg-warning/10">Aguardando pagamento</Badge>;
      case "pago":
        return <Badge className="bg-success text-success-foreground">Pago</Badge>;
      case "em_andamento":
        return <Badge className="bg-warning text-warning-foreground">Em andamento</Badge>;
      case "concluido":
        return <Badge className="bg-success text-success-foreground">Concluído</Badge>;
      case "em_negociacao":
        return <Badge variant="secondary">Em negociação</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido</span>
            {getStatusBadge(job.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descrição */}
          <div>
            <h3 className="font-semibold text-lg mb-2">{job.descricao}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{job.categoria}</Badge>
              {job.valor_estimado && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  R$ {job.valor_estimado.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Imagens dos Produtos */}
          {job.imagens_produtos && job.imagens_produtos.length > 0 && (
            <>
              <div>
                <h4 className="font-medium mb-3">Imagens dos Produtos</h4>
                <div className="grid grid-cols-4 gap-2">
                  {job.imagens_produtos.map((imgUrl: string, index: number) => (
                    <img
                      key={index}
                      src={imgUrl}
                      alt={`Produto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Endereço */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </h4>
            <p className="text-sm text-muted-foreground">
              {job.endereco?.rua}, {job.endereco?.numero}
              <br />
              {job.endereco?.bairro} - {job.endereco?.cidade}, {job.endereco?.estado}
              <br />
              CEP: {job.endereco?.cep}
            </p>
          </div>

          <Separator />

          {/* Datas Disponíveis */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Datas Disponíveis
            </h4>
            <div className="grid gap-2">
              {job.data_opcoes?.map((opcao: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Informações do Montador (se houver) */}
          {job.montador && (
            <>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Montador Designado
                </h4>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium">{job.montador.profiles?.nome || 'Montador'}</p>
                  <p className="text-sm text-muted-foreground">
                    Avaliação: {job.montador.avaliacao_media?.toFixed(1) || '0.0'} ⭐
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informações de Pagamento e Ordem de Serviço */}
          {(job.status === 'pago' || job.ordem_servico) && (
            <>
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Status do Serviço
                </h4>
                <div className="space-y-3">
                  {job.status === 'pago' && (
                    <Alert className="bg-success/10 border-success">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <AlertDescription>
                        ✅ Pagamento confirmado! O montador foi notificado e o serviço será iniciado em breve.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {job.ordem_servico && (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Ordem de Serviço:</span>
                          <Badge variant="outline">
                            {job.ordem_servico.status === 'concluida' ? 'Concluída' :
                             job.ordem_servico.status === 'iniciada' ? 'Em execução' :
                             job.ordem_servico.status === 'a_caminho' ? 'Montador a caminho' :
                             'Agendada'}
                          </Badge>
                        </div>
                        
                        {job.ordem_servico.data_hora_agendamento && (
                          <div className="text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Agendado: {new Date(job.ordem_servico.data_hora_agendamento).toLocaleDateString('pt-BR')}
                            {job.ordem_servico.periodo_agendamento && ` - ${job.ordem_servico.periodo_agendamento}`}
                          </div>
                        )}
                        
                        {job.ordem_servico.codigo_validacao && (
                          <Alert className="mt-2">
                            <Shield className="h-4 w-4" />
                            <AlertDescription className="font-mono font-semibold">
                              Código: {job.ordem_servico.codigo_validacao}
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {job.ordem_servico.garantia_ativa && (
                          <div className="text-sm text-success font-medium">
                            🛡️ Garantia ativa até {new Date(job.ordem_servico.data_expiracao_garantia).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Informações Adicionais */}
          <div>
            <h4 className="font-medium mb-2">Informações Adicionais</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Pedido criado em: {new Date(job.created_at).toLocaleDateString('pt-BR')}</p>
              <p>Última atualização: {new Date(job.updated_at).toLocaleDateString('pt-BR')}</p>
              {job.nota_fiscal && (
                <p>Nota fiscal: {job.nota_fiscal}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;