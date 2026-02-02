import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

/**
 * Componente global que escuta notificações em tempo real
 * e exibe toasts para o usuário em qualquer página do app
 */
const GlobalNotificationListener = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as {
            id: string;
            tipo: string;
            mensagem: string;
          };
          
          // Evitar duplicatas
          if (lastNotificationId.current === newNotification.id) {
            return;
          }
          lastNotificationId.current = newNotification.id;
          
          // Determinar variante do toast baseada no tipo
          let variant: 'default' | 'destructive' | undefined = 'default';
          let title = 'Nova notificação';
          
          switch (newNotification.tipo) {
            case 'pagamento':
              title = '💰 Pagamento';
              break;
            case 'negociacao':
              title = '💬 Negociação';
              break;
            case 'job':
              title = '📋 Trabalho';
              break;
            case 'saque':
              title = '💸 Saque';
              break;
            case 'sistema':
              title = '🔔 Sistema';
              break;
            default:
              title = '🔔 Notificação';
          }
          
          // Exibir toast
          toast({
            title,
            description: newNotification.mensagem,
            variant,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Componente não renderiza nada visualmente
  return null;
};

export default GlobalNotificationListener;
