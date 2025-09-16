import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, DollarSign, User } from "lucide-react";

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
        return <Badge variant="outline">Aguardando pagamento</Badge>;
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