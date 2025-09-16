import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, User, MapPin, Phone, FileText, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const especialidadesDisponiveis = [
  "guarda-roupa",
  "mesa", 
  "cama",
  "estante",
  "rack",
  "armario",
  "escrivaninha",
  "comoda",
  "sapateira",
  "outros"
];

const MontadorProfile = () => {
  const { profile, montadorProfile, loading, refetch } = useProfile();
  const { toast } = useToast();
  
  // Form states
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [precoHora, setPrecoHora] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [endereco, setEndereco] = useState({
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    cep: "",
    estado: ""
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile && montadorProfile) {
      setNome(profile.nome || "");
      setTelefone(profile.telefone || "");
      setDocumento(profile.documento || "");
      setPrecoHora(montadorProfile.preco_hora?.toString() || "");
      setEspecialidades(montadorProfile.especialidades || []);
      
      if (profile.endereco) {
        setEndereco(profile.endereco);
      }
    }
  }, [profile, montadorProfile]);

  const handleEspecialidadeToggle = (especialidade: string) => {
    setEspecialidades(prev => 
      prev.includes(especialidade) 
        ? prev.filter(e => e !== especialidade)
        : [...prev, especialidade]
    );
  };

  const handleSave = async () => {
    if (!profile?.user_id) return;
    
    setSaving(true);
    try {
      // Atualizar perfil geral
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome,
          telefone,
          documento,
          endereco,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (profileError) throw profileError;

      // Atualizar perfil específico do montador
      const { error: montadorError } = await supabase
        .from('montadores')
        .update({
          preco_hora: precoHora ? parseFloat(precoHora) : null,
          especialidades,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (montadorError) throw montadorError;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });

      refetch();

    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/montador" 
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Minha Conta</h1>
            <p className="text-white/80">
              Mantenha suas informações atualizadas para receber mais trabalhos
            </p>
          </div>

          <div className="grid gap-6">
            {/* Perfil Básico */}
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                      {getInitials(nome || 'MT')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{nome || 'Montador'}</h3>
                    <p className="text-muted-foreground">
                      {montadorProfile?.avaliacao_media || 0} ★ • {montadorProfile?.projetos_realizados || 0} projetos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="documento">CPF</Label>
                    <Input
                      id="documento"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preco_hora">Preço por hora (R$)</Label>
                    <Input
                      id="preco_hora"
                      type="number"
                      step="0.01"
                      value={precoHora}
                      onChange={(e) => setPrecoHora(e.target.value)}
                      placeholder="50.00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="rua">Rua</Label>
                    <Input
                      id="rua"
                      value={endereco.rua}
                      onChange={(e) => setEndereco(prev => ({ ...prev, rua: e.target.value }))}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      value={endereco.numero}
                      onChange={(e) => setEndereco(prev => ({ ...prev, numero: e.target.value }))}
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      value={endereco.bairro}
                      onChange={(e) => setEndereco(prev => ({ ...prev, bairro: e.target.value }))}
                      placeholder="Nome do bairro"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={endereco.cidade}
                      onChange={(e) => setEndereco(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="Nome da cidade"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={endereco.cep}
                      onChange={(e) => setEndereco(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Especialidades */}
            <Card className="shadow-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Especialidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Selecione suas áreas de atuação. Isso ajuda os clientes a encontrarem o profissional certo.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {especialidadesDisponiveis.map((especialidade) => (
                      <Badge 
                        key={especialidade}
                        variant={especialidades.includes(especialidade) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => handleEspecialidadeToggle(especialidade)}
                      >
                        {especialidade}
                        {especialidades.includes(especialidade) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  
                  {especialidades.length === 0 && (
                    <p className="text-sm text-orange-600">
                      Selecione pelo menos uma especialidade para aparecer nos resultados de busca.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botão Salvar */}
            <Card className="shadow-glow border-0">
              <CardContent className="p-6">
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-primary hover:shadow-glow min-w-[120px]"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Salvar
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MontadorProfile;