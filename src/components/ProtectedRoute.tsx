import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'montador' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const { toast } = useToast();
  const [montadorStatus, setMontadorStatus] = useState<string | null>(null);
  const [checkingMontador, setCheckingMontador] = useState(true);

  // Verificar status do montador
  useEffect(() => {
    const checkMontadorStatus = async () => {
      if (user && profile?.role === 'montador') {
        try {
          const { data: montadorData } = await supabase
            .from('montadores')
            .select('status_cadastro, motivo_reprovacao')
            .eq('user_id', user.id)
            .single();

          if (montadorData) {
            if (montadorData.status_cadastro === 'pendente') {
              await signOut();
              toast({
                title: "Cadastro pendente de aprovação",
                description: "Seu cadastro está em análise. Você receberá um e-mail quando for aprovado.",
                variant: "destructive"
              });
              setMontadorStatus('pendente');
            } else if (montadorData.status_cadastro === 'reprovado') {
              await signOut();
              toast({
                title: "Cadastro não aprovado",
                description: montadorData.motivo_reprovacao || "Seu cadastro não foi aprovado.",
                variant: "destructive"
              });
              setMontadorStatus('reprovado');
            } else {
              setMontadorStatus('aprovado');
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status do montador:', error);
        }
      }
      setCheckingMontador(false);
    };

    if (!authLoading && !profileLoading) {
      checkMontadorStatus();
    }
  }, [user, profile, authLoading, profileLoading, signOut, toast]);

  // Durante o loading, apenas mostrar um spinner discreto
  if (authLoading || profileLoading || checkingMontador) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se montador não aprovado, redirecionar para login
  if (montadorStatus === 'pendente' || montadorStatus === 'reprovado') {
    return <Navigate to="/login" replace />;
  }

  // Só redireciona para login após confirmar que NÃO há usuário
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Verificar role e redirecionar se necessário
  if (requiredRole && profile?.role !== requiredRole) {
    const dashboardMap = {
      'client': '/cliente',
      'montador': '/montador', 
      'admin': '/admin'
    };
    
    const correctDashboard = profile?.role ? dashboardMap[profile.role] : '/login';
    return <Navigate to={correctDashboard} replace />;
  }

  return <>{children}</>;
}