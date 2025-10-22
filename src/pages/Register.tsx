import { Link, useSearchParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Wrench, ArrowLeft, Users, Wrench as WorkerIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { phoneMask, cpfMask, removeMask, validateCPF, validatePhone } from "@/lib/masks";

const Register = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("client");
  const { signUp, user } = useAuth();
  const { profile, createMontadorProfile, createClienteProfile } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [workerForm, setWorkerForm] = useState({
    name: '', email: '', phone: '', cpf: '', hourlyRate: '', password: '', documentoFoto: null as File | null
  });
  
  useEffect(() => {
    const type = searchParams.get("type");
    if (type === "worker") {
      setActiveTab("worker");
    }
  }, [searchParams]);

  // Redirect se já estiver logado
  if (user && profile) {
    const dashboardMap = {
      'client': '/cliente',
      'montador': '/montador',
      'admin': '/admin'
    };
    return <Navigate to={dashboardMap[profile.role] || '/'} replace />;
  }

  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(clientForm.email, clientForm.password, {
      role: 'client',
      nome: clientForm.name,
      telefone: removeMask(clientForm.phone)
    });
    
    if (error) {
      let errorMessage = error.message;
      
      // Verificar se é erro de e-mail duplicado (apenas do Auth do Supabase)
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este e-mail já existe como usuário. Use um e-mail diferente.';
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu e-mail para confirmar a conta."
      });
    }
    
    setLoading(false);
  };

  const handleWorkerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Validações
    if (!validatePhone(workerForm.phone)) {
      toast({ title: "Telefone inválido", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!validateCPF(workerForm.cpf)) {
      toast({ title: "CPF inválido", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!workerForm.documentoFoto) {
      toast({ title: "Envie a foto do documento", variant: "destructive" });
      setLoading(false);
      return;
    }
    
    try {
      // 1. Criar conta PRIMEIRO (sem documento_foto_url ainda)
      const { error: signUpError } = await signUp(workerForm.email, workerForm.password, {
        role: 'montador', 
        nome: workerForm.name,
        telefone: removeMask(workerForm.phone),
        documento: removeMask(workerForm.cpf),
        preco_hora: workerForm.hourlyRate ? parseFloat(workerForm.hourlyRate) : null
      });
      
      if (signUpError) throw signUpError;

      // 2. Fazer login automático para ter autenticação
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: workerForm.email,
        password: workerForm.password
      });

      if (signInError) throw signInError;

      // 3. Agora que está autenticado, fazer upload do documento
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(`documentos/${Date.now()}-${workerForm.documentoFoto.name}`, workerForm.documentoFoto);
      
      if (uploadError) throw uploadError;

      const documentoUrl = supabase.storage.from('profile-photos').getPublicUrl(uploadData.path).data.publicUrl;

      // 4. Atualizar o registro do montador com a URL do documento
      const { error: updateError } = await supabase
        .from('montadores')
        .update({ documento_foto_url: documentoUrl })
        .eq('user_id', sessionData.user.id);

      if (updateError) throw updateError;

      // 5. Fazer logout para que ele precise confirmar email
      await supabase.auth.signOut();

      toast({
        title: "Cadastro realizado!",
        description: "Em até 48 horas você receberá a resposta sobre sua conta."
      });
    } catch (error: any) {
      let errorMessage = error.message;
      
      // Verificar se é erro de e-mail duplicado (apenas do Auth do Supabase)
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este e-mail já existe como usuário. Use um e-mail diferente.';
      }
      
      toast({
        title: "Erro ao criar conta",
        description: errorMessage,
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
                <form onSubmit={handleClientRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nome completo</Label>
                    <Input 
                      id="client-name" 
                      placeholder="Seu nome completo"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({...clientForm, name: e.target.value})}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-email">E-mail</Label>
                    <Input 
                      id="client-email" 
                      type="email" 
                      placeholder="seu@email.com"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-phone">Telefone</Label>
                     <Input 
                       id="client-phone" 
                       placeholder="(11) 9 0000-0000"
                       value={clientForm.phone}
                       onChange={(e) => {
                         const maskedValue = phoneMask(e.target.value);
                         setClientForm({...clientForm, phone: maskedValue});
                       }}
                       className="h-11"
                       maxLength={16}
                     />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-password">Senha</Label>
                    <Input 
                      id="client-password" 
                      type="password" 
                      placeholder="Mínimo 8 caracteres"
                      value={clientForm.password}
                      onChange={(e) => setClientForm({...clientForm, password: e.target.value})}
                      className="h-11"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-primary hover:shadow-glow"
                  >
                    {loading ? "Criando conta..." : "Criar conta como Cliente"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="worker" className="space-y-4 mt-6">
                <form onSubmit={handleWorkerRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="worker-name">Nome completo</Label>
                    <Input 
                      id="worker-name" 
                      placeholder="Seu nome completo"
                      value={workerForm.name}
                      onChange={(e) => setWorkerForm({...workerForm, name: e.target.value})}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worker-email">E-mail</Label>
                    <Input 
                      id="worker-email" 
                      type="email" 
                      placeholder="seu@email.com"
                      value={workerForm.email}
                      onChange={(e) => setWorkerForm({...workerForm, email: e.target.value})}
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worker-phone">Telefone</Label>
                     <Input 
                       id="worker-phone" 
                       placeholder="(11) 9 0000-0000"
                       value={workerForm.phone}
                       onChange={(e) => {
                         const maskedValue = phoneMask(e.target.value);
                         setWorkerForm({...workerForm, phone: maskedValue});
                       }}
                       className="h-11"
                       maxLength={16}
                     />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worker-cpf">CPF</Label>
                     <Input 
                       id="worker-cpf" 
                       placeholder="000.000.000-00"
                       value={workerForm.cpf}
                       onChange={(e) => {
                         const maskedValue = cpfMask(e.target.value);
                         setWorkerForm({...workerForm, cpf: maskedValue});
                       }}
                       className="h-11"
                       maxLength={14}
                     />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly-rate">Valor por hora (R$)</Label>
                    <Input 
                      id="hourly-rate" 
                      type="number"
                      placeholder="45,00"
                      value={workerForm.hourlyRate}
                      onChange={(e) => setWorkerForm({...workerForm, hourlyRate: e.target.value})}
                      className="h-11"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documento-foto">Foto do Documento (RG ou CNH) *</Label>
                    <Input 
                      id="documento-foto" 
                      type="file"
                      accept="image/*"
                      onChange={(e) => setWorkerForm({...workerForm, documentoFoto: e.target.files?.[0] || null})}
                      className="h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground">Envie uma foto clara do seu documento para aprovação</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worker-password">Senha</Label>
                    <Input 
                      id="worker-password" 
                      type="password" 
                      placeholder="Mínimo 8 caracteres"
                      value={workerForm.password}
                      onChange={(e) => setWorkerForm({...workerForm, password: e.target.value})}
                      className="h-11"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-primary hover:shadow-glow"
                  >
                    {loading ? "Criando conta..." : "Criar conta como Montador"}
                  </Button>
                </form>
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