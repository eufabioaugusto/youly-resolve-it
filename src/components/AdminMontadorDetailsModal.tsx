import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, XCircle, User, Phone, Mail, MapPin, FileText, Image as ImageIcon } from 'lucide-react';

interface MontadorDetails {
  id: string;
  user_id: string;
  nome: string;
  telefone?: string;
  documento?: string;
  documento_foto_url?: string;
  endereco?: any;
  especialidades?: string[];
  preco_hora?: number;
  status_cadastro: string;
  created_at: string;
}

interface AdminMontadorDetailsModalProps {
  montador: MontadorDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AdminMontadorDetailsModal({ 
  montador, 
  open, 
  onOpenChange,
  onSuccess 
}: AdminMontadorDetailsModalProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  if (!montador) return null;

  const handleAprovar = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase.rpc('aprovar_cadastro_montador', {
        p_montador_id: montador.id,
        p_admin_user_id: user.id
      });

      if (error) throw error;

      toast.success('Cadastro aprovado com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao aprovar cadastro:', error);
      toast.error('Erro ao aprovar cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleReprovar = async () => {
    if (!motivo.trim()) {
      toast.error('Informe o motivo da reprovação');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase.rpc('reprovar_cadastro_montador', {
        p_montador_id: montador.id,
        p_admin_user_id: user.id,
        p_motivo: motivo
      });

      if (error) throw error;

      toast.success('Cadastro reprovado');
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao reprovar cadastro:', error);
      toast.error('Erro ao reprovar cadastro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Cadastro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Badge variant={montador.status_cadastro === 'pendente' ? 'secondary' : 'default'}>
              {montador.status_cadastro}
            </Badge>
          </div>

          {/* Informações Pessoais */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações Pessoais
            </h3>
            <div className="grid gap-2 text-sm">
              <p><strong>Nome:</strong> {montador.nome}</p>
              {montador.telefone && <p><strong>Telefone:</strong> {montador.telefone}</p>}
              {montador.documento && <p><strong>Documento:</strong> {montador.documento}</p>}
              <p><strong>Cadastrado em:</strong> {new Date(montador.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

          {/* Endereço */}
          {montador.endereco && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço
              </h3>
              <div className="text-sm">
                <p>{montador.endereco.logradouro}, {montador.endereco.numero}</p>
                {montador.endereco.complemento && <p>{montador.endereco.complemento}</p>}
                <p>{montador.endereco.bairro} - {montador.endereco.cidade}/{montador.endereco.estado}</p>
                <p>CEP: {montador.endereco.cep}</p>
              </div>
            </div>
          )}

          {/* Especialidades */}
          {montador.especialidades && montador.especialidades.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Especialidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {montador.especialidades.map((esp, index) => (
                  <Badge key={index} variant="outline">{esp}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preço por Hora */}
          {montador.preco_hora && (
            <div className="space-y-3">
              <h3 className="font-semibold">Preço por Hora</h3>
              <p className="text-lg font-semibold text-primary">
                R$ {montador.preco_hora.toFixed(2)}
              </p>
            </div>
          )}

          {/* Documento (Foto) */}
          {montador.documento_foto_url && (
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Documento Enviado
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={montador.documento_foto_url} 
                  alt="Documento do montador" 
                  className="w-full h-auto"
                />
              </div>
              <a 
                href={montador.documento_foto_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Abrir em tamanho real
              </a>
            </div>
          )}

          {/* Ações de Aprovação/Reprovação */}
          {montador.status_cadastro === 'pendente' && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Motivo da Reprovação (opcional)
                </label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo caso vá reprovar o cadastro..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAprovar}
                  disabled={loading}
                  className="flex-1"
                  variant="default"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar Cadastro
                </Button>
                <Button
                  onClick={handleReprovar}
                  disabled={loading || !motivo.trim()}
                  className="flex-1"
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reprovar Cadastro
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
