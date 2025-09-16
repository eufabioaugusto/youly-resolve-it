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
    
    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    // Verificar se é notificação de pagamento
    if (body.type !== 'payment') {
      console.log('Tipo de notificação ignorado:', body.type);
      return new Response('OK', { status: 200 });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.log('Payment ID não encontrado no webhook');
      return new Response('Payment ID not found', { status: 400 });
    }

    // Buscar dados do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!mpResponse.ok) {
      console.error('Erro ao buscar pagamento no MP:', mpResponse.status);
      return new Response('Error fetching payment', { status: 500 });
    }

    const payment = await mpResponse.json();
    console.log('Dados do pagamento MP:', {
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      transaction_amount: payment.transaction_amount
    });

    const pagamentoId = payment.external_reference;
    if (!pagamentoId) {
      console.log('External reference não encontrado');
      return new Response('External reference not found', { status: 400 });
    }

    // Buscar pagamento no banco
    const { data: pagamentoDB } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('id', pagamentoId)
      .single();

    if (!pagamentoDB) {
      console.log('Pagamento não encontrado no banco:', pagamentoId);
      return new Response('Payment not found in database', { status: 404 });
    }

    // Processar baseado no status
    if (payment.status === 'approved') {
      console.log('Processando pagamento aprovado');
      
      // Chamar função para processar pagamento aprovado
      const { error } = await supabase.rpc('processar_pagamento_aprovado', {
        p_pagamento_id: pagamentoId,
        p_mp_payment_id: payment.id.toString(),
        p_mp_payment_method: payment.payment_method_id || 'unknown',
        p_installments: payment.installments || 1
      });

      if (error) {
        console.error('Erro ao processar pagamento aprovado:', error);
        throw error;
      }

      console.log('Pagamento processado com sucesso');
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Atualizar status como rejeitado
      await supabase
        .from('pagamentos')
        .update({
          status: 'rejeitado',
          mercado_pago_payment_id: payment.id.toString(),
          failure_reason: payment.status_detail,
          processed_at: new Date().toISOString()
        })
        .eq('id', pagamentoId);

      console.log('Pagamento rejeitado/cancelado');
    } else {
      console.log('Status do pagamento não processado:', payment.status);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});