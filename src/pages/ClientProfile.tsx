import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, MapPin, User, CreditCard } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cpfMask, phoneMask, validateCPF, validatePhone } from "@/lib/masks";

const ClientProfile = () => {
  const { profile, clienteProfile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form states
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  
  // Address states
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [pagamentos, setPagamentos] = useState<any[]>([]);
  const [loadingPagamentos, setLoadingPagamentos] = useState(true);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setTelefone(profile.telefone || "");
      setDocumento(profile.documento || "");
      
      if (profile.endereco) {
        setCep(profile.endereco.cep || "");
        setRua(profile.endereco.rua || "");
        setNumero(profile.endereco.numero || "");
        setBairro(profile.endereco.bairro || "");
        setCidade(profile.endereco.cidade || "");
        setEstado(profile.endereco.estado || "");
      }
    }
  }, [profile]);

  useEffect(() => {
    if (clienteProfile) {
      loadPagamentos();
    }
  }, [clienteProfile]);

  // Realtime para pagamentos do cliente
  useEffect(() => {
    if (!clienteProfile?.id) return;

    console.log('🔔 Configurando realtime para pagamentos do cliente');
    
    const channel = supabase
      .channel('client-pagamentos-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pagamentos',
          filter: `cliente_id=eq.${clienteProfile.id}`
        },
        (payload) => {
          console.log('🔥 Pagamento atualizado para cliente:', payload);
          loadPagamentos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clienteProfile?.id]);

  const loadPagamentos = async () => {
    if (!clienteProfile) return;
    
    setLoadingPagamentos(true);
    try {
      // Buscar pagamentos
      const { data: pagamentosData, error: pagamentosError } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('cliente_id', clienteProfile.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (pagamentosError) throw pagamentosError;

      // Buscar jobs relacionados
      const jobIds = pagamentosData?.map(p => p.job_id).filter(Boolean) || [];
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, descricao, categoria')
        .in('id', jobIds);

      // Buscar montadores e seus profiles
      const montadorIds = pagamentosData?.map(p => p.montador_id).filter(Boolean) || [];
      const { data: montadoresData } = await supabase
        .from('montadores')
        .select('id, user_id')
        .in('id', montadorIds);

      const userIds = montadoresData?.map(m => m.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nome')
        .in('user_id', userIds);

      // Combinar os dados
      const pagamentosCompletos = pagamentosData?.map(pag => ({
        ...pag,
        jobs: jobsData?.find(j => j.id === pag.job_id),
        montadores: montadoresData?.find(m => m.id === pag.montador_id),
        montador_nome: profilesData?.find(p => 
          p.user_id === montadoresData?.find(m => m.id === pag.montador_id)?.user_id
        )?.nome
      }));
      
      console.log('📊 [ClientProfile] Pagamentos carregados:', pagamentosCompletos);
      setPagamentos(pagamentosCompletos || []);
    } catch (error: any) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setLoadingPagamentos(false);
    }
  };

  const fetchAddressByCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setRua(data.logradouro || "");
        setBairro(data.bairro || "");
        setCidade(data.localidade || "");
        setEstado(data.uf || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    const maskedCep = value.replace(/\D/g, "").replace(/(\d{5})(\d{3})/, "$1-$2");
    setCep(maskedCep);
    
    if (maskedCep.replace(/\D/g, "").length === 8) {
      fetchAddressByCep(maskedCep);
    }
  };

  const handleSave = async () => {
    // Validações
    if (!nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (telefone && !validatePhone(telefone)) {
      toast({
        title: "Erro", 
        description: "Telefone inválido",
        variant: "destructive"
      });
      return;
    }

    if (documento && !validateCPF(documento)) {
      toast({
        title: "Erro",
        description: "CPF inválido", 
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Atualizar perfil básico
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: nome.trim(),
          telefone: telefone || null,
          documento: documento || null,
          endereco: cep ? {
            cep,
            rua: rua.trim(),
            numero: numero.trim(),
            bairro: bairro.trim(),
            cidade: cidade.trim(),
            estado: estado.trim()
          } : null
        })
        .eq('user_id', profile?.user_id);

      if (profileError) throw profileError;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!"
      });

      // Recarregar dados
      await refetch();
      
      // Voltar ao dashboard
      navigate('/cliente');

    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link 
          to="/cliente" 
          className="inline-flex items-center gap-2 text-destructive hover:text-destructive/80 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                    {getInitials(nome || profile.nome || 'CL')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo *</Label>
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
                      onChange={(e) => setTelefone(phoneMask(e.target.value))}
                      placeholder="(11) 9 9999-9999"
                      maxLength={16}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="documento">CPF</Label>
                  <Input
                    id="documento"
                    value={documento}
                    onChange={(e) => setDocumento(cpfMask(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      disabled={loadingCep}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rua">Rua</Label>
                  <Input
                    id="rua"
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Nome da cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Histórico de Pagamentos
              </CardTitle>
              <CardDescription>
                Últimos 10 pagamentos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPagamentos ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pagamentos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento realizado ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Montador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagamentos.map((pagamento) => (
                      <TableRow key={pagamento.id}>
                        <TableCell className="text-sm">
                          {new Date(pagamento.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm font-medium truncate">
                              {pagamento.jobs?.descricao}
                            </p>
                            {pagamento.jobs?.categoria && (
                              <p className="text-xs text-muted-foreground">
                                {pagamento.jobs.categoria}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {pagamento.montador_nome || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {pagamento.valor_total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              pagamento.status === 'pago'
                                ? 'default'
                                : pagamento.status === 'pendente'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {pagamento.status === 'pago' ? 'Pago' : 
                             pagamento.status === 'pendente' ? 'Pendente' : 
                             'Rejeitado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm capitalize">
                          {pagamento.metodo || 'N/A'}
                          {pagamento.installments > 1 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({pagamento.installments}x)
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;