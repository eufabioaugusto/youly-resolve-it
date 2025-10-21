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

  // Durante o loading, apenas mostrar um spinner discreto
  // NÃO redirecionar para nada - manter a URL atual
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Só redireciona para login após confirmar que NÃO há usuário
  // E salva a URL atual para retornar depois
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