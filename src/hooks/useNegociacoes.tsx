import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useToast } from './use-toast';
import { notificarNegociacao } from '@/lib/notifications';
import { notifyNegociacaoUpdate } from '@/lib/notificationsService';

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
  const { profile, montadorProfile, clienteProfile } = useProfile();
  const { toast } = useToast();

  useEffect(() => {
    if (user && profile && (montadorProfile || clienteProfile)) {
      fetchNegociacoes();
    }
  }, [user, profile, montadorProfile, clienteProfile]);

  const fetchNegociacoes = async () => {
    try {
      console.log('🔍 [useNegociacoes] Iniciando busca de negociações');
      
      // Buscar negociações com informações dos jobs
      let query = supabase
        .from('negociacoes')
        .select(`
          *,
          jobs!inner (
            id,
            status,
            ordem_servico_id,
            descricao,
            endereco,
            categoria
          )
        `);
      
      // Filtrar baseado no papel do usuário
      if (profile?.role === 'montador' && montadorProfile) {
        query = query.eq('montador_id', montadorProfile.id);
        console.log('🎯 [useNegociacoes] Buscando para montador:', montadorProfile.id);
      } else if (profile?.role === 'client' && clienteProfile) {
        query = query.eq('cliente_id', clienteProfile.id);
        console.log('🎯 [useNegociacoes] Buscando para cliente:', clienteProfile.id);
      }
      
      const { data: negociacoesData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('📦 [useNegociacoes] Negociações recebidas:', negociacoesData?.length || 0);
      console.log('📋 [useNegociacoes] Dados completos:', negociacoesData);
      
      // Filtrar negociações que NÃO viraram ordem de serviço ainda
      const negociacoesAtivas = negociacoesData?.filter(neg => {
        const temOS = !!neg.jobs?.ordem_servico_id;
        const statusPago = neg.jobs?.status === 'pago';
        const statusAndamento = neg.jobs?.status === 'em_andamento';
        
        console.log(`🔍 [useNegociacoes] Negociação ${neg.id}:`, {
          temOS,
          statusPago,
          statusAndamento,
          ordem_servico_id: neg.jobs?.ordem_servico_id,
          job_status: neg.jobs?.status,
          deveMostrar: !temOS && !statusPago && !statusAndamento
        });
        
        return !temOS && !statusPago && !statusAndamento;
      }) || [];
      
      console.log('✅ [useNegociacoes] Negociações ATIVAS (filtradas):', negociacoesAtivas.length);
      setNegociacoes(negociacoesAtivas);
    } catch (error: any) {
      console.error('❌ [useNegociacoes] Erro ao buscar negociações:', error);
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

      // Buscar dados da negociação para notificação
      const { data: negociacao } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('id', negociacaoId)
        .single();

      if (negociacao) {
        await notifyNegociacaoUpdate(negociacao, 'orcamento_enviado', valor);
      }

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

      // Buscar dados da negociação para notificação
      const { data: negociacao } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('id', negociacaoId)
        .single();

      if (negociacao) {
        const valorParaNotificacao = acao === 'contra_proposta' ? valorContraproposta : 
                                   acao === 'aceito' ? negociacao.valor_proposto_cliente || negociacao.valor_proposto_montador : 
                                   undefined;
        
        const acaoNotificacao = acao === 'aceito' && negociacao.valor_proposto_cliente ? 'aceito_contraproposta' : acao;
        await notifyNegociacaoUpdate(negociacao, acaoNotificacao, valorParaNotificacao);
      }

      // Se aceito, atualizar status do job para 'aguardando_pagamento'
      if (acao === 'aceito') {
        if (negociacao) {
          const { error: jobError } = await supabase
            .from('jobs')
            .update({ status: 'aguardando_pagamento' })
            .eq('id', negociacao.job_id);

          if (jobError) throw jobError;
        }
      }

      // Limpar cache para forçar recarregamento
      negociacoesCache.clear();

      const acaoTexto = {
        'aceito': 'Orçamento aceito!',
        'recusado': 'Orçamento recusado',
        'contra_proposta': 'Contra-proposta enviada'
      };

      // Mensagens específicas baseadas no papel do usuário
      let description = '';
      if (acao === 'aceito') {
        if (profile?.role === 'client') {
          description = "O trabalho foi confirmado! Proceda com o pagamento.";
        } else {
          description = "O trabalho foi confirmado! O cliente foi notificado para efetuar o pagamento.";
        }
      } else if (acao === 'recusado') {
        description = "O trabalho foi liberado para outros montadores";
      } else {
        description = "O montador foi notificado da sua contra-proposta";
      }

      toast({
        title: acaoTexto[acao],
        description
      });

      return { success: true, acao };
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      return { success: false };
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
      
      // Buscar negociação básica primeiro
      const { data: negociacaoData, error: negociacaoError } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('job_id', jobId)
        .maybeSingle();

      if (negociacaoError) {
        console.error('Erro na consulta de negociação básica:', negociacaoError);
        throw negociacaoError;
      }

      if (!negociacaoData) {
        console.log('Negociação não encontrada para jobId:', jobId);
        return null;
      }

      // Buscar dados relacionados separadamente
      const [jobData, montadorData, clienteData] = await Promise.all([
        // Job
        supabase
          .from('jobs')
          .select('*')
          .eq('id', negociacaoData.job_id)
          .single(),
        
        // Montador com perfil
        supabase
          .from('montadores')
          .select('*')
          .eq('id', negociacaoData.montador_id)
          .single()
          .then(async (result) => {
            if (result.data) {
              const profileResult = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', result.data.user_id)
                .single();
              
              return {
                ...result,
                data: {
                  ...result.data,
                  profiles: profileResult.data
                }
              };
            }
            return result;
          }),
        
        // Cliente com perfil
        supabase
          .from('clientes')
          .select('*')
          .eq('id', negociacaoData.cliente_id)
          .single()
          .then(async (result) => {
            if (result.data) {
              const profileResult = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', result.data.user_id)
                .single();
              
              return {
                ...result,
                data: {
                  ...result.data,
                  profiles: profileResult.data
                }
              };
            }
            return result;
          })
      ]);

      // Combinar todos os dados
      const data = {
        ...negociacaoData,
        jobs: jobData.data,
        montadores: montadorData.data,
        clientes: clienteData.data
      };
      
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