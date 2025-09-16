import { supabase } from '@/integrations/supabase/client';

export const criarNotificacao = async (
  userId: string,
  tipo: 'sistema' | 'job' | 'pagamento' | 'saque' | 'negociacao',
  mensagem: string
) => {
  try {
    const { error } = await supabase
      .from('notificacoes')
      .insert({
        user_id: userId,
        tipo,
        mensagem,
        lida: false
      });

    if (error) {
      console.error('Erro ao criar notificação:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return false;
  }
};

export const notificarNegociacao = async (
  montadorUserId: string,
  clienteNome: string,
  jobDescricao: string
) => {
  return criarNotificacao(
    montadorUserId,
    'sistema',
    `${clienteNome} iniciou uma negociação: ${jobDescricao}`
  );
};