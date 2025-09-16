import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Negociacao {
  id: string;
  job_id: string;
  montador_id: string;
  cliente_id: string;
  status: string; // Mudando para string para evitar problemas de tipo
  valor_proposto_montador?: number;
  valor_proposto_cliente?: number;
  observacoes_montador?: string;
  observacoes_cliente?: string;
  created_at: string;
  updated_at: string;
  jobs?: {
    descricao: string;
    categoria: string;
    endereco: any;
    valor_estimado?: number;
  };
  montadores?: {
    profiles?: {
      nome: string;
    };
    preco_hora?: number;
  };
  clientes?: {
    profiles?: {
      nome: string;
    };
  };
}

export const useNegociacoes = () => {
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchNegociacoes();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchNegociacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('negociacoes')
        .select(`
          *,
          jobs (descricao, categoria, endereco, valor_estimado),
          montadores (
            profiles (nome),
            preco_hora
          ),
          clientes (
            profiles (nome)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNegociacoes((data as any) || []);
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

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('negociacoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negociacoes'
        },
        (payload) => {
          console.log('Negociação atualizada:', payload);
          fetchNegociacoes(); // Recarregar dados para pegar joins
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const updateData: any = {
        status: acao
      };

      if (acao === 'contra_proposta' && valorContraproposta) {
        updateData.valor_proposto_cliente = valorContraproposta;
        updateData.observacoes_cliente = observacoes;
      }

      const { error } = await supabase
        .from('negociacoes')
        .update(updateData)
        .eq('id', negociacaoId);

      if (error) throw error;

      // Se aceito, atualizar job para em_andamento
      if (acao === 'aceito') {
        const negociacao = negociacoes.find(n => n.id === negociacaoId);
        if (negociacao) {
          const { error: jobError } = await supabase
            .from('jobs')
            .update({ status: 'em_andamento' })
            .eq('id', negociacao.job_id);

          if (jobError) throw jobError;
        }
      }

      // Se recusado, liberar job para outros montadores
      if (acao === 'recusado') {
        const negociacao = negociacoes.find(n => n.id === negociacaoId);
        if (negociacao) {
          const { error: jobError } = await supabase
            .from('jobs')
            .update({ 
              status: 'aberto',
              montador_id: null 
            })
            .eq('id', negociacao.job_id);

          if (jobError) throw jobError;
        }
      }

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
    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({ status: 'aceito' })
        .eq('id', negociacaoId);

      if (error) throw error;

      // Atualizar job para em_andamento
      const negociacao = negociacoes.find(n => n.id === negociacaoId);
      if (negociacao) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ status: 'em_andamento' })
          .eq('id', negociacao.job_id);

        if (jobError) throw jobError;
      }

      toast({
        title: "Contra-proposta aceita!",
        description: "O trabalho foi confirmado!"
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

  const recusarContraproposta = async (negociacaoId: string) => {
    try {
      const { error } = await supabase
        .from('negociacoes')
        .update({ status: 'recusado' })
        .eq('id', negociacaoId);

      if (error) throw error;

      // Liberar job para outros montadores
      const negociacao = negociacoes.find(n => n.id === negociacaoId);
      if (negociacao) {
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ 
            status: 'aberto',
            montador_id: null 
          })
          .eq('id', negociacao.job_id);

        if (jobError) throw jobError;
      }

      toast({
        title: "Contra-proposta recusada",
        description: "O trabalho foi liberado para outros montadores"
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

  return {
    negociacoes,
    loading,
    refetch: fetchNegociacoes,
    enviarOrcamento,
    responderOrcamento,
    aceitarContraproposta,
    recusarContraproposta
  };
};