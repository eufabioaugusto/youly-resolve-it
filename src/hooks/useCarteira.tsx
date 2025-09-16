import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

export interface CarteiraInfo {
  id: string;
  saldo_disponivel: number;
  saldo_bloqueado: number;
  saldo_em_processamento: number;
  total_sacado: number;
  data_liberacao_admin?: string;
}

export interface TransacaoCarteira {
  id: string;
  tipo: 'entrada' | 'saida' | 'bloqueio' | 'liberacao';
  valor: number;
  descricao: string;
  created_at: string;
  job_id?: string;
}

export function useCarteira() {
  const { user } = useAuth();
  const { montadorProfile } = useProfile();
  const [carteira, setCarteira] = useState<CarteiraInfo | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoCarteira[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (montadorProfile?.id) {
      fetchCarteira();
      fetchTransacoes();
    }
  }, [montadorProfile?.id]);

  const fetchCarteira = async () => {
    if (!montadorProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('carteira')
        .select('*')
        .eq('montador_id', montadorProfile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar carteira:', error);
        return;
      }

      setCarteira(data);
    } catch (error) {
      console.error('Erro ao buscar carteira:', error);
    }
  };

  const fetchTransacoes = async () => {
    if (!montadorProfile?.id) return;

    try {
      // Buscar carteira primeiro
      const { data: carteiraData } = await supabase
        .from('carteira')
        .select('id')
        .eq('montador_id', montadorProfile.id)
        .single();

      if (!carteiraData) return;

      const { data, error } = await supabase
        .from('carteira_transacoes')
        .select('*')
        .eq('carteira_id', carteiraData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao buscar transações:', error);
        return;
      }

      setTransacoes(data as TransacaoCarteira[] || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarSaque = async (valor: number, chavePix: string) => {
    if (!montadorProfile?.id || !carteira) {
      throw new Error('Dados do montador não encontrados');
    }

    if (valor > carteira.saldo_disponivel) {
      throw new Error('Saldo insuficiente');
    }

    const { error } = await supabase
      .from('saques')
      .insert({
        montador_id: montadorProfile.id,
        valor,
        chave_pix: chavePix,
        status: 'solicitado'
      });

    if (error) {
      throw error;
    }

    // Atualizar carteira
    await fetchCarteira();
    await fetchTransacoes();
  };

  return {
    carteira,
    transacoes,
    loading,
    solicitarSaque,
    refetch: () => {
      fetchCarteira();
      fetchTransacoes();
    }
  };
}