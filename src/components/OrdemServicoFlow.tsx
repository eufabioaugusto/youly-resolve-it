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
  FileText,
  Loader2
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

  const storageKey = `os_progress_${ordemServico.id}`;

  const [codigoValidacao, setCodigoValidacao] = useState('');
  const [fotosEnviadas, setFotosEnviadas] = useState<{ [key: string]: boolean }>({
    movel_caixa: false,
    movel_montado: false,
    portas_abertas: false,
    assistencia: false,
  });
  const [fotosPreview, setFotosPreview] = useState<{ [key: string]: string | null }>({
    movel_caixa: null,
    movel_montado: null,
    portas_abertas: null,
    assistencia: null,
  });
  const [uploadingFoto, setUploadingFoto] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [tipoFinalizacao, setTipoFinalizacao] = useState<'sucesso' | 'assistencia' | 'pendente' | null>(null);
  const [processandoACaminho, setProcessandoACaminho] = useState(false);

  // 🔄 Recuperar progresso do localStorage ao montar
  useEffect(() => {
    const progressoSalvo = localStorage.getItem(storageKey);
    if (progressoSalvo) {
      try {
        const dados = JSON.parse(progressoSalvo);
        console.log('📦 Recuperando progresso salvo:', dados);
        
        setFotosPreview(dados.fotosPreview || fotosPreview);
        setFotosEnviadas(dados.fotosEnviadas || fotosEnviadas);
        setObservacoes(dados.observacoes || '');
        setTipoFinalizacao(dados.tipoFinalizacao || null);
        setCodigoValidacao(dados.codigoValidacao || '');
        
        toast.info('Progresso recuperado');
      } catch (error) {
        console.error('❌ Erro ao recuperar progresso:', error);
      }
    }
  }, []);

  // 💾 Salvar progresso no localStorage sempre que houver mudanças
  useEffect(() => {
    const progresso = {
      fotosPreview,
      fotosEnviadas,
      observacoes,
      tipoFinalizacao,
      codigoValidacao,
      ultimaAtualizacao: new Date().toISOString(),
    };
    
    localStorage.setItem(storageKey, JSON.stringify(progresso));
    console.log('💾 Progresso salvo automaticamente');
  }, [fotosPreview, fotosEnviadas, observacoes, tipoFinalizacao, codigoValidacao]);

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

  const handleSelectFoto = async (tipo: string, file: File | null) => {
    if (!file) return;

    console.log('📸 Upload iniciado:', { tipo, file: file.name });
    
    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFotosPreview(prev => ({ ...prev, [tipo]: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload automático
    setUploadingFoto(tipo);
    
    try {
      await uploadFoto(ordemServico.id, tipo, file);
      setFotosEnviadas(prev => ({ ...prev, [tipo]: true }));
      toast.success('Foto enviada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      toast.error('Erro ao enviar foto');
      setFotosPreview(prev => ({ ...prev, [tipo]: null }));
    } finally {
      setUploadingFoto(null);
    }
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
      
      // 🧹 Limpar progresso salvo após finalização bem-sucedida
      localStorage.removeItem(storageKey);
      console.log('🧹 Progresso local limpo após finalização');
      
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
                Código de validação: <strong>*****</strong>
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
                <Label className="text-base font-semibold">1. Móvel na caixa (obrigatória)</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="movel-caixa"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelectFoto('movel_caixa', file);
                    e.target.value = '';
                  }}
                  disabled={uploadingFoto === 'movel_caixa'}
                />
                <label
                  htmlFor="movel-caixa"
                  className={`
                    aspect-video w-full flex flex-col items-center justify-center gap-2 
                    border-2 border-dashed rounded-lg cursor-pointer overflow-hidden
                    transition-all hover:border-primary hover:bg-accent relative
                    ${fotosPreview.movel_caixa ? 'border-primary' : 'border-muted-foreground/25'}
                    ${uploadingFoto === 'movel_caixa' ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {fotosPreview.movel_caixa ? (
                    <>
                      <img 
                        src={fotosPreview.movel_caixa} 
                        alt="Móvel na caixa"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploadingFoto === 'movel_caixa' ? (
                        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                      ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {uploadingFoto === 'movel_caixa' ? 'Enviando...' : 'Tirar foto do móvel na caixa'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              <Separator />

              {/* Etapa 2: Móvel montado */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">2. Móvel montado (obrigatória)</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="movel-montado"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelectFoto('movel_montado', file);
                    e.target.value = '';
                  }}
                  disabled={uploadingFoto === 'movel_montado'}
                />
                <label
                  htmlFor="movel-montado"
                  className={`
                    aspect-video w-full flex flex-col items-center justify-center gap-2 
                    border-2 border-dashed rounded-lg cursor-pointer overflow-hidden
                    transition-all hover:border-primary hover:bg-accent relative
                    ${fotosPreview.movel_montado ? 'border-primary' : 'border-muted-foreground/25'}
                    ${uploadingFoto === 'movel_montado' ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {fotosPreview.movel_montado ? (
                    <>
                      <img 
                        src={fotosPreview.movel_montado} 
                        alt="Móvel montado"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploadingFoto === 'movel_montado' ? (
                        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                      ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {uploadingFoto === 'movel_montado' ? 'Enviando...' : 'Tirar foto do móvel montado'}
                      </span>
                    </>
                  )}
                </label>
              </div>

              <Separator />

              {/* Etapa 3: Portas abertas */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">3. Portas abertas (opcional)</Label>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  id="portas-abertas"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleSelectFoto('portas_abertas', file);
                    e.target.value = '';
                  }}
                  disabled={uploadingFoto === 'portas_abertas'}
                />
                <label
                  htmlFor="portas-abertas"
                  className={`
                    aspect-video w-full flex flex-col items-center justify-center gap-2 
                    border-2 border-dashed rounded-lg cursor-pointer overflow-hidden
                    transition-all hover:border-primary hover:bg-accent relative
                    ${fotosPreview.portas_abertas ? 'border-primary' : 'border-muted-foreground/25'}
                    ${uploadingFoto === 'portas_abertas' ? 'opacity-50 cursor-wait' : ''}
                  `}
                >
                  {fotosPreview.portas_abertas ? (
                    <>
                      <img 
                        src={fotosPreview.portas_abertas} 
                        alt="Portas abertas"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      {uploadingFoto === 'portas_abertas' ? (
                        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                      ) : (
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">
                        {uploadingFoto === 'portas_abertas' ? 'Enviando...' : 'Tirar foto das portas abertas'}
                      </span>
                    </>
                  )}
                </label>
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
                  <Label>Foto da assistência (obrigatória)</Label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    id="assistencia"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelectFoto('assistencia', file);
                      e.target.value = '';
                    }}
                    disabled={uploadingFoto === 'assistencia'}
                  />
                  <label
                    htmlFor="assistencia"
                    className={`
                      aspect-video w-full flex flex-col items-center justify-center gap-2 
                      border-2 border-dashed rounded-lg cursor-pointer overflow-hidden
                      transition-all hover:border-primary hover:bg-accent relative
                      ${fotosPreview.assistencia ? 'border-primary' : 'border-muted-foreground/25'}
                      ${uploadingFoto === 'assistencia' ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    {fotosPreview.assistencia ? (
                      <>
                        <img 
                          src={fotosPreview.assistencia} 
                          alt="Assistência"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-12 h-12 text-white" />
                        </div>
                      </>
                    ) : (
                      <>
                        {uploadingFoto === 'assistencia' ? (
                          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                        ) : (
                          <Camera className="w-12 h-12 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">
                          {uploadingFoto === 'assistencia' ? 'Enviando...' : 'Tirar foto da assistência'}
                        </span>
                      </>
                    )}
                  </label>
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
                disabled={
                  loading || 
                  !tipoFinalizacao || 
                  codigoValidacao.length !== 6 || 
                  (tipoFinalizacao === 'assistencia' && (observacoes.length < 20 || !fotosPreview.assistencia)) ||
                  (tipoFinalizacao === 'pendente' && observacoes.length < 20)
                }
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
