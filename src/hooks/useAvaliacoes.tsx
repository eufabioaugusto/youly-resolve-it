import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CriarAvaliacaoParams {
  ordemServicoId: string;
  jobId: string;
  clienteId: string;
  montadorId: string;
  nota: number;
  comentario?: string;
  aspectosPositivos?: string[];
  aspectosNegativos?: string[];
}

export function useAvaliacoes() {
  const [loading, setLoading] = useState(false);

  const criarAvaliacao = async (params: CriarAvaliacaoParams) => {
    console.log('🚀 [useAvaliacoes] Criando avaliação', params);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .insert({
          ordem_servico_id: params.ordemServicoId,
          job_id: params.jobId,
          cliente_id: params.clienteId,
          montador_id: params.montadorId,
          nota: params.nota,
          comentario: params.comentario,
          aspectos_positivos: params.aspectosPositivos,
          aspectos_negativos: params.aspectosNegativos,
          respondida: true,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useAvaliacoes] Avaliação criada', data);
      toast.success('Avaliação enviada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('❌ [useAvaliacoes] Erro ao criar avaliação', error);
      toast.error('Erro ao enviar avaliação');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const buscarAvaliacoes = async (montadorId: string) => {
    console.log('🚀 [useAvaliacoes] Buscando avaliações do montador', { montadorId });

    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*, ordem_servico(*), jobs(*)')
        .eq('montador_id', montadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('✅ [useAvaliacoes] Avaliações encontradas', data);
      return data || [];
    } catch (error: any) {
      console.error('❌ [useAvaliacoes] Erro ao buscar avaliações', error);
      return [];
    }
  };

  const calcularMediaMontador = async (montadorId: string) => {
    console.log('🚀 [useAvaliacoes] Calculando média do montador', { montadorId });

    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('nota')
        .eq('montador_id', montadorId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { media: 0, total: 0 };
      }

      const soma = data.reduce((acc, av) => acc + av.nota, 0);
      const media = soma / data.length;

      console.log('✅ [useAvaliacoes] Média calculada', { media, total: data.length });
      return { media, total: data.length };
    } catch (error: any) {
      console.error('❌ [useAvaliacoes] Erro ao calcular média', error);
      return { media: 0, total: 0 };
    }
  };

  const verificarAvaliacaoPendente = async (ordemServicoId: string) => {
    console.log('🚀 [useAvaliacoes] Verificando avaliação pendente', { ordemServicoId });

    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('ordem_servico_id', ordemServicoId)
        .maybeSingle();

      if (error) throw error;

      console.log('✅ [useAvaliacoes] Verificação concluída', { existe: !!data });
      return data;
    } catch (error: any) {
      console.error('❌ [useAvaliacoes] Erro ao verificar avaliação', error);
      return null;
    }
  };

  return {
    loading,
    criarAvaliacao,
    buscarAvaliacoes,
    calcularMediaMontador,
    verificarAvaliacaoPendente,
  };
}
