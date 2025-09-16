import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Wrench, ArrowLeft } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>
        
        <Card className="shadow-glow border-0">
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                className="h-11"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <Link to="#" className="text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            
            <Button className="w-full h-11 bg-gradient-primary hover:shadow-glow">
              Entrar
            </Button>
            
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