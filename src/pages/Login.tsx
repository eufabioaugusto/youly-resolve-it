import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Wrench, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { signIn, signOut, user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Pegar a URL de onde o usuário veio (ou dashboard padrão)
  const from = (location.state as any)?.from || null;

  // Verificar status do cadastro do montador após login
  useEffect(() => {
    const checkMontadorStatus = async () => {
      if (user && profile && profile.role === 'montador' && !authLoading && !profileLoading) {
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
          } else if (montadorData.status_cadastro === 'reprovado') {
            await signOut();
            toast({
              title: "Cadastro não aprovado",
              description: montadorData.motivo_reprovacao || "Seu cadastro não foi aprovado. Entre em contato com o suporte.",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    checkMontadorStatus();
  }, [user, profile, authLoading, profileLoading]);

  // Só redireciona se tiver usuário E perfil carregados
  // E NÃO está carregando
  if (user && profile && !authLoading && !profileLoading) {
    const dashboardMap = {
      'client': '/cliente',
      'montador': '/montador',
      'admin': '/admin'
    };
    
    // Redirecionar para onde estava OU para o dashboard
    const destination = from || dashboardMap[profile.role] || '/';
    return <Navigate to={destination} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      // Se for erro de "Email not confirmed", verificar se é montador pendente
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        toast({
          title: "Cadastro pendente",
          description: "Seu cadastro está aguardando aprovação. Você receberá um e-mail quando for aprovado.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        });
      }
      setLoading(false);
    } else {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando..."
      });
      // Não precisa setLoading(false) - o Navigate vai ocorrer
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
        
        <Card className="shadow-glow border-0 bg-white">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Entrar na YOULY</CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <Link to="#" className="text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-primary hover:shadow-glow"
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            
            <Separator />
            
            <div className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Cadastre-se
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;