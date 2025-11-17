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
      } else if (profile?.role === 'client' && clienteProfile) {
        query = query.eq('cliente_id', clienteProfile.id);
      }
      
      const { data: negociacoesData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar negociações que NÃO viraram ordem de serviço ainda
      const negociacoesAtivas = negociacoesData?.filter(neg => {
        const temOS = !!neg.jobs?.ordem_servico_id;
        const statusPago = neg.jobs?.status === 'pago';
        const statusAndamento = neg.jobs?.status === 'em_andamento';
        
        return !temOS && !statusPago && !statusAndamento;
      }) || [];
      
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

      // Se recusado, liberar o job para outros montadores
      if (acao === 'recusado' && negociacao) {
        console.log('🔓 Liberando job após recusa:', negociacao.job_id);
        
        const { error: jobError } = await supabase
          .from('jobs')
          .update({ 
            status: 'aberto',
            montador_id: null
          })
          .eq('id', negociacao.job_id);

        if (jobError) {
          console.error('❌ Erro ao liberar job:', jobError);
          throw jobError;
        }
        
        console.log('✅ Job liberado com sucesso');
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

  const cancelarNegociacao = async (
    negociacaoId: string,
    motivoCancelamento?: string
  ) => {
    try {
      // Buscar dados da negociação antes de cancelar
      const { data: negociacao, error: fetchError } = await supabase
        .from('negociacoes')
        .select('*, jobs(*), montadores(user_id)')
        .eq('id', negociacaoId)
        .single();

      if (fetchError || !negociacao) {
        throw new Error('Negociação não encontrada');
      }

      // Atualizar negociação para cancelado
      const { error: negociacaoError } = await supabase
        .from('negociacoes')
        .update({
          status: 'cancelado',
          motivo_cancelamento: motivoCancelamento,
          data_cancelamento: new Date().toISOString(),
          cancelado_por: user?.id
        })
        .eq('id', negociacaoId);

      if (negociacaoError) throw negociacaoError;

      // Liberar job para outros montadores
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'aberto',
          montador_id: null
        })
        .eq('id', negociacao.job_id);

      if (jobError) throw jobError;

      // Notificar montador sobre o cancelamento
      if (negociacao.montadores?.user_id) {
        const { error: notifError } = await supabase
          .from('notificacoes')
          .insert({
            user_id: negociacao.montadores.user_id,
            tipo: 'negociacao',
            mensagem: `O cliente cancelou a negociação${motivoCancelamento ? ': ' + motivoCancelamento : ''}`,
            metadata: {
              negociacao_id: negociacaoId,
              job_id: negociacao.job_id
            }
          });

        if (notifError) {
          console.error('Erro ao enviar notificação:', notifError);
        }
      }

      // Limpar cache
      negociacoesCache.clear();

      toast({
        title: "Negociação cancelada",
        description: "O trabalho foi liberado para outros montadores."
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao cancelar negociação:', error);
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive"
      });
      return { success: false };
    }
  };

  // Buscar negociação individual
  const fetchNegociacao = async (jobId: string, forceRefresh: boolean = false) => {
    if (!user) return null;

    try {
      // Verificar cache primeiro (a menos que forceRefresh seja true)
      const cacheKey = `negociacao_${jobId}`;
      if (!forceRefresh && negociacoesCache.has(cacheKey)) {
        console.log('Negociação encontrada no cache:', jobId);
        return negociacoesCache.get(cacheKey);
      }
      
      // Se forceRefresh, limpar cache primeiro
      if (forceRefresh) {
        console.log('Forçando atualização da negociação:', jobId);
        negociacoesCache.delete(cacheKey);
      }

      console.log('Buscando negociação para jobId:', jobId);
      
      // Buscar negociações do job (pode haver múltiplas se houve recusa)
      const { data: negociacoesData, error: negociacaoError } = await supabase
        .from('negociacoes')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false }); // Mais recente primeiro
      
      if (negociacaoError) {
        console.error('Erro na consulta de negociação:', negociacaoError);
        throw negociacaoError;
      }
      
      if (!negociacoesData || negociacoesData.length === 0) {
        console.log('Nenhuma negociação encontrada para jobId:', jobId);
        return null;
      }
      
      // Priorizar negociação ATIVA (não recusada nem cancelada) e mais recente
      const negociacaoData = negociacoesData.find(n => 
        n.status !== 'recusado' && n.status !== 'cancelado'
      ) || negociacoesData[0];


      // Buscar dados relacionados separadamente com logs detalhados
      console.log('🔍 Buscando dados relacionados para negociação:', negociacaoData.id);
      console.log('Cliente ID:', negociacaoData.cliente_id);
      console.log('Montador ID:', negociacaoData.montador_id);
      
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
          .maybeSingle()
          .then(async (result) => {
            console.log('📦 Resultado montador:', result);
            if (result.error) {
              console.error('❌ Erro ao buscar montador:', result.error);
              return { data: null, error: result.error };
            }
            if (result.data) {
              const profileResult = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', result.data.user_id)
                .maybeSingle();
              
              console.log('📦 Profile do montador:', profileResult);
              
              return {
                data: {
                  ...result.data,
                  profiles: profileResult.data
                },
                error: null
              };
            }
            return { data: null, error: null };
          }),
        
        // Cliente com perfil
        supabase
          .from('clientes')
          .select('*')
          .eq('id', negociacaoData.cliente_id)
          .maybeSingle()
          .then(async (result) => {
            console.log('📦 Resultado cliente:', result);
            if (result.error) {
              console.error('❌ Erro ao buscar cliente:', result.error);
              return { data: null, error: result.error };
            }
            if (result.data) {
              const profileResult = await supabase
                .from('profiles')
                .select('nome')
                .eq('user_id', result.data.user_id)
                .maybeSingle();
              
              console.log('📦 Profile do cliente:', profileResult);
              
              return {
                data: {
                  ...result.data,
                  profiles: profileResult.data
                },
                error: null
              };
            }
            return { data: null, error: null };
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
    recusarContraproposta,
    cancelarNegociacao
  };
};