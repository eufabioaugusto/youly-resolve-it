import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Briefcase, 
  MessageSquare, 
  DollarSign, 
  Wallet, 
  ClipboardCheck,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface NotificationData {
  id: string;
  user_id: string;
  tipo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
  metadata?: {
    job_id?: string;
    negociacao_id?: string;
    ordem_servico_id?: string;
    saque_id?: string;
    carteira_id?: string;
    pagamento_id?: string;
    [key: string]: any;
  };
}

interface NotificationCardProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => Promise<void>;
  userRole: 'cliente' | 'montador';
  compact?: boolean;
}

const NOTIFICATION_CONFIG = {
  job: {
    icon: Briefcase,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    label: 'Trabalho'
  },
  negociacao: {
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    label: 'Negociação'
  },
  pagamento: {
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    label: 'Pagamento'
  },
  saque: {
    icon: Wallet,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    label: 'Saque'
  },
  sistema: {
    icon: Bell,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    label: 'Sistema'
  },
  os: {
    icon: ClipboardCheck,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100',
    label: 'Ordem de Serviço'
  }
};

const NotificationCard = ({ 
  notification, 
  onMarkAsRead, 
  userRole,
  compact = false 
}: NotificationCardProps) => {
  const navigate = useNavigate();
  
  const config = NOTIFICATION_CONFIG[notification.tipo as keyof typeof NOTIFICATION_CONFIG] 
    || NOTIFICATION_CONFIG.sistema;
  
  const Icon = config.icon;
  
  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const handleClick = async () => {
    await onMarkAsRead(notification.id);
    
    const metadata = notification.metadata || {};
    
    // Navegar baseado no metadata e tipo de usuário
    if (metadata.ordem_servico_id) {
      navigate(`/${userRole}/os/${metadata.ordem_servico_id}`);
    } else if (metadata.job_id && metadata.negociacao_id) {
      navigate(`/${userRole}/negociacao/${metadata.job_id}`);
    } else if (metadata.job_id) {
      if (userRole === 'montador') {
        navigate('/trabalhos-disponiveis');
      } else {
        navigate(`/pedido/${metadata.job_id}/candidatos`);
      }
    } else if (metadata.negociacao_id) {
      navigate(`/${userRole}/negociacoes`);
    } else if (metadata.saque_id || metadata.carteira_id) {
      navigate('/montador#wallet');
    } else if (metadata.pagamento_id) {
      navigate(userRole === 'montador' ? '/montador#wallet' : '/cliente');
    } else {
      // Fallback baseado no tipo
      switch (notification.tipo) {
        case 'negociacao':
          navigate(`/${userRole}/negociacoes`);
          break;
        case 'pagamento':
        case 'saque':
          navigate(userRole === 'montador' ? '/montador#wallet' : '/cliente');
          break;
        case 'job':
          navigate(userRole === 'montador' ? '/trabalhos-disponiveis' : '/cliente');
          break;
        default:
          navigate(`/${userRole}`);
      }
    }
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg cursor-pointer transition-all duration-200",
        "hover:bg-muted/50 hover:shadow-sm",
        !notification.lida && "bg-primary/5 border-l-4 border-l-primary",
        notification.lida && "border-l-4 border-l-transparent",
        compact && "p-3"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={cn(
          "p-2 rounded-full shrink-0",
          config.bgColor
        )}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm leading-relaxed",
            !notification.lida ? "font-medium text-foreground" : "text-muted-foreground"
          )}>
            {notification.mensagem}
          </p>
          
          <div className="flex items-center gap-2 mt-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(notification.created_at)}
            </span>
            
            {!notification.lida && (
              <div className="w-2 h-2 bg-primary rounded-full ml-auto animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
