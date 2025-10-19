import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  MapPin, 
  Clock,
  Shield,
  FileText
} from 'lucide-react';
import { useOrdemServico } from '@/hooks/useOrdemServico';
import { useSMS } from '@/hooks/useSMS';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OrdemServicoFlowProps {
  ordemServico: any;
  onOSAtualizada?: () => void;
  onStatusChange?: () => void;
}

export function OrdemServicoFlow({ ordemServico, onOSAtualizada, onStatusChange }: OrdemServicoFlowProps) {
  const { atualizarStatus, uploadFoto, finalizarOS, validarCodigo, loading } = useOrdemServico();
  const { enviarSMSACaminho } = useSMS();

  const [codigoValidacao, setCodigoValidacao] = useState('');
  const [fotosUpload, setFotosUpload] = useState<{ [key: string]: (File | null)[] }>({
    movel_caixa: [null, null, null],
    movel_montado: [null, null, null],
    portas_abertas: [null, null, null],
    assistencia: [null, null, null],
  });
  const [fotosEnviadas, setFotosEnviadas] = useState<{ [key: string]: number }>({
    movel_caixa: 0,
    movel_montado: 0,
    portas_abertas: 0,
    assistencia: 0,
  });
  const [observacoes, setObservacoes] = useState('');
  const [tipoFinalizacao, setTipoFinalizacao] = useState<'sucesso' | 'assistencia' | 'pendente' | null>(null);
  const [processandoACaminho, setProcessandoACaminho] = useState(false);

  const handleACaminho = async () => {
    console.log('🚗 [OrdemServicoFlow] Montador indica estar a caminho');
    setProcessandoACaminho(true);
    
    try {
      // 1. Atualizar status IMEDIATAMENTE
      await atualizarStatus(ordemServico.id, 'a_caminho');
      
      // 2. Notificar sucesso ao usuário IMEDIATAMENTE
      toast.success('Status atualizado! Enviando SMS ao cliente...');
      onStatusChange?.();
      onOSAtualizada?.();
      
      // 3. Enviar SMS em BACKGROUND (não bloqueia a UI)
      enviarSMSBackground();
      
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
      setProcessandoACaminho(false);
    }
  };

  const enviarSMSBackground = async () => {
    try {
      // Buscar dados em paralelo para otimizar
      const [clienteResult, montadorResult] = await Promise.all([
        supabase
          .from('clientes')
          .select('user_id')
          .eq('id', ordemServico.cliente_id)
          .single(),
        supabase
          .from('montadores')
          .select('user_id')
          .eq('id', ordemServico.montador_id)
          .single()
      ]);

      if (!clienteResult.data || !montadorResult.data) {
        console.error('❌ Dados não encontrados');
        return;
      }

      // Buscar profiles em paralelo
      const [profileCliente, profileMontador] = await Promise.all([
        supabase
          .from('profiles')
          .select('telefone')
          .eq('user_id', clienteResult.data.user_id)
          .single(),
        supabase
          .from('profiles')
          .select('nome')
          .eq('user_id', montadorResult.data.user_id)
          .single()
      ]);

      const telefoneCliente = profileCliente.data?.telefone;
      const nomeMontador = profileMontador.data?.nome || 'Montador';

      if (!telefoneCliente) {
        toast.error('Cliente não possui telefone cadastrado');
        return;
      }

      // Enviar SMS
      await enviarSMSACaminho(
        telefoneCliente,
        nomeMontador,
        ordemServico.codigo_validacao,
        ordemServico.id
      );
      
      console.log('✅ SMS enviado em background');
      
    } catch (error) {
      console.error('⚠️ Erro ao enviar SMS (não crítico):', error);
      toast.warning('SMS não enviado, mas status foi atualizado');
    } finally {
      setProcessandoACaminho(false);
    }
  };

  const handleIniciarMontagem = async () => {
    console.log('🔨 [OrdemServicoFlow] Iniciando montagem');
    
    try {
      await atualizarStatus(ordemServico.id, 'iniciada');
      toast.success('Montagem iniciada!');
      onStatusChange?.();
    } catch (error) {
      console.error('Erro ao iniciar montagem:', error);
      toast.error('Erro ao iniciar montagem');
    }
  };

  const handleUploadFoto = async (tipo: string, index: number) => {
    const arquivo = fotosUpload[tipo][index];
    if (!arquivo) return;

    console.log('📸 [OrdemServicoFlow] Fazendo upload de foto', { tipo, index });

    try {
      // Criar um tipo único para cada foto (ex: movel_caixa_1, movel_caixa_2)
      const tipoComIndex = index === 0 ? tipo : `${tipo}_${index + 1}`;
      await uploadFoto(ordemServico.id, tipoComIndex, arquivo);
      
      // Limpar o arquivo e atualizar contador
      const novosFotos = [...fotosUpload[tipo]];
      novosFotos[index] = null;
      setFotosUpload({ ...fotosUpload, [tipo]: novosFotos });
      setFotosEnviadas({ ...fotosEnviadas, [tipo]: fotosEnviadas[tipo] + 1 });
      
      toast.success(`Foto ${index + 1} enviada!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar foto');
    }
  };

  const handleSelectFoto = (tipo: string, index: number, file: File | null) => {
    const novosFotos = [...fotosUpload[tipo]];
    novosFotos[index] = file;
    setFotosUpload({ ...fotosUpload, [tipo]: novosFotos });
  };

  const handleFinalizar = async () => {
    if (!tipoFinalizacao) {
      toast.error('Selecione o tipo de finalização');
      return;
    }

    // Validar código antes de finalizar (ativa a garantia)
    if (!codigoValidacao || codigoValidacao.length !== 6) {
      toast.error('Digite o código de validação fornecido pelo cliente');
      return;
    }

    console.log('✅ [OrdemServicoFlow] Validando código e finalizando OS', { tipoFinalizacao });

    // Validar código
    const valido = await validarCodigo(ordemServico.id, codigoValidacao);
    if (!valido) {
      return; // O erro já é mostrado no validarCodigo
    }

    console.log('✅ [OrdemServicoFlow] Código validado, finalizando OS');

    try {
      await finalizarOS({
        osId: ordemServico.id,
        tipoFinalizacao,
        observacoes,
        motivoAssistencia: tipoFinalizacao === 'assistencia' ? observacoes : undefined,
        motivoPendente: tipoFinalizacao === 'pendente' ? observacoes : undefined,
      });
      
      // 🎯 CRÍTICO: Enviar pesquisa de satisfação após finalização com sucesso
      if (tipoFinalizacao === 'sucesso' || tipoFinalizacao === 'assistencia') {
        console.log('📧 [OrdemServicoFlow] Enviando pesquisa de satisfação');

        try {
          // Gerar token único para a pesquisa
          const token = crypto.randomUUID();
          
          const { error: tokenError } = await supabase
            .from('pesquisa_tokens')
            .insert({
              token,
              ordem_servico_id: ordemServico.id,
            });

          if (tokenError) {
            console.error('❌ Erro ao criar token de pesquisa:', tokenError);
          } else {
            // Buscar dados do cliente para enviar SMS e email
            const { data: clienteData } = await supabase
              .from('clientes')
              .select('user_id')
              .eq('id', ordemServico.cliente_id)
              .single();

            let telefoneCliente = null;
            let emailCliente = null;

            if (clienteData) {
              const { data: profileCliente } = await supabase
                .from('profiles')
                .select('telefone, nome, user_id')
                .eq('user_id', clienteData.user_id)
                .single();

              telefoneCliente = profileCliente?.telefone;
              emailCliente = profileCliente?.user_id;
            }

            // Buscar dados do montador
            const { data: montadorData } = await supabase
              .from('montadores')
              .select('user_id')
              .eq('id', ordemServico.montador_id)
              .single();

            let nomeMontador = 'Montador';

            if (montadorData) {
              const { data: profileMontador } = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', montadorData.user_id)
                .single();

              nomeMontador = profileMontador?.nome || 'Montador';
            }

            // Link da pesquisa (ajustar com seu domínio)
            const linkPesquisa = `${window.location.origin}/pesquisa/${token}`;

            // Enviar SMS
            if (telefoneCliente) {
              const mensagemSMS = `⭐ Como foi sua experiência com ${nomeMontador}? Avalie o serviço: ${linkPesquisa}`;
              
              await supabase.functions.invoke('sms-send', {
                body: {
                  telefone: telefoneCliente,
                  mensagem: mensagemSMS,
                  tipo: 'pesquisa',
                  ordem_servico_id: ordemServico.id,
                },
              });

              console.log('✅ SMS de pesquisa enviado');
            }

            // Enviar email (se já tiver a função configurada)
            if (emailCliente) {
              try {
                await supabase.functions.invoke('send-email', {
                  body: {
                    to: emailCliente,
                    template: 'pesquisa-satisfacao',
                    data: {
                      linkPesquisa,
                      nomeMontador,
                    },
                  },
                });
                console.log('✅ Email de pesquisa enviado');
              } catch (emailError) {
                console.log('⚠️ Email não enviado (função pode não estar configurada)');
              }
            }
          }
        } catch (pesquisaError) {
          console.error('❌ Erro ao processar pesquisa:', pesquisaError);
        }
      }
      
      onOSAtualizada?.();
      onStatusChange?.();
    } catch (error) {
      console.error('Erro ao finalizar:', error);
    }
  };

  const renderStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      'pendente': { label: 'Aguardando início', variant: 'secondary' },
      'a_caminho': { label: 'A caminho', variant: 'default' },
      'iniciada': { label: 'Em andamento', variant: 'default' },
      'concluida': { label: 'Concluída', variant: 'default' },
      'concluida_com_assistencia': { label: 'Concluída com assistência', variant: 'secondary' },
      'pendente_pecas': { label: 'Pendente - peças', variant: 'destructive' },
    };

    const badge = badges[status] || { label: status, variant: 'secondary' };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ordem de Serviço #{ordemServico.id.slice(0, 8)}</CardTitle>
              <CardDescription>
                Código de validação: <strong>{ordemServico.codigo_validacao}</strong>
              </CardDescription>
            </div>
            {renderStatusBadge(ordemServico.status)}
          </div>
        </CardHeader>
      </Card>

      {/* Botão "A caminho" */}
      {ordemServico.status === 'pendente' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Ir para o local
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleACaminho} 
              disabled={processandoACaminho || loading} 
              className="w-full"
            >
              {processandoACaminho ? 'Processando...' : 'Estou a caminho'}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              O cliente receberá um SMS com sua notificação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Iniciar montagem direto */}
      {ordemServico.status === 'a_caminho' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Iniciar montagem
            </CardTitle>
            <CardDescription>
              Ao chegar no local, inicie a montagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleIniciarMontagem} 
              disabled={loading}
              className="w-full"
            >
              Iniciar montagem
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Jornada de fotos */}
      {ordemServico.status === 'iniciada' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Documentação fotográfica
              </CardTitle>
              <CardDescription>
                Faça upload das fotos conforme as etapas da montagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Etapa 1: Móvel na caixa */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">1. Móvel na caixa</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fotosEnviadas.movel_caixa}/3 fotos enviadas (mínimo 1 obrigatória)
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id={`movel-caixa-${index}`}
                        className="hidden"
                        onChange={(e) => handleSelectFoto('movel_caixa', index, e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor={`movel-caixa-${index}`}
                        className={`
                          aspect-square flex flex-col items-center justify-center gap-2 
                          border-2 border-dashed rounded-lg cursor-pointer
                          transition-all hover:border-primary hover:bg-accent
                          ${fotosUpload.movel_caixa[index] ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        `}
                      >
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs font-medium text-center px-2">
                          Foto {index + 1}
                          {index === 0 && <span className="block text-destructive">Obrigatória</span>}
                        </span>
                      </label>
                      {fotosUpload.movel_caixa[index] && (
                        <Button 
                          onClick={() => handleUploadFoto('movel_caixa', index)} 
                          size="sm"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Etapa 2: Móvel montado */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">2. Móvel montado</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fotosEnviadas.movel_montado}/3 fotos enviadas (mínimo 1 obrigatória)
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id={`movel-montado-${index}`}
                        className="hidden"
                        onChange={(e) => handleSelectFoto('movel_montado', index, e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor={`movel-montado-${index}`}
                        className={`
                          aspect-square flex flex-col items-center justify-center gap-2 
                          border-2 border-dashed rounded-lg cursor-pointer
                          transition-all hover:border-primary hover:bg-accent
                          ${fotosUpload.movel_montado[index] ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        `}
                      >
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs font-medium text-center px-2">
                          Foto {index + 1}
                          {index === 0 && <span className="block text-destructive">Obrigatória</span>}
                        </span>
                      </label>
                      {fotosUpload.movel_montado[index] && (
                        <Button 
                          onClick={() => handleUploadFoto('movel_montado', index)} 
                          size="sm"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Etapa 3: Portas abertas */}
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-semibold">3. Portas abertas (se aplicável)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fotosEnviadas.portas_abertas}/3 fotos enviadas
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id={`portas-abertas-${index}`}
                        className="hidden"
                        onChange={(e) => handleSelectFoto('portas_abertas', index, e.target.files?.[0] || null)}
                      />
                      <label
                        htmlFor={`portas-abertas-${index}`}
                        className={`
                          aspect-square flex flex-col items-center justify-center gap-2 
                          border-2 border-dashed rounded-lg cursor-pointer
                          transition-all hover:border-primary hover:bg-accent
                          ${fotosUpload.portas_abertas[index] ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        `}
                      >
                        <Camera className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs font-medium text-center px-2">
                          Foto {index + 1}
                          {index === 0 && <span className="block text-destructive">Obrigatória</span>}
                        </span>
                      </label>
                      {fotosUpload.portas_abertas[index] && (
                        <Button 
                          onClick={() => handleUploadFoto('portas_abertas', index)} 
                          size="sm"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 text-xs"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalização */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Finalizar ordem de serviço
              </CardTitle>
              <CardDescription>
                O código de validação ativa a garantia de 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Código de validação */}
              <div className="space-y-2">
                <Label htmlFor="codigo-final" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Código de validação (fornecido pelo cliente)
                </Label>
                <Input
                  id="codigo-final"
                  value={codigoValidacao}
                  onChange={(e) => setCodigoValidacao(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                  maxLength={6}
                />
                <p className="text-sm text-muted-foreground">
                  Solicite o código ao cliente para ativar a garantia
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tipo de finalização</Label>
                <div className="space-y-2">
                  <Button
                    variant={tipoFinalizacao === 'sucesso' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTipoFinalizacao('sucesso')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluído com sucesso
                  </Button>
                  <Button
                    variant={tipoFinalizacao === 'assistencia' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTipoFinalizacao('assistencia')}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Concluído com assistência técnica
                  </Button>
                  <Button
                    variant={tipoFinalizacao === 'pendente' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setTipoFinalizacao('pendente')}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Pendente - peça estrutural
                  </Button>
                </div>
              </div>

              {(tipoFinalizacao === 'assistencia' || tipoFinalizacao === 'pendente') && (
                <div className="space-y-2">
                  <Label htmlFor="observacoes">
                    {tipoFinalizacao === 'assistencia' ? 'Motivo da assistência (obrigatório)' : 'Motivo da pendência (obrigatório)'}
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva detalhadamente o que aconteceu..."
                    rows={4}
                  />
                </div>
              )}

              {tipoFinalizacao === 'assistencia' && (
                <div className="space-y-3">
                  <div>
                    <Label>Fotos da assistência</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fotosEnviadas.assistencia}/3 fotos enviadas
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id={`assistencia-${index}`}
                          className="hidden"
                          onChange={(e) => handleSelectFoto('assistencia', index, e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor={`assistencia-${index}`}
                          className={`
                            aspect-square flex flex-col items-center justify-center gap-2 
                            border-2 border-dashed rounded-lg cursor-pointer
                            transition-all hover:border-primary hover:bg-accent
                            ${fotosUpload.assistencia[index] ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                          `}
                        >
                          <Camera className="w-8 h-8 text-muted-foreground" />
                          <span className="text-xs font-medium text-center px-2">
                            Foto {index + 1}
                            {index === 0 && <span className="block text-destructive">Obrigatória</span>}
                          </span>
                        </label>
                        {fotosUpload.assistencia[index] && (
                          <Button 
                            onClick={() => handleUploadFoto('assistencia', index)} 
                            size="sm"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-6 text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Enviar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tipoFinalizacao && (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    {tipoFinalizacao === 'sucesso' && 'Garantia de 30 dias será ativada automaticamente'}
                    {tipoFinalizacao === 'assistencia' && 'Garantia de 30 dias será ativada. O admin será notificado.'}
                    {tipoFinalizacao === 'pendente' && 'Pagamento NÃO será liberado. Cliente e admin serão notificados.'}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleFinalizar} 
                disabled={loading || !tipoFinalizacao || codigoValidacao.length !== 6 || ((tipoFinalizacao === 'assistencia' || tipoFinalizacao === 'pendente') && observacoes.length < 20)}
                className="w-full"
              >
                Validar código e finalizar
              </Button>
              {codigoValidacao.length !== 6 && (
                <p className="text-sm text-destructive text-center">
                  Digite o código de 6 dígitos para finalizar
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Status finalizados */}
      {['concluida', 'concluida_com_assistencia', 'pendente_pecas'].includes(ordemServico.status) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Ordem de serviço finalizada
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordemServico.garantia_ativa && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Garantia ativa até {new Date(ordemServico.data_expiracao_garantia).toLocaleDateString('pt-BR')}
                </AlertDescription>
              </Alert>
            )}
            {ordemServico.motivo_assistencia && (
              <div className="mt-4">
                <Label>Motivo da assistência:</Label>
                <p className="text-sm mt-1">{ordemServico.motivo_assistencia}</p>
              </div>
            )}
            {ordemServico.motivo_pendente && (
              <div className="mt-4">
                <Label>Motivo da pendência:</Label>
                <p className="text-sm mt-1">{ordemServico.motivo_pendente}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
