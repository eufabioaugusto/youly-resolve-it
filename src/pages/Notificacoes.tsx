import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationCard, { NotificationData } from '@/components/NotificationCard';
import NotificationFilters, { NotificationFilter } from '@/components/NotificationFilters';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

const ITEMS_PER_PAGE = 20;

interface GroupedNotifications {
  hoje: NotificationData[];
  ontem: NotificationData[];
  estaSemana: NotificationData[];
  esteMes: NotificationData[];
  anteriores: NotificationData[];
}

const Notificacoes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('todos');
  const [unreadCount, setUnreadCount] = useState(0);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const userRole = profile?.role === 'montador' ? 'montador' : 'cliente';

  const fetchNotifications = useCallback(async (pageNum: number, filter: NotificationFilter, reset = false) => {
    if (!user) return;
    
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const offset = pageNum * ITEMS_PER_PAGE;
      
      let query = supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);
      
      if (filter !== 'todos') {
        query = query.eq('tipo', filter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const typedData = (data || []) as NotificationData[];
      
      if (reset) {
        setNotifications(typedData);
      } else {
        setNotifications(prev => [...prev, ...typedData]);
      }
      
      setHasMore(typedData.length === ITEMS_PER_PAGE);
      
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as notificações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, toast]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lida', false);
    
    if (!error) {
      setUnreadCount(count || 0);
    }
  }, [user]);

  // Carregar inicial
  useEffect(() => {
    setPage(0);
    fetchNotifications(0, activeFilter, true);
    fetchUnreadCount();
  }, [activeFilter, fetchNotifications, fetchUnreadCount]);

  // Infinite scroll
  useEffect(() => {
    if (loadMoreRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchNotifications(nextPage, activeFilter);
          }
        },
        { threshold: 0.1 }
      );
      
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, activeFilter, fetchNotifications]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('notificacoes-page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as NotificationData;
          
          // Verificar se passa o filtro atual
          if (activeFilter === 'todos' || newNotification.tipo === activeFilter) {
            setNotifications(prev => [newNotification, ...prev]);
          }
          
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeFilter]);

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificationId);
    
    if (!error) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lida: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', user?.id)
      .eq('lida', false);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);
      toast({
        title: 'Pronto!',
        description: 'Todas as notificações foram marcadas como lidas'
      });
    }
  };

  const groupNotifications = (notifications: NotificationData[]): GroupedNotifications => {
    const groups: GroupedNotifications = {
      hoje: [],
      ontem: [],
      estaSemana: [],
      esteMes: [],
      anteriores: []
    };
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      
      if (isToday(date)) {
        groups.hoje.push(notification);
      } else if (isYesterday(date)) {
        groups.ontem.push(notification);
      } else if (isThisWeek(date)) {
        groups.estaSemana.push(notification);
      } else if (isThisMonth(date)) {
        groups.esteMes.push(notification);
      } else {
        groups.anteriores.push(notification);
      }
    });
    
    return groups;
  };

  const grouped = groupNotifications(notifications);

  const renderGroup = (title: string, items: NotificationData[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-2">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map(notification => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              userRole={userRole}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Notificações</h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Marcar todas</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="sticky top-[65px] z-40 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter);
              setPage(0);
            }}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-1">Nenhuma notificação</h2>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'todos' 
                ? 'Você ainda não recebeu nenhuma notificação'
                : `Nenhuma notificação de ${activeFilter} encontrada`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderGroup('Hoje', grouped.hoje)}
            {renderGroup('Ontem', grouped.ontem)}
            {renderGroup('Esta semana', grouped.estaSemana)}
            {renderGroup('Este mês', grouped.esteMes)}
            {renderGroup('Anteriores', grouped.anteriores)}
            
            {/* Load more trigger */}
            <div ref={loadMoreRef} className="py-4">
              {loadingMore && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {!hasMore && notifications.length > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Você viu todas as notificações
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Notificacoes;
