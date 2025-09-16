import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, ArrowLeft, Users, Wrench as WorkerIcon } from "lucide-react";
import { useState, useEffect } from "react";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("client");
  
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "worker") {
      setActiveTab("worker");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
            <CardTitle className="text-2xl text-center">Criar conta na YOULY</CardTitle>
            <CardDescription className="text-center">
              Escolha como você quer usar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Cliente
                </TabsTrigger>
                <TabsTrigger value="worker" className="flex items-center gap-2">
                  <WorkerIcon className="w-4 h-4" />
                  Montador
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="client" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="client-name">Nome completo</Label>
                  <Input 
                    id="client-name" 
                    placeholder="Seu nome completo"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-email">E-mail</Label>
                  <Input 
                    id="client-email" 
                    type="email" 
                    placeholder="seu@email.com"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-phone">Telefone</Label>
                  <Input 
                    id="client-phone" 
                    placeholder="(11) 99999-9999"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-password">Senha</Label>
                  <Input 
                    id="client-password" 
                    type="password" 
                    placeholder="Mínimo 8 caracteres"
                    className="h-11"
                  />
                </div>
                
                <Button className="w-full h-11 bg-gradient-primary hover:shadow-glow">
                  Criar conta como Cliente
                </Button>
              </TabsContent>
              
              <TabsContent value="worker" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="worker-name">Nome completo</Label>
                  <Input 
                    id="worker-name" 
                    placeholder="Seu nome completo"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-email">E-mail</Label>
                  <Input 
                    id="worker-email" 
                    type="email" 
                    placeholder="seu@email.com"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-phone">Telefone</Label>
                  <Input 
                    id="worker-phone" 
                    placeholder="(11) 99999-9999"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-cpf">CPF</Label>
                  <Input 
                    id="worker-cpf" 
                    placeholder="000.000.000-00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Valor por hora (R$)</Label>
                  <Input 
                    id="hourly-rate" 
                    placeholder="45,00"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-bio">Experiência profissional</Label>
                  <Textarea 
                    id="worker-bio" 
                    placeholder="Conte sobre sua experiência com montagem de móveis..."
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker-password">Senha</Label>
                  <Input 
                    id="worker-password" 
                    type="password" 
                    placeholder="Mínimo 8 caracteres"
                    className="h-11"
                  />
                </div>
                
                <Button className="w-full h-11 bg-gradient-primary hover:shadow-glow">
                  Criar conta como Montador
                </Button>
              </TabsContent>
            </Tabs>
            
            <Separator className="my-6" />
            
            <div className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Fazer login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;