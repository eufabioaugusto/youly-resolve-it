import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ProductImageUpload } from "@/components/ProductImageUpload";
import { DatePickerInput } from "@/components/DatePickerInput";
import { Wrench, ArrowLeft, Calendar, Loader2, InfoIcon } from "lucide-react";
import { useState } from "react";
import { currencyMask, currencyToNumber } from "@/lib/masks";

const CreateJob = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clienteProfile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  const [formData, setFormData] = useState({
    descricao: "",
    categoria: "",
    tipo_servico: "",
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      ponto_referencia: "",
    },
    data_opcoes: [
      { data: "", periodo: "manha", selecionado: false },
      { data: "", periodo: "tarde", selecionado: false },
      { data: "", periodo: "manha", selecionado: false },
    ],
    valor_estimado: "",
    imagens_produtos: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteProfile) return;

    setLoading(true);

    const opcoesSelecionadas = formData.data_opcoes.filter((opcao) => opcao.selecionado && opcao.data);

    if (opcoesSelecionadas.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos uma data disponível",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!formData.tipo_servico) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de serviço",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data: jobData, error } = await supabase
        .from("jobs")
        .insert({
          cliente_id: clienteProfile.id,
          descricao: formData.descricao,
          categoria: formData.categoria,
          tipo_servico: formData.tipo_servico,
          endereco: formData.endereco,
          data_opcoes: opcoesSelecionadas,
          valor_estimado: currencyToNumber(formData.valor_estimado) || null,
          imagens_produtos: formData.imagens_produtos,
        })
        .select()
        .single();

      if (error) throw error;

      // Pequeno delay para dar tempo das notificações serem criadas
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Pedido criado com sucesso!",
        description: "Redirecionando para montadores sugeridos...",
      });

      // Redirecionar para página de montadores sugeridos
      navigate(`/pedido/${jobData.id}/montadores-sugeridos`);
    } catch (error: any) {
      toast({
        title: "Erro ao criar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDataOpcao = (index: number, field: string, value: any) => {
    const newOpcoes = [...formData.data_opcoes];
    newOpcoes[index] = { ...newOpcoes[index], [field]: value };
    setFormData({ ...formData, data_opcoes: newOpcoes });
  };

  const searchCEP = async (cep: string) => {
    if (cep.length !== 8) return;

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData({
          ...formData,
          endereco: {
            ...formData.endereco,
            cep: cep,
            rua: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          },
        });
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP está correto",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Tente novamente em alguns momentos",
        variant: "destructive",
      });
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (value: string) => {
    const cleanCEP = value.replace(/\D/g, "");
    setFormData({
      ...formData,
      endereco: { ...formData.endereco, cep: cleanCEP },
    });

    if (cleanCEP.length === 8) {
      searchCEP(cleanCEP);
    }
  };

  // Calcular data mínima (48h = 2 dias corridos)
  const getMinDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    now.setHours(0, 0, 0, 0);
    return now;
  };

  // Função para verificar períodos disponíveis para uma data
  const getAvailablePeriodos = (currentIndex: number, selectedDate: string) => {
    const allPeriodos = [
      { value: "manha", label: "Manhã (08h–12h)" },
      { value: "tarde", label: "Tarde (13h–18h)" },
    ];

    if (!selectedDate) return allPeriodos;

    // Pegar todas as outras opções selecionadas (exceto a atual)
    const otherSelectedOptions = formData.data_opcoes
      .filter((opcao, index) => index !== currentIndex && opcao.selecionado && opcao.data === selectedDate)
      .map((opcao) => opcao.periodo);

    // Filtrar períodos que já foram selecionados para a mesma data
    return allPeriodos.filter((periodo) => !otherSelectedOptions.includes(periodo.value));
  };

  const toggleTipoServico = (tipo: string) => {
    setFormData({
      ...formData,
      tipo_servico: tipo,
    });
  };

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

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-glow border-0 bg-white">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Novo Pedido</CardTitle>
              <CardDescription className="text-center">
                Descreva o serviço que precisa e encontre o montador ideal
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label>Tipo de Serviço *</Label>
                  <div className="grid grid-cols-3 gap-1.5 md:gap-3">
                    {["Móvel novo", "Móvel usado", "Desmontagem"].map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => toggleTipoServico(tipo)}
                        className={`px-2 py-3 md:px-4 rounded-lg border-2 transition-all font-medium text-xs md:text-base ${
                          formData.tipo_servico === tipo
                            ? "border-destructive bg-destructive text-destructive-foreground"
                            : "border-input bg-background text-foreground hover:border-destructive/50"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição do serviço *</Label>
                  <Textarea
                    id="descricao"
                    placeholder="Ex: Montagem de guarda-roupa 6 portas MadeiraMadeira..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="resize-none"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guarda-roupa">Guarda-roupa</SelectItem>
                        <SelectItem value="cama">Cama</SelectItem>
                        <SelectItem value="mesa">Mesa de jantar</SelectItem>
                        <SelectItem value="estante">Estante</SelectItem>
                        <SelectItem value="rack">Rack/Painel TV</SelectItem>
                        <SelectItem value="outros">Outros móveis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="valor_estimado">Valor estimado (R$)</Label>
                    <Input
                      id="valor_estimado"
                      type="text"
                      placeholder="150,00"
                      value={formData.valor_estimado}
                      onChange={(e) => {
                        const maskedValue = currencyMask(e.target.value);
                        setFormData({ ...formData, valor_estimado: maskedValue });
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <InfoIcon className="w-3 h-3 text-destructive" />
                      <p className="text-[10px] text-muted-foreground">Valor estimado do produto a ser montado</p>
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Endereço para o serviço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          placeholder="00000-000"
                          value={formData.endereco.cep.replace(/(\d{5})(\d)/, "$1-$2")}
                          onChange={(e) => handleCepChange(e.target.value)}
                          maxLength={9}
                          required
                        />
                        {cepLoading && (
                          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Digite o CEP para preenchimento automático</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rua">Rua *</Label>
                      <Input
                        id="rua"
                        value={formData.endereco.rua}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, rua: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numero">Número e Complemento *</Label>
                      <Input
                        id="numero"
                        value={formData.endereco.numero}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, numero: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro *</Label>
                      <Input
                        id="bairro"
                        value={formData.endereco.bairro}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, bairro: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={formData.endereco.cidade}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, cidade: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Input
                        id="estado"
                        value={formData.endereco.estado}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, estado: e.target.value },
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ponto_referencia">Ponto de Referência</Label>
                      <Input
                        id="ponto_referencia"
                        placeholder="Ex: Próximo ao mercado..."
                        value={formData.endereco.ponto_referencia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            endereco: { ...formData.endereco, ponto_referencia: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Imagens do produto */}
                <ProductImageUpload
                  images={formData.imagens_produtos || []}
                  onImagesChange={(images) => setFormData({ ...formData, imagens_produtos: images })}
                  maxImages={7}
                />

                {/* Datas disponíveis */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Datas disponíveis (até 3 opções)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selecione até 3 datas alternativas com antecedência mínima de 48h
                    </p>
                  </div>
                  {formData.data_opcoes.map((opcao, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Checkbox
                        checked={opcao.selecionado}
                        onCheckedChange={(checked) => updateDataOpcao(index, "selecionado", checked)}
                      />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DatePickerInput
                          value={opcao.data}
                          onChange={(date) => updateDataOpcao(index, "data", date)}
                          minDate={getMinDate()}
                          disabled={!opcao.selecionado}
                          placeholder="Selecione a data"
                        />
                        <Select
                          value={opcao.periodo}
                          onValueChange={(value) => updateDataOpcao(index, "periodo", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailablePeriodos(index, opcao.data).map((periodo) => (
                              <SelectItem key={periodo.value} value={periodo.value}>
                                {periodo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary hover:shadow-glow">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Notificando montadores...
                    </div>
                  ) : (
                    "Criar Pedido"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
