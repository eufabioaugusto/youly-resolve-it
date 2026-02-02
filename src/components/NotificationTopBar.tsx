import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const NotificationTopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('lida', false);

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    fetchUnreadCount();

    // Realtime subscription
    const channel = supabase
      .channel('notification-bar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Check session storage for dismissed state
  useEffect(() => {
    const dismissed = sessionStorage.getItem('notification-bar-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('notification-bar-dismissed', 'true');
  };

  const handleClick = () => {
    const userRole = profile?.role === 'montador' ? 'montador' : 'cliente';
    navigate(`/${userRole}/notificacoes`);
  };

  // Don't show if dismissed, no user, or no unread notifications
  if (isDismissed || !user || unreadCount === 0 || !isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-[200] transition-all duration-300",
        "bg-gradient-to-r from-primary via-primary to-primary/90",
        "backdrop-blur-sm border-b border-primary-foreground/10"
      )}
    >
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between py-2 px-4">
          <button
            onClick={handleClick}
            className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition-opacity flex-1"
          >
            <Bell className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">
              Você tem {unreadCount} {unreadCount === 1 ? 'notificação importante' : 'notificações importantes'}
            </span>
            <span className="text-xs opacity-80 hidden sm:inline">
              — Toque para ver
            </span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-primary-foreground/10 transition-colors text-primary-foreground"
            aria-label="Fechar barra de notificações"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationTopBar;
