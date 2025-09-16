import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Negociacao {
  id: string;
  job_id: string;
  montador_id: string;
  cliente_id: string;
  status: string;
  valor_proposto_montador?: number;
  valor_proposto_cliente?: number;
  observacoes_montador?: string;
  observacoes_cliente?: string;
  created_at: string;
  updated_at: string;
  jobs?: any;
  montadores?: any;
  clientes?: any;
}

export const useNegociacoes = () => {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNegociacoes();
    }
  }, [user]);

  const fetchNegociacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('negociacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNegociacoes(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar negociações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as negociações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const enviarOrcamento = async (
    negociacaoId: string, 
    valor: number, 
    observacoes?: string
  ) => {
    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({
          status: 'orcamento_enviado',
          valor_proposto_montador: valor,
          observacoes_montador: observacoes
        })
        .eq('id', negociacaoId);

      if (error) throw error;

      toast({
        title: "Orçamento enviado!",
        description: "O cliente foi notificado do seu orçamento."
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao enviar orçamento",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const responderOrcamento = async (
    negociacaoId: string,
    acao: 'aceito' | 'recusado' | 'contra_proposta',
    valorContraproposta?: number,
    observacoes?: string
  ) => {
    try {
      const updateData: any = { status: acao };

      if (acao === 'contra_proposta' && valorContraproposta) {
        updateData.valor_proposto_cliente = valorContraproposta;
        updateData.observacoes_cliente = observacoes;
      }

      const { error } = await supabase
        .from('negociacoes')
        .update(updateData)
        .eq('id', negociacaoId);

      if (error) throw error;

      const acaoTexto = {
        'aceito': 'Orçamento aceito!',
        'recusado': 'Orçamento recusado',
        'contra_proposta': 'Contra-proposta enviada'
      };

      toast({
        title: acaoTexto[acao],
        description: acao === 'aceito' ? "O trabalho foi confirmado!" : 
                    acao === 'recusado' ? "O trabalho foi liberado para outros montadores" :
                    "O montador foi notificado da sua contra-proposta"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const aceitarContraproposta = async (negociacaoId: string) => {
    return responderOrcamento(negociacaoId, 'aceito');
  };

  const recusarContraproposta = async (negociacaoId: string) => {
    return responderOrcamento(negociacaoId, 'recusado');
  };

  // Buscar negociação individual
  const fetchNegociacao = async (jobId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('negociacoes')
        .select(`
          *,
          jobs(*),
          montadores(*, profiles(nome)),
          clientes(*, profiles(nome))
        `)
        .eq('job_id', jobId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar negociação:', error);
      return null;
    }
  };

  return {
    negociacoes,
    loading,
    refetch: fetchNegociacoes,
    fetchNegociacao,
    enviarOrcamento,
    responderOrcamento,
    aceitarContraproposta,
    recusarContraproposta
  };
};