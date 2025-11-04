import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, Clock, DollarSign, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationsRealtime } from "@/hooks/useNotificationsRealtime";

interface NotificationCenterProps {
  variant?: 'floating' | 'header';
}

const NotificationCenter = ({ variant = 'floating' }: NotificationCenterProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsRealtime();
  const [open, setOpen] = useState(false);

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case 'negociacao':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'pagamento':
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'saque':
        return <DollarSign className="w-4 h-4 text-orange-500" />;
      case 'job':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'conclusao':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'sistema':
        return <Bell className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    
    const metadata = notification.metadata || {};
    
    // Determinar se é montador ou cliente baseado na URL atual
    const userRole = window.location.pathname.includes('/montador') ? 'montador' : 'cliente';
    
    // Navegar baseado no metadata e tipo de usuário
    if (metadata.ordem_servico_id) {
      // Ordem de serviço - navegar diretamente
      if (userRole === 'montador') {
        navigate(`/montador/os/${metadata.ordem_servico_id}`);
      } else {
        navigate(`/cliente/os/${metadata.ordem_servico_id}`);
      }
    } else if (metadata.negociacao_id && metadata.job_id) {
      // Negociação específica confirmada - ir para a página da negociação
      if (userRole === 'montador') {
        navigate(`/montador/negociacao/${metadata.job_id}`);
      } else {
        navigate(`/cliente/negociacao/${metadata.job_id}`);
      }
    } else if (metadata.negociacao_id) {
      // Negociação sem job_id - ir para lista de negociações
      if (userRole === 'montador') {
        navigate('/montador/negociacoes');
      } else {
        navigate('/cliente/negociacoes');
      }
    } else if (metadata.job_id) {
      // Job sem negociacao_id - ir para candidatos (cliente) ou trabalhos (montador)
      if (userRole === 'montador') {
        navigate('/trabalhos-disponiveis');
      } else {
        // Cliente vai para página de candidatos do job
        navigate(`/pedido/${metadata.job_id}/candidatos`);
      }
    } else if (metadata.saque_id) {
      // Saque - só montadores têm carteira
      navigate('/montador#wallet');
    } else if (metadata.carteira_id) {
      // Carteira - só montadores
      navigate('/montador#wallet');
    } else if (metadata.pagamento_id) {
      // Pagamento
      if (userRole === 'montador') {
        navigate('/montador#wallet');
      } else {
        navigate('/cliente');
      }
    } else {
      // Fallback baseado no tipo de notificação
      switch (notification.tipo) {
        case 'negociacao':
          if (userRole === 'montador') {
            navigate('/montador/negociacoes');
          } else {
            navigate('/cliente/negociacoes');
          }
          break;
        case 'pagamento':
          if (userRole === 'montador') {
            navigate('/montador#wallet');
          } else {
            navigate('/cliente');
          }
          break;
        case 'saque':
          navigate('/montador#wallet');
          break;
        case 'job':
          if (userRole === 'montador') {
            navigate('/trabalhos-disponiveis');
          } else {
            navigate('/cliente');
          }
          break;
        case 'sistema':
          // Notificação de sistema - direcionar para dashboard
          if (userRole === 'montador') {
            navigate('/montador');
          } else {
            navigate('/cliente');
          }
          break;
        default:
          if (userRole === 'montador') {
            navigate('/montador');
          } else {
            navigate('/cliente');
          }
          break;
      }
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size={variant === 'header' ? 'icon' : 'sm'} 
          className="relative"
        >
          <Bell className={variant === 'header' ? 'w-4 h-4' : 'w-5 h-5'} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 -right-1 rounded-full p-0 flex items-center justify-center text-xs ${
                variant === 'header' ? 'h-5 w-5' : 'h-5 w-5'
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Card className="shadow-none border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificações</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            {unreadCount > 0 && (
              <CardDescription>
                {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
              </CardDescription>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação ainda</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div 
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notification.lida ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.tipo)}
                          <div className="flex-1 space-y-1">
                            <p className={`text-sm ${
                              !notification.lida ? 'font-medium' : 'font-normal'
                            }`}>
                              {notification.mensagem}
                            </p>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatDate(notification.created_at)}
                              </span>
                              {!notification.lida && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator className="my-1" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;