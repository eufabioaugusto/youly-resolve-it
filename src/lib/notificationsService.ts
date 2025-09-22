import { supabase } from '@/integrations/supabase/client';

export const createNotification = async (
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
        mensagem
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

export const notifyNegociacaoUpdate = async (
  negociacaoData: any,
  acao: string,
  valor?: number
) => {
  try {
    // Buscar dados dos usuários envolvidos separadamente
    const [montadorResult, clienteResult] = await Promise.all([
      supabase
        .from('montadores')
        .select('user_id')
        .eq('id', negociacaoData.montador_id)
        .single(),
      supabase
        .from('clientes')
        .select('user_id')
        .eq('id', negociacaoData.cliente_id)
        .single()
    ]);

    if (montadorResult.error || clienteResult.error) {
      console.error('Erro ao buscar dados dos usuários:', {
        montador: montadorResult.error,
        cliente: clienteResult.error
      });
      return;
    }

    // Buscar nomes dos perfis
    const [montadorProfile, clienteProfile] = await Promise.all([
      supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', montadorResult.data.user_id)
        .single(),
      supabase
        .from('profiles')
        .select('nome')
        .eq('user_id', clienteResult.data.user_id)
        .single()
    ]);

    const montadorNome = montadorProfile.data?.nome || 'Montador';
    const clienteNome = clienteProfile.data?.nome || 'Cliente';
    
    let mensagemMontador = '';
    let mensagemCliente = '';

    switch (acao) {
      case 'orcamento_enviado':
        mensagemCliente = `${montadorNome} enviou um orçamento de R$ ${valor?.toFixed(2)} para seu trabalho.`;
        break;
      
      case 'aceito':
        mensagemMontador = `${clienteNome} aceitou seu orçamento! O trabalho foi confirmado.`;
        break;
      
      case 'recusado':
        mensagemMontador = `${clienteNome} recusou seu orçamento.`;
        break;
      
      case 'contra_proposta':
        mensagemMontador = `${clienteNome} fez uma contra-proposta de R$ ${valor?.toFixed(2)}.`;
        break;
      
      case 'aceito_contraproposta':
        mensagemCliente = `${montadorNome} aceitou sua contra-proposta! O trabalho foi confirmado.`;
        break;
    }

    // Enviar notificações
    const promises = [];
    
    if (mensagemMontador) {
      promises.push(createNotification(montadorResult.data.user_id, 'negociacao', mensagemMontador));
    }
    
    if (mensagemCliente) {
      promises.push(createNotification(clienteResult.data.user_id, 'negociacao', mensagemCliente));
    }

    await Promise.all(promises);
    
  } catch (error) {
    console.error('Erro ao enviar notificações de negociação:', error);
  }
};