import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DataSelecaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasDisponiveis: Array<{ data: string; periodo: string }>;
  onConfirmar: (dataSelecionada: { data: string; periodo: string }) => void;
  loading?: boolean;
}

export function DataSelecaoModal({
  open,
  onOpenChange,
  datasDisponiveis,
  onConfirmar,
  loading = false,
}: DataSelecaoModalProps) {
  const [dataSelecionada, setDataSelecionada] = useState<string>('');

  const handleConfirmar = () => {
    if (!dataSelecionada) return;
    
    const [data, periodo] = dataSelecionada.split('|');
    onConfirmar({ data, periodo });
  };

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dataStr;
    }
  };

  const formatarPeriodo = (periodo: string) => {
    const periodos: Record<string, string> = {
      'manha': 'Manhã (8h - 12h)',
      'tarde': 'Tarde (13h - 18h)',
      'dia_todo': 'Dia todo (8h - 18h)',
    };
    return periodos[periodo] || periodo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selecione a data da montagem</DialogTitle>
          <DialogDescription>
            Escolha uma das datas propostas pelo cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={dataSelecionada} onValueChange={setDataSelecionada}>
            {datasDisponiveis.map((opcao, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={`${opcao.data}|${opcao.periodo}`} id={`opcao-${index}`} />
                <Label 
                  htmlFor={`opcao-${index}`}
                  className="flex-1 cursor-pointer border rounded-lg p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{formatarData(opcao.data)}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {formatarPeriodo(opcao.periodo)}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={!dataSelecionada || loading}
          >
            {loading ? 'Confirmando...' : 'Confirmar Data'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
