import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'montador' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Durante o loading inicial, não redirecionar - apenas esperar
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Só redireciona para login após confirmar que NÃO há usuário
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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