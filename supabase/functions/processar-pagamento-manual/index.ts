import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    let pagamentoId = body.pagamento_id;
    const mercadoPagoPaymentId = body.mercado_pago_payment_id;

    console.log('🔧 Processamento manual iniciado:', {
      pagamento_id: pagamentoId,
      mercado_pago_payment_id: mercadoPagoPaymentId
    });

    // Se tiver MP payment ID, buscar do MP
    let paymentData;
    if (mercadoPagoPaymentId) {
      console.log('📦 Buscando pagamento do Mercado Pago...');
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${mercadoPagoPaymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoAccessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!mpResponse.ok) {
        throw new Error(`Erro ao buscar pagamento no MP: ${mpResponse.status}`);
      }

      paymentData = await mpResponse.json();
      console.log('✅ Dados do MP:', {
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        external_reference: paymentData.external_reference
      });

      // Se o external_reference for diferente, usar ele
      if (paymentData.external_reference) {
        pagamentoId = paymentData.external_reference;
      }
    }

    // Buscar pagamento no banco
    const { data: pagamento, error: pagError } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('id', pagamentoId)
      .single();

    if (pagError || !pagamento) {
      throw new Error('Pagamento não encontrado no banco');
    }

    console.log('💳 Pagamento encontrado:', {
      id: pagamento.id,
      status_atual: pagamento.status,
      job_id: pagamento.job_id,
      valor: pagamento.valor_total
    });

    // Se já foi processado, retornar
    if (pagamento.status === 'aprovado') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Pagamento já foi processado anteriormente',
          pagamento
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Processar pagamento aprovado
    console.log('⚙️ Processando pagamento...');
    const { error: processError } = await supabase.rpc('processar_pagamento_aprovado', {
      p_pagamento_id: pagamento.id,
      p_mp_payment_id: mercadoPagoPaymentId || 'manual',
      p_mp_payment_method: paymentData?.payment_method_id || 'manual',
      p_installments: paymentData?.installments || 1
    });

    if (processError) {
      throw processError;
    }

    console.log('✅ Pagamento processado com sucesso');

    // Criar Ordem de Serviço
    console.log('📋 Criando Ordem de Serviço...');
    
    const { data: negociacao, error: negError } = await supabase
      .from('negociacoes')
      .select(`
        *,
        montadores!inner(id, user_id, profiles:user_id!inner(nome))
      `)
      .eq('job_id', pagamento.job_id)
      .eq('status', 'aceito')
      .single();

    if (negError || !negociacao) {
      throw new Error('Negociação não encontrada');
    }

    // Gerar código de validação
    const { data: codigoData } = await supabase.rpc('gerar_codigo_validacao');
    const codigoValidacao = codigoData || 'MANUAL';

    // Criar OS
    const { data: novaOS, error: osError } = await supabase
      .from('ordem_servico')
      .insert({
        negociacao_id: negociacao.id,
        job_id: pagamento.job_id,
        montador_id: pagamento.montador_id,
        cliente_id: pagamento.cliente_id,
        status: 'pendente',
        codigo_validacao: codigoValidacao,
        data_hora_agendamento: negociacao.data_selecionada_montador?.data_hora,
        periodo_agendamento: negociacao.data_selecionada_montador?.periodo,
      })
      .select()
      .single();

    if (osError) {
      console.error('❌ Erro ao criar OS:', osError);
      throw osError;
    }

    console.log('✅ OS criada:', novaOS.id);

    // Atualizar job com OS
    await supabase
      .from('jobs')
      .update({ ordem_servico_id: novaOS.id })
      .eq('id', pagamento.job_id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pagamento processado com sucesso!',
        pagamento_id: pagamento.id,
        ordem_servico_id: novaOS.id,
        codigo_validacao: codigoValidacao
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
