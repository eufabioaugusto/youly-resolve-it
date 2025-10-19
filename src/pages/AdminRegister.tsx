import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminRegister() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminExists, setAdminExists] = useState<boolean | null>(null);
  
  const { signUp, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const dashboardMap = {
        'client': '/cliente',
        'montador': '/montador',
        'admin': '/admin'
      };
      const correctDashboard = dashboardMap[profile.role];
      if (correctDashboard) {
        navigate(correctDashboard);
      }
    }
  }, [user, profile, navigate]);

  // 🔐 SEGURANÇA: Verificar se admin existe usando user_roles
  useEffect(() => {
    const checkAdminExists = async () => {
      try {
        // Verificar na tabela user_roles (mais seguro)
        const { data, error } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'admin')
          .limit(1);

        if (error) throw error;
        setAdminExists(data && data.length > 0);
      } catch (error) {
        console.error('Error checking admin existence:', error);
        setAdminExists(true); // Assume admin exists para segurança
      }
    };

    checkAdminExists();
  }, []);

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminExists) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Já existe um administrador no sistema. Apenas administradores existentes podem criar novos administradores.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Criar usuário via auth
      const { error: signUpError } = await signUp(email, password, {
        nome,
        role: 'admin'
      });

      if (signUpError) {
        toast({
          variant: "destructive",
          title: "Erro no cadastro",
          description: signUpError.message,
        });
        return;
      }

      // 2. ✅ Sucesso - O trigger do banco criará o profile e podemos confiar que o user foi criado
      toast({
        title: "Administrador criado!",
        description: "Verifique seu email para confirmar a conta. Após confirmar, o sistema atribuirá permissões de admin automaticamente.",
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro interno do servidor",
      });
    } finally {
      setLoading(false);
    }
  };

  if (adminExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96 shadow-glow border-0 bg-white">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center animate-pulse mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <p className="text-muted-foreground">Verificando sistema...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-glow border-0 bg-white">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Já existe um administrador no sistema. Para criar novos administradores, 
                faça login como admin existente e use a interface de promoção de usuários.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                className="flex-1"
              >
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-glow border-0 bg-white">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
          
          <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Criar Primeiro Admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure o primeiro administrador do sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdminRegister} className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Esta página só está disponível quando nenhum administrador existe no sistema.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Senha segura"
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Administrador"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}