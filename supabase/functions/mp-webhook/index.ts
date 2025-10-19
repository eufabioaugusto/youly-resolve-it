import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;
const mercadoPagoWebhookSecret = Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

// SECURITY FIX: Add signature validation function
async function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): Promise<boolean> {
  // If webhook secret is not configured, log warning but continue
  // (for backward compatibility during setup)
  if (!mercadoPagoWebhookSecret) {
    console.warn('⚠️ SECURITY WARNING: MERCADO_PAGO_WEBHOOK_SECRET not configured');
    console.warn('Webhook signature validation is DISABLED - configure secret immediately!');
    return true; // Continue without validation (not recommended)
  }

  if (!xSignature || !xRequestId) {
    console.error('Missing signature headers');
    return false;
  }

  try {
    // Parse signature header: "ts=123456789,v1=abc123..."
    const parts = xSignature.split(',');
    const tsPart = parts.find(p => p.startsWith('ts='));
    const hashPart = parts.find(p => p.startsWith('v1='));

    if (!tsPart || !hashPart) {
      console.error('Invalid signature format');
      return false;
    }

    const ts = tsPart.split('=')[1];
    const receivedHash = hashPart.split('=')[1];

    // Validate timestamp (prevent replay attacks - 5 minute window)
    const timestamp = parseInt(ts);
    const now = Date.now() / 1000;
    if (Math.abs(now - timestamp) > 300) {
      console.error('Webhook timestamp too old or too new', {
        timestamp,
        now,
        diff: Math.abs(now - timestamp)
      });
      return false;
    }

    // Create validation string according to Mercado Pago spec
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Generate HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(mercadoPagoWebhookSecret);
    const messageData = encoder.encode(manifest);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const computedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedHash !== receivedHash) {
      console.error('Signature validation failed', {
        computed: computedHash,
        received: receivedHash
      });
      return false;
    }

    console.log('✅ Webhook signature validated successfully');
    return true;

  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

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

    // SECURITY FIX: Validate webhook signature
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    const isValid = await validateWebhookSignature(
      xSignature,
      xRequestId,
      paymentId.toString()
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature - possible attack attempt');
      return new Response('Unauthorized', { status: 401 });
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

      console.log('✅ Pagamento processado com sucesso');

      // 🎯 CRÍTICO: Criar Ordem de Serviço automaticamente
      console.log('📋 [mp-webhook] Criando Ordem de Serviço automaticamente');

      try {
        // Buscar negociação aceita para este job
        const { data: negociacao, error: negError } = await supabase
          .from('negociacoes')
          .select(`
            *,
            montadores!inner(id, user_id, profiles:user_id!inner(nome))
          `)
          .eq('job_id', pagamentoDB.job_id)
          .eq('status', 'aceito')
          .single();

        if (negError || !negociacao) {
          console.error('❌ Negociação não encontrada para criar OS:', negError);
        } else {
          // Gerar código de validação
          const { data: codigoData } = await supabase.rpc('gerar_codigo_validacao');
          const codigoValidacao = codigoData || 'XXXXXX';

          // Criar Ordem de Serviço
          const { data: novaOS, error: osError } = await supabase
            .from('ordem_servico')
            .insert({
              negociacao_id: negociacao.id,
              job_id: pagamentoDB.job_id,
              montador_id: pagamentoDB.montador_id,
              cliente_id: pagamentoDB.cliente_id,
              status: 'pendente',
              codigo_validacao: codigoValidacao,
              data_hora_agendamento: negociacao.data_selecionada_montador?.data_hora,
              periodo_agendamento: negociacao.data_selecionada_montador?.periodo,
            })
            .select()
            .single();

          if (osError) {
            console.error('❌ Erro ao criar OS:', osError);
          } else {
            console.log('✅ OS criada com sucesso:', novaOS.id);

            // Atualizar job com ordem_servico_id
            await supabase
              .from('jobs')
              .update({ ordem_servico_id: novaOS.id })
              .eq('id', pagamentoDB.job_id);

            // Buscar telefone do cliente
            const { data: clienteData } = await supabase
              .from('clientes')
              .select('id, profiles!inner(telefone, nome)')
              .eq('id', pagamentoDB.cliente_id)
              .single();

            const telefoneCliente = clienteData?.profiles?.telefone;
            const nomeCliente = clienteData?.profiles?.nome;

            if (telefoneCliente) {
              // Formatar data e período
              const dataAgendamento = negociacao.data_selecionada_montador?.data_hora
                ? new Date(negociacao.data_selecionada_montador.data_hora).toLocaleDateString('pt-BR')
                : 'A definir';
              const periodoAgendamento = negociacao.data_selecionada_montador?.periodo || 'A definir';

              // Enviar SMS de agendamento
              const mensagemSMS = `✅ Montagem agendada!\nMontador: ${negociacao.montadores.profiles.nome}\nData: ${dataAgendamento} - ${periodoAgendamento}\nCódigo: ${codigoValidacao}\nGuarde este código para iniciar a montagem.`;

              const { error: smsError } = await supabase.functions.invoke('sms-send', {
                body: {
                  telefone: telefoneCliente,
                  mensagem: mensagemSMS,
                  tipo: 'agendamento',
                  ordem_servico_id: novaOS.id,
                },
              });

              if (smsError) {
                console.error('❌ Erro ao enviar SMS de agendamento:', smsError);
              } else {
                console.log('✅ SMS de agendamento enviado para', telefoneCliente);
              }
            } else {
              console.warn('⚠️ Telefone do cliente não encontrado para enviar SMS');
            }
          }
        }
      } catch (osCreationError: any) {
        console.error('❌ Erro ao criar OS automaticamente:', osCreationError);
      }

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

  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Erro interno' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
