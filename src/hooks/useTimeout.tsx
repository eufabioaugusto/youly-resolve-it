import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TimeoutData {
  id: string;
  negociacao_id: string;
  job_id: string;
  montador_id: string;
  data_inicio_timeout: string;
  data_expiracao: string;
  respondido: boolean;
  expirado: boolean;
}

export function useTimeout() {
  const [loading, setLoading] = useState(false);

  const iniciarTimeout = async (negociacaoId: string, montadorId: string, jobId: string) => {
    console.log('🚀 [useTimeout] Iniciando timeout', { negociacaoId, montadorId, jobId });
    setLoading(true);
    
    try {
      const dataExpiracao = new Date();
      dataExpiracao.setMinutes(dataExpiracao.getMinutes() + 40);

      const { data, error } = await supabase
        .from('timeout_montador')
        .insert({
          negociacao_id: negociacaoId,
          job_id: jobId,
          montador_id: montadorId,
          data_expiracao: dataExpiracao.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ [useTimeout] Timeout iniciado com sucesso', data);
      return data;
    } catch (error: any) {
      console.error('❌ [useTimeout] Erro ao iniciar timeout', error);
      toast.error('Erro ao iniciar timeout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const marcarRespondido = async (timeoutId: string) => {
    console.log('🚀 [useTimeout] Marcando timeout como respondido', { timeoutId });
    
    try {
      const { error } = await supabase
        .from('timeout_montador')
        .update({ respondido: true })
        .eq('id', timeoutId);

      if (error) throw error;

      console.log('✅ [useTimeout] Timeout marcado como respondido');
      return true;
    } catch (error: any) {
      console.error('❌ [useTimeout] Erro ao marcar como respondido', error);
      return false;
    }
  };

  const getTimeoutAtivo = async (negociacaoId: string): Promise<TimeoutData | null> => {
    console.log('🚀 [useTimeout] Buscando timeout ativo', { negociacaoId });
    
    try {
      const { data, error } = await supabase
        .from('timeout_montador')
        .select('*')
        .eq('negociacao_id', negociacaoId)
        .eq('respondido', false)
        .eq('expirado', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      console.log('✅ [useTimeout] Timeout ativo encontrado', data);
      return data;
    } catch (error: any) {
      console.error('❌ [useTimeout] Erro ao buscar timeout', error);
      return null;
    }
  };

  const verificarExpirados = async () => {
    console.log('🚀 [useTimeout] Verificando timeouts expirados');
    
    try {
      const agora = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('timeout_montador')
        .select('*')
        .eq('expirado', false)
        .eq('respondido', false)
        .lt('data_expiracao', agora);

      if (error) throw error;

      console.log(`✅ [useTimeout] ${data?.length || 0} timeouts expirados encontrados`);
      return data || [];
    } catch (error: any) {
      console.error('❌ [useTimeout] Erro ao verificar expirados', error);
      return [];
    }
  };

  return {
    loading,
    iniciarTimeout,
    marcarRespondido,
    getTimeoutAtivo,
    verificarExpirados,
  };
}
