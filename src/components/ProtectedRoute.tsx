import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'client' | 'montador' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (!authLoading && !user && !redirected) {
      setRedirected(true);
    }
  }, [user, authLoading, redirected]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96 shadow-glow border-0">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse">
                <Wrench className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Carregando...</h2>
            <p className="text-muted-foreground">Verificando sua conta</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Redirecionar para dashboard correto baseado no role
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