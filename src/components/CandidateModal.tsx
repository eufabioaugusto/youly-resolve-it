import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Clock, DollarSign, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface CandidateModalProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CandidateModal = ({ job, open, onOpenChange, onSuccess }: CandidateModalProps) => {
  const [proposta, setProposta] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { montadorProfile } = useProfile();

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

  const handleSubmit = async () => {
    if (!montadorProfile || !proposta) {
      toast({
        title: "Erro",
        description: "Preencha o valor da proposta",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('candidaturas')
        .insert({
          job_id: job.id,
          montador_id: montadorProfile.id,
          proposta: parseFloat(proposta),
          observacoes,
          status: 'pendente'
        });

      if (error) throw error;

      toast({
        title: "Candidatura enviada!",
        description: "O cliente será notificado sobre sua proposta."
      });

      onSuccess();
      onOpenChange(false);
      setProposta('');
      setObservacoes('');
    } catch (error: any) {
      toast({
        title: "Erro ao enviar candidatura",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidatar-se ao Trabalho</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detalhes do Job */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{job.descricao}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <Badge variant="outline">{job.categoria}</Badge>
              {job.valor_estimado && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  Valor estimado: R$ {job.valor_estimado.toFixed(2)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-1 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </h4>
                <p className="text-muted-foreground">
                  {job.endereco?.rua}, {job.endereco?.numero}
                  <br />
                  {job.endereco?.bairro} - {job.endereco?.cidade}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Datas Disponíveis
                </h4>
                <div className="space-y-1">
                  {job.data_opcoes?.slice(0, 2).map((opcao: any, index: number) => (
                    <div key={index} className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDate(opcao.data)} - {formatPeriodo(opcao.periodo)}
                    </div>
                  ))}
                  {job.data_opcoes?.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{job.data_opcoes.length - 2} outras opções
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Formulário de Proposta */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="proposta">Sua Proposta (R$) *</Label>
              <Input
                id="proposta"
                type="number"
                step="0.01"
                min="0"
                value={proposta}
                onChange={(e) => setProposta(e.target.value)}
                placeholder="Ex: 150.00"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Digite o valor total que você cobraria por este trabalho
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva sua experiência, materiais necessários, tempo estimado, etc."
                className="mt-1"
                rows={4}
              />
            </div>
          </div>

          <Separator />

          {/* Botões */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !proposta}
              className="bg-gradient-primary"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar Candidatura
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateModal;