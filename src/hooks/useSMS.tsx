import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type TipoSMS = 'agendamento' | 'a_caminho' | 'codigo_validacao' | 'pesquisa';

export function useSMS() {
  const [loading, setLoading] = useState(false);

  const enviarSMS = async (
    telefone: string,
    mensagem: string,
    tipo: TipoSMS,
    ordem_servico_id?: string
  ) => {
    console.log('🚀 [useSMS] Enviando SMS', { telefone, tipo, ordem_servico_id });
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('sms-send', {
        body: {
          telefone,
          mensagem,
          tipo,
          ordem_servico_id,
        },
      });

      if (error) throw error;

      console.log('✅ [useSMS] SMS processado', data);
      
      if (data.success) {
        toast.success('SMS enviado com sucesso!');
      } else {
        toast.info('SMS registrado mas não enviado (gateway não configurado)');
      }

      return data;
    } catch (error: any) {
      console.error('❌ [useSMS] Erro ao enviar SMS', error);
      toast.error('Erro ao enviar SMS');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const enviarSMSAgendamento = async (
    telefone: string,
    montadorNome: string,
    codigo: string,
    data: string,
    periodo: string
  ) => {
    const mensagem = `✅ Montagem agendada! Montador: ${montadorNome}\nData: ${data} - ${periodo}\nCódigo de validação: ${codigo}\nGuarde este código para iniciar a montagem.`;
    
    return enviarSMS(telefone, mensagem, 'agendamento');
  };

  const enviarSMSACaminho = async (
    telefone: string,
    montadorNome: string,
    codigo: string,
    ordem_servico_id: string
  ) => {
    const mensagem = `🚗 ${montadorNome} está a caminho!\nCódigo: ${codigo}\nLembre-se: este código ativa a garantia de 30 dias.`;
    
    return enviarSMS(telefone, mensagem, 'a_caminho', ordem_servico_id);
  };

  const enviarSMSPesquisa = async (
    telefone: string,
    linkPesquisa: string,
    montadorNome: string
  ) => {
    const mensagem = `⭐ Como foi sua experiência com ${montadorNome}? Avalie o serviço: ${linkPesquisa}`;
    
    return enviarSMS(telefone, mensagem, 'pesquisa');
  };

  return {
    loading,
    enviarSMS,
    enviarSMSAgendamento,
    enviarSMSACaminho,
    enviarSMSPesquisa,
  };
}
