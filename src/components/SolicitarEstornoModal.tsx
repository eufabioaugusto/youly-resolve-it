import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useEstorno, MOTIVO_CATEGORIAS, PermissaoEstorno, EstornoMotivoCategoria } from '@/hooks/useEstorno';
import { formatCurrency } from '@/lib/utils';

interface SolicitarEstornoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pagamentoId: string;
  valorOriginal: number;
  jobDescricao?: string;
  onSuccess?: () => void;
}

export function SolicitarEstornoModal({
  open,
  onOpenChange,
  pagamentoId,
  valorOriginal,
  jobDescricao,
  onSuccess
}: SolicitarEstornoModalProps) {
  const { verificarPermissao, solicitarEstorno, loading } = useEstorno();
  
  const [permissao, setPermissao] = useState<PermissaoEstorno | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [motivoCategoria, setMotivoCategoria] = useState<EstornoMotivoCategoria | ''>('');
  const [valorEstorno, setValorEstorno] = useState<string>('');
  const [usarValorTotal, setUsarValorTotal] = useState(true);

  useEffect(() => {
    if (open && pagamentoId) {
      verificarPermissaoEstorno();
    }
  }, [open, pagamentoId]);

  const verificarPermissaoEstorno = async () => {
    setVerificando(true);
    const resultado = await verificarPermissao(pagamentoId);
    setPermissao(resultado);
    setVerificando(false);
  };

  const handleSubmit = async () => {
    if (!motivoCategoria || motivo.length < 10) return;

    const valor = usarValorTotal ? undefined : parseFloat(valorEstorno);
    
    const resultado = await solicitarEstorno({
      pagamentoId,
      motivo,
      motivoCategoria: motivoCategoria as EstornoMotivoCategoria,
      valorEstorno: valor
    });

    if (resultado?.sucesso) {
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setMotivo('');
      setMotivoCategoria('');
      setValorEstorno('');
      setUsarValorTotal(true);
    }
  };

  const valorMaximo = permissao?.percentual_maximo 
    ? valorOriginal * (permissao.percentual_maximo / 100)
    : valorOriginal;

  const valorFinal = usarValorTotal 
    ? valorMaximo 
    : Math.min(parseFloat(valorEstorno) || 0, valorMaximo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Solicitar Estorno
          </DialogTitle>
          <DialogDescription>
            {jobDescricao ? `Serviço: ${jobDescricao.substring(0, 60)}...` : 'Solicitar estorno do pagamento'}
          </DialogDescription>
        </DialogHeader>

        {verificando ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Verificando permissões...</span>
          </div>
        ) : permissao && !permissao.permitido ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {permissao.motivo}
            </AlertDescription>
          </Alert>
        ) : permissao ? (
          <div className="space-y-4">
            {/* Status da permissão */}
            <Alert variant={permissao.requer_aprovacao ? 'default' : 'default'} className="border-primary/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{permissao.motivo}</span>
                {permissao.requer_aprovacao ? (
                  <Badge variant="secondary">Requer aprovação</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-600">Automático</Badge>
                )}
              </AlertDescription>
            </Alert>

            {/* Valor */}
            <div className="space-y-2">
              <Label>Valor do Estorno</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={usarValorTotal ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUsarValorTotal(true)}
                >
                  Total ({formatCurrency(valorMaximo)})
                </Button>
                <Button
                  type="button"
                  variant={!usarValorTotal ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUsarValorTotal(false)}
                >
                  Parcial
                </Button>
              </div>
              
              {!usarValorTotal && (
                <div className="mt-2">
                  <Input
                    type="number"
                    placeholder="Valor do estorno"
                    value={valorEstorno}
                    onChange={(e) => setValorEstorno(e.target.value)}
                    min={0.01}
                    max={valorMaximo}
                    step={0.01}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo permitido: {formatCurrency(valorMaximo)}
                    {permissao.percentual_maximo && permissao.percentual_maximo < 100 && 
                      ` (${permissao.percentual_maximo}% do valor original)`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Categoria do motivo */}
            <div className="space-y-2">
              <Label>Categoria do Motivo *</Label>
              <Select value={motivoCategoria} onValueChange={(v) => setMotivoCategoria(v as EstornoMotivoCategoria)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo principal" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVO_CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descrição detalhada */}
            <div className="space-y-2">
              <Label>Descrição Detalhada * (mínimo 10 caracteres)</Label>
              <Textarea
                placeholder="Descreva o motivo do estorno em detalhes..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {motivo.length}/10 caracteres mínimos
              </p>
            </div>

            {/* Resumo */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">Resumo do Estorno</h4>
              <div className="flex justify-between text-sm">
                <span>Valor original:</span>
                <span>{formatCurrency(valorOriginal)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span>Valor a estornar:</span>
                <span className="text-destructive">{formatCurrency(valorFinal)}</span>
              </div>
              {permissao.requer_aprovacao && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⚠️ Esta solicitação será analisada por um administrador antes do processamento.
                </p>
              )}
            </div>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erro ao verificar permissões. Tente novamente.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={
              loading || 
              verificando || 
              !permissao?.permitido || 
              !motivoCategoria || 
              motivo.length < 10 ||
              (!usarValorTotal && (!valorEstorno || parseFloat(valorEstorno) <= 0))
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Solicitar Estorno
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
