import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';

interface OSCardProps {
  ordemServico: any;
  onAbrirOS: (os: any) => void;
}

export function OSCard({ ordemServico, onAbrirOS }: OSCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { variant: 'secondary' as const, text: 'Agendado', icon: Calendar },
      a_caminho: { variant: 'default' as const, text: 'A Caminho', icon: Clock },
      iniciada: { variant: 'default' as const, text: 'Em Andamento', icon: AlertCircle },
      concluida: { variant: 'default' as const, text: 'Concluída', icon: CheckCircle },
      concluida_com_assistencia: { variant: 'secondary' as const, text: 'Com Assistência', icon: AlertCircle },
      pendente_pecas: { variant: 'destructive' as const, text: 'Pendente Peças', icon: AlertCircle },
    };

    const config = statusConfig[status] || { variant: 'secondary' as const, text: status, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const formatData = (data: string | null | undefined) => {
    if (!data) return 'Data a definir';
    try {
      return new Date(data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Data a definir';
    }
  };

  const formatPeriodo = (periodo: string | null | undefined) => {
    if (!periodo) return 'A definir';
    return periodo === 'manha' ? 'Manhã (08h-12h)' : 'Tarde (13h-18h)';
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              {ordemServico.jobs?.descricao || 'Ordem de Serviço'}
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Cliente: {ordemServico.clientes?.profiles?.nome || 'Cliente'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {ordemServico.jobs?.endereco?.cidade}, {ordemServico.jobs?.endereco?.estado}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatData(ordemServico.data_hora_agendamento)} - {formatPeriodo(ordemServico.periodo_agendamento)}
              </div>
              {ordemServico.garantia_ativa && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-4 h-4" />
                  Garantia ativa até {formatData(ordemServico.data_expiracao_garantia)}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(ordemServico.status)}
            {ordemServico.codigo_validacao && ordemServico.status !== 'concluida' && (
              <div className="mt-2 text-xs text-muted-foreground">
                Código: <span className="font-mono font-bold">******</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => onAbrirOS(ordemServico)}
            className="bg-gradient-primary"
            size="sm"
          >
            Gerenciar OS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
