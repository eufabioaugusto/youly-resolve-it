import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export type EstornoStatus = 'solicitado' | 'aprovado' | 'processando' | 'concluido' | 'recusado' | 'falhou';
export type EstornoTipo = 'total' | 'parcial';
export type EstornoMotivoCategoria = 
  | 'nao_compareceu' 
  | 'defeito_produto' 
  | 'servico_incompleto'
  | 'desistencia_cliente' 
  | 'erro_sistema' 
  | 'outro';

export interface Estorno {
  id: string;
  pagamento_id: string;
  job_id: string;
  ordem_servico_id?: string;
  cliente_id: string;
  montador_id: string;
  valor_estorno: number;
  valor_original: number;
  tipo: EstornoTipo;
  motivo: string;
  motivo_categoria: EstornoMotivoCategoria;
  solicitado_por: string;
  aprovado_por?: string;
  status: EstornoStatus;
  mercado_pago_refund_id?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  processed_at?: string;
}

export interface PermissaoEstorno {
  permitido: boolean;
  motivo: string;
  requer_aprovacao?: boolean;
  percentual_maximo?: number;
}

export interface SolicitarEstornoParams {
  pagamentoId: string;
  motivo: string;
  motivoCategoria: EstornoMotivoCategoria;
  valorEstorno?: number;
}

export const MOTIVO_CATEGORIAS: { value: EstornoMotivoCategoria; label: string }[] = [
  { value: 'nao_compareceu', label: 'Montador não compareceu' },
  { value: 'defeito_produto', label: 'Defeito no produto/serviço' },
  { value: 'servico_incompleto', label: 'Serviço incompleto' },
  { value: 'desistencia_cliente', label: 'Desistência do cliente' },
  { value: 'erro_sistema', label: 'Erro no sistema' },
  { value: 'outro', label: 'Outro motivo' },
];

export function useEstorno() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const verificarPermissao = async (pagamentoId: string): Promise<PermissaoEstorno | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.rpc('verificar_permissao_estorno', {
        p_pagamento_id: pagamentoId,
        p_user_id: user.id
      });

      if (error) {
        console.error('Erro ao verificar permissão:', error);
        return null;
      }

      // O RPC retorna JSONB, fazer cast seguro
      const resultado = data as unknown as PermissaoEstorno;
      return resultado;
    } catch (error) {
      console.error('Erro ao verificar permissão de estorno:', error);
      return null;
    }
  };

  const solicitarEstorno = async (params: SolicitarEstornoParams) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não autenticado',
        variant: 'destructive'
      });
      return null;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Sessão inválida');
      }

      const response = await supabase.functions.invoke('mp-refund', {
        body: {
          pagamentoId: params.pagamentoId,
          motivo: params.motivo,
          motivoCategoria: params.motivoCategoria,
          valorEstorno: params.valorEstorno
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.error) {
        toast({
          title: 'Erro no estorno',
          description: data.error,
          variant: 'destructive'
        });
        return null;
      }

      toast({
        title: data.sucesso ? 'Sucesso' : 'Solicitação enviada',
        description: data.mensagem,
        variant: 'default'
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao solicitar estorno:', error);
      toast({
        title: 'Erro ao solicitar estorno',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buscarEstornos = async (filtros?: { status?: EstornoStatus; pagamentoId?: string }): Promise<Estorno[]> => {
    try {
      let query = supabase
        .from('estornos')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros?.pagamentoId) {
        query = query.eq('pagamento_id', filtros.pagamentoId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar estornos:', error);
        return [];
      }

      return data as Estorno[];
    } catch (error) {
      console.error('Erro ao buscar estornos:', error);
      return [];
    }
  };

  const buscarEstornoPorId = async (estornoId: string): Promise<Estorno | null> => {
    try {
      const { data, error } = await supabase
        .from('estornos')
        .select('*')
        .eq('id', estornoId)
        .single();

      if (error) {
        console.error('Erro ao buscar estorno:', error);
        return null;
      }

      return data as Estorno;
    } catch (error) {
      console.error('Erro ao buscar estorno:', error);
      return null;
    }
  };

  // Funções admin
  const aprovarEstorno = async (estornoId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('mp-refund-admin', {
        body: {
          estornoId,
          acao: 'aprovar'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Estorno aprovado',
        description: data.mensagem,
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao aprovar estorno:', error);
      toast({
        title: 'Erro ao aprovar estorno',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const recusarEstorno = async (estornoId: string, motivoRecusa: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('mp-refund-admin', {
        body: {
          estornoId,
          acao: 'recusar',
          motivoRecusa
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.error) {
        toast({
          title: 'Erro',
          description: data.error,
          variant: 'destructive'
        });
        return false;
      }

      toast({
        title: 'Estorno recusado',
        description: data.mensagem,
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao recusar estorno:', error);
      toast({
        title: 'Erro ao recusar estorno',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    verificarPermissao,
    solicitarEstorno,
    buscarEstornos,
    buscarEstornoPorId,
    aprovarEstorno,
    recusarEstorno
  };
}
