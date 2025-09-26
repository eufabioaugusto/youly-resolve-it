import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useToast } from '@/hooks/use-toast';

export interface Pagamento {
  id: string;
  job_id: string;
  montador_id: string;
  cliente_id: string;
  valor_total: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  metodo: 'mercado_pago' | 'pix' | 'cartao';
  mercado_pago_preference_id?: string;
  mercado_pago_payment_id?: string;
  mercado_pago_payment_method?: string;
  installments?: number;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export function usePagamentos() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const criarCheckout = async (
    jobId: string,
    montadorId: string,
    valor: number
  ) => {
    if (!user || !profile) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return null;
    }

    // Buscar clienteId
    const { data: clienteData } = await supabase
      .from('clientes')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!clienteData) {
      toast({
        title: "Erro",
        description: "Cliente não encontrado",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('mp-create-checkout', {
        body: {
          jobId,
          montadorId,
          valor,
          clienteEmail: user.email,
          clienteNome: profile.nome,
          clienteId: clienteData.id
        }
      });

      if (error) {
        console.error('Erro ao criar checkout:', error);
        throw error;
      }

      console.log('Checkout criado:', data);
      return data;
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: "Erro ao criar pagamento",
        description: "Não foi possível criar o checkout. Tente novamente.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const buscarPagamento = async (pagamentoId: string): Promise<Pagamento | null> => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('id', pagamentoId)
        .single();

      if (error) {
        console.error('Erro ao buscar pagamento:', error);
        return null;
      }

      return data as Pagamento;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      return null;
    }
  };

  const buscarPagamentosPorJob = async (jobId: string): Promise<Pagamento[]> => {
    try {
      const { data, error } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pagamentos:', error);
        return [];
      }

      return data as Pagamento[];
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      return [];
    }
  };

  return {
    criarCheckout,
    buscarPagamento,
    buscarPagamentosPorJob,
    loading
  };
}