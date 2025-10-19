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

interface OrdemServicoFlowProps {
  ordemServico: any;
  onStatusChange?: () => void;
}

export function OrdemServicoFlow({ ordemServico, onStatusChange }: OrdemServicoFlowProps) {
  const { atualizarStatus, uploadFoto, finalizarOS, validarCodigo, loading } = useOrdemServico();
  const { enviarSMSACaminho } = useSMS();

  const [codigoValidacao, setCodigoValidacao] = useState('');
  const [fotosUpload, setFotosUpload] = useState<{ [key: string]: File | null }>({
    movel_caixa: null,
    movel_montado: null,
    portas_abertas: null,
    assistencia: null,
  });
  const [observacoes, setObservacoes] = useState('');
  const [tipoFinalizacao, setTipoFinalizacao] = useState<'sucesso' | 'assistencia' | 'pendente' | null>(null);

  const handleACaminho = async () => {
    console.log('🚗 [OrdemServicoFlow] Montador indica estar a caminho');
    
    try {
      await atualizarStatus(ordemServico.id, 'a_caminho');
      
      // Buscar telefone do cliente
      // TODO: Buscar telefone real do cliente via query
      const telefoneCliente = '5511999999999'; // Placeholder
      
      // Enviar SMS ao cliente
      await enviarSMSACaminho(
        telefoneCliente,
        'Montador', // TODO: Nome real do montador
        ordemServico.codigo_validacao,
        ordemServico.id
      );
      
      toast.success('Cliente notificado!');
      onStatusChange?.();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleIniciarMontagem = async () => {
    console.log('🔨 [OrdemServicoFlow] Iniciando montagem', { codigo: codigoValidacao });
    
    const valido = await validarCodigo(ordemServico.id, codigoValidacao);
    
    if (valido) {
      await atualizarStatus(ordemServico.id, 'iniciada');
      toast.success('Montagem iniciada!');
      onStatusChange?.();
    }
  };

  const handleUploadFoto = async (tipo: string) => {
    const arquivo = fotosUpload[tipo];
    if (!arquivo) return;

    console.log('📸 [OrdemServicoFlow] Fazendo upload de foto', { tipo });

    try {
      await uploadFoto(ordemServico.id, tipo, arquivo);
      setFotosUpload({ ...fotosUpload, [tipo]: null });
      toast.success('Foto enviada!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  };

  const handleFinalizar = async () => {
    if (!tipoFinalizacao) {
      toast.error('Selecione o tipo de finalização');
      return;
    }

    console.log('✅ [OrdemServicoFlow] Finalizando OS', { tipoFinalizacao });

    try {
      await finalizarOS({
        osId: ordemServico.id,
        tipoFinalizacao,
        observacoes,
        motivoAssistencia: tipoFinalizacao === 'assistencia' ? observacoes : undefined,
        motivoPendente: tipoFinalizacao === 'pendente' ? observacoes : undefined,
      });
      
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
            <Button onClick={handleACaminho} disabled={loading} className="w-full">
              Estou a caminho
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              O cliente receberá um SMS com sua notificação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Iniciar montagem com código */}
      {ordemServico.status === 'a_caminho' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Iniciar montagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código de validação (fornecido pelo cliente)</Label>
              <Input
                id="codigo"
                value={codigoValidacao}
                onChange={(e) => setCodigoValidacao(e.target.value.toUpperCase())}
                placeholder="Digite o código"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleIniciarMontagem} 
              disabled={loading || codigoValidacao.length !== 6}
              className="w-full"
            >
              Validar e iniciar
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
              <div className="space-y-2">
                <Label className="text-base font-semibold">1. Móvel na caixa (obrigatório)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotosUpload({ ...fotosUpload, movel_caixa: e.target.files?.[0] || null })}
                />
                {fotosUpload.movel_caixa && (
                  <Button onClick={() => handleUploadFoto('movel_caixa')} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar foto
                  </Button>
                )}
              </div>

              <Separator />

              {/* Etapa 2: Móvel montado */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">2. Móvel montado (obrigatório)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotosUpload({ ...fotosUpload, movel_montado: e.target.files?.[0] || null })}
                />
                {fotosUpload.movel_montado && (
                  <Button onClick={() => handleUploadFoto('movel_montado')} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar foto
                  </Button>
                )}
              </div>

              <Separator />

              {/* Etapa 3: Portas abertas (condicional) */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  3. Portas abertas (se aplicável)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Obrigatório para guarda-roupas e armários
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFotosUpload({ ...fotosUpload, portas_abertas: e.target.files?.[0] || null })}
                />
                {fotosUpload.portas_abertas && (
                  <Button onClick={() => handleUploadFoto('portas_abertas')} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar foto
                  </Button>
                )}
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
            </CardHeader>
            <CardContent className="space-y-4">
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
                <div className="space-y-2">
                  <Label>Fotos da assistência</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFotosUpload({ ...fotosUpload, assistencia: e.target.files?.[0] || null })}
                  />
                  {fotosUpload.assistencia && (
                    <Button onClick={() => handleUploadFoto('assistencia')} size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar foto
                    </Button>
                  )}
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
                disabled={loading || !tipoFinalizacao || ((tipoFinalizacao === 'assistencia' || tipoFinalizacao === 'pendente') && observacoes.length < 20)}
                className="w-full"
              >
                Finalizar ordem de serviço
              </Button>
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
