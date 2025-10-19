import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CriarOrdemServicoParams {
  negociacaoId: string;
  jobId: string;
  montadorId: string;
  clienteId: string;
  dataSelecionada: {
    data: string;
    periodo: string;
  };
}

interface FinalizarOSParams {
  osId: string;
  tipoFinalizacao: 'sucesso' | 'assistencia' | 'pendente';
  observacoes?: string;
  motivoAssistencia?: string;
  motivoPendente?: string;
}

export function useOrdemServico() {
  const [loading, setLoading] = useState(false);

  const criarOrdemServico = async (params: CriarOrdemServicoParams) => {
    console.log('🚀 [useOrdemServico] Criando ordem de serviço', params);
    setLoading(true);

    try {
      // Gerar código de validação
      const { data: codigoData, error: codigoError } = await supabase
        .rpc('gerar_codigo_validacao');

      if (codigoError) throw codigoError;

      const codigo = codigoData as string;
      console.log('✅ [useOrdemServico] Código gerado', { codigo });

      // Criar ordem de serviço
      const { data, error } = await supabase
        .from('ordem_servico')
        .insert({
          negociacao_id: params.negociacaoId,
          job_id: params.jobId,
          montador_id: params.montadorId,
          cliente_id: params.clienteId,
          codigo_validacao: codigo,
          data_hora_agendamento: params.dataSelecionada.data,
          periodo_agendamento: params.dataSelecionada.periodo,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useOrdemServico] OS criada com sucesso', data);
      toast.success('Ordem de serviço criada!');
      return data;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao criar OS', error);
      toast.error('Erro ao criar ordem de serviço');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (osId: string, novoStatus: string, dados?: any) => {
    console.log('🚀 [useOrdemServico] Atualizando status', { osId, novoStatus, dados });

    try {
      const updateData: any = { status: novoStatus };

      if (novoStatus === 'iniciada') {
        updateData.data_hora_inicio = new Date().toISOString();
      }

      if (dados) {
        Object.assign(updateData, dados);
      }

      const { data, error } = await supabase
        .from('ordem_servico')
        .update(updateData)
        .eq('id', osId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useOrdemServico] Status atualizado', data);
      return data;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao atualizar status', error);
      throw error;
    }
  };

  const uploadFoto = async (osId: string, tipo: string, arquivo: File) => {
    console.log('🚀 [useOrdemServico] Upload de foto', { osId, tipo, tamanho: arquivo.size });

    try {
      // Upload do arquivo para storage
      const fileName = `${osId}/${tipo}/${Date.now()}_${arquivo.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, arquivo);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Salvar registro da foto
      const { data, error } = await supabase
        .from('ordem_servico_fotos')
        .insert({
          ordem_servico_id: osId,
          tipo: tipo as any,
          url_foto: urlData.publicUrl,
          ordem: 0,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useOrdemServico] Foto salva com sucesso', data);
      toast.success('Foto enviada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao fazer upload', error);
      toast.error('Erro ao enviar foto');
      throw error;
    }
  };

  const finalizarOS = async (params: FinalizarOSParams) => {
    console.log('🚀 [useOrdemServico] Finalizando OS', params);
    setLoading(true);

    try {
      const updateData: any = {
        data_hora_conclusao: new Date().toISOString(),
      };

      if (params.tipoFinalizacao === 'sucesso') {
        updateData.status = 'concluida';
        updateData.garantia_ativa = true;
        updateData.data_ativacao_garantia = new Date().toISOString();
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        updateData.data_expiracao_garantia = dataExpiracao.toISOString();
      } else if (params.tipoFinalizacao === 'assistencia') {
        if (!params.motivoAssistencia) {
          throw new Error('Motivo da assistência é obrigatório');
        }
        updateData.status = 'concluida_com_assistencia';
        updateData.motivo_assistencia = params.motivoAssistencia;
        updateData.garantia_ativa = true;
        updateData.data_ativacao_garantia = new Date().toISOString();
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);
        updateData.data_expiracao_garantia = dataExpiracao.toISOString();
      } else if (params.tipoFinalizacao === 'pendente') {
        if (!params.motivoPendente) {
          throw new Error('Motivo da pendência é obrigatório');
        }
        updateData.status = 'pendente_pecas';
        updateData.motivo_pendente = params.motivoPendente;
      }

      if (params.observacoes) {
        updateData.observacoes_montador = params.observacoes;
      }

      const { data, error } = await supabase
        .from('ordem_servico')
        .update(updateData)
        .eq('id', params.osId)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useOrdemServico] OS finalizada', data);
      toast.success('Ordem de serviço finalizada!');
      return data;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao finalizar OS', error);
      toast.error(error.message || 'Erro ao finalizar OS');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validarCodigo = async (osId: string, codigo: string) => {
    console.log('🚀 [useOrdemServico] Validando código', { osId, codigo });

    try {
      const { data, error } = await supabase
        .from('ordem_servico')
        .select('codigo_validacao')
        .eq('id', osId)
        .single();

      if (error) throw error;

      const valido = data.codigo_validacao === codigo.toUpperCase();
      console.log(valido ? '✅ [useOrdemServico] Código válido' : '❌ [useOrdemServico] Código inválido');

      if (!valido) {
        toast.error('Código inválido');
      }

      return valido;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao validar código', error);
      toast.error('Erro ao validar código');
      return false;
    }
  };

  const buscarOS = async (jobId: string) => {
    console.log('🚀 [useOrdemServico] Buscando OS por job', { jobId });

    try {
      const { data, error } = await supabase
        .from('ordem_servico')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      console.log('✅ [useOrdemServico] OS encontrada', data);
      return data;
    } catch (error: any) {
      console.error('❌ [useOrdemServico] Erro ao buscar OS', error);
      return null;
    }
  };

  return {
    loading,
    criarOrdemServico,
    atualizarStatus,
    uploadFoto,
    finalizarOS,
    validarCodigo,
    buscarOS,
  };
}
