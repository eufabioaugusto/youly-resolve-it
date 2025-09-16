import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { notificarNegociacao } from '@/lib/notifications';

// Cache local para negociações
const negociacoesCache = new Map<string, any>();

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

      // Limpar cache para forçar recarregamento
      negociacoesCache.clear();

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

      // Limpar cache para forçar recarregamento
      negociacoesCache.clear();

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
      // Verificar cache primeiro
      const cacheKey = `negociacao_${jobId}`;
      if (negociacoesCache.has(cacheKey)) {
        console.log('Negociação encontrada no cache:', jobId);
        return negociacoesCache.get(cacheKey);
      }

      console.log('Buscando negociação para jobId:', jobId);
      
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

      if (error) {
        console.error('Erro na consulta de negociação:', error);
        throw error;
      }
      
      if (data) {
        console.log('Negociação encontrada:', data);
        // Armazenar no cache por 5 minutos
        negociacoesCache.set(cacheKey, data);
        setTimeout(() => negociacoesCache.delete(cacheKey), 5 * 60 * 1000);
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar negociação:', error);
      return null;
    }
  };

  // Criar nova negociação
  const criarNegociacao = async (jobId: string, montadorId: string, clienteId: string) => {
    try {
      console.log('Criando negociação:', { jobId, montadorId, clienteId });
      
      const { data, error } = await supabase
        .from('negociacoes')
        .insert({
          job_id: jobId,
          montador_id: montadorId,
          cliente_id: clienteId,
          status: 'pendente'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Negociação criada:', data);

      // Buscar dados para notificação
      const { data: montadorData } = await supabase
        .from('montadores')
        .select('user_id')
        .eq('id', montadorId)
        .single();

      const { data: jobData } = await supabase
        .from('jobs')
        .select('descricao')
        .eq('id', jobId)
        .single();

      const { data: clienteData } = await supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', user?.id)
        .single();

      // Enviar notificação para o montador
      if (montadorData && jobData && clienteData) {
        await notificarNegociacao(
          montadorData.user_id,
          clienteData.nome,
          jobData.descricao
        );
      }

      return data;
    } catch (error: any) {
      console.error('Erro ao criar negociação:', error);
      toast({
        title: "Erro ao criar negociação",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    negociacoes,
    loading,
    refetch: fetchNegociacoes,
    fetchNegociacao,
    criarNegociacao,
    enviarOrcamento,
    responderOrcamento,
    aceitarContraproposta,
    recusarContraproposta
  };
};