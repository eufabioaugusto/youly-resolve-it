import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wrench, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ForgotPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-senha`,
    });
    
    if (error) {
      toast({
        title: "Erro ao enviar e-mail",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    toast({
      title: "E-mail enviado!",
      description: "Verifique sua caixa de entrada para redefinir sua senha."
    });
    
    setLoading(false);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao login
        </Link>
        
        <Card className="shadow-glow border-0 bg-white">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Recuperar senha</CardTitle>
            <CardDescription className="text-center">
              Digite seu e-mail para receber instruções de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
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
              
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-primary hover:shadow-glow"
              >
                {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
