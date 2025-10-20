import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface TimeoutMonitorProps {
  dataExpiracao: string;
  onExpired?: () => void;
}

export function TimeoutMonitor({ dataExpiracao, onExpired }: TimeoutMonitorProps) {
  const [tempoRestante, setTempoRestante] = useState<number>(0);
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    const calcularTempoRestante = () => {
      const agora = new Date().getTime();
      const expiracao = new Date(dataExpiracao).getTime();
      const diferenca = expiracao - agora;

      if (diferenca <= 0) {
        setExpirado(true);
        setTempoRestante(0);
        onExpired?.();
        return;
      }

      setTempoRestante(Math.floor(diferenca / 1000)); // segundos
    };

    calcularTempoRestante();
    const interval = setInterval(calcularTempoRestante, 1000);

    return () => clearInterval(interval);
  }, [dataExpiracao, onExpired]);

  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const obterCor = () => {
    const minutos = Math.floor(tempoRestante / 60);
    if (minutos > 20) return 'bg-green-500';
    if (minutos > 10) return 'bg-yellow-500 animate-pulse';
    return 'bg-red-500 animate-pulse';
  };

  if (expirado) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tempo esgotado! Este pedido será redirecionado ao administrador.
        </AlertDescription>
      </Alert>
    );
  }

  const minutos = Math.floor(tempoRestante / 60);
  const critico = minutos < 10;

  return (
    <div className="space-y-2">
      <div className="flex justify-end items-center gap-2">
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <Badge 
                variant={critico ? "destructive" : "secondary"} 
                className={`text-xs px-2 py-1 ${critico ? 'animate-pulse' : ''}`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {formatarTempo(tempoRestante)}
              </Badge>
              <Info className="w-3 h-3 text-muted-foreground" />
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="left" align="start">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">⏰ Sobre o Cronômetro</h4>
              <p className="text-sm text-muted-foreground">
                Esse é o tempo para o serviço ficar disponível aos entregadores. 
                Não se preocupe, se não houver nenhum candidato sua solicitação vai direto 
                para nosso time de montadores. Basta aguardar.
              </p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      
      {critico && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Atenção! Você tem menos de {minutos} minutos para responder.
          </AlertDescription>
        </Alert>
      )}

      {/* Barra de progresso visual */}
      <div className="w-full bg-secondary/30 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${obterCor()}`}
          style={{ width: `${(tempoRestante / 2400) * 100}%` }} // 40 min = 2400 seg
        />
      </div>
    </div>
  );
}
