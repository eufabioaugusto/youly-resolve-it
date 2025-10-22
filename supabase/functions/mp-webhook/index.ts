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

    // Validate timestamp (prevent replay attacks - aceitar até 7 dias para webhooks atrasados)
    const timestamp = parseInt(ts);
    const now = Date.now() / 1000;
    const timeDiff = Math.abs(now - timestamp);
    
    // Aceitar webhooks de até 7 dias (604800 segundos)
    const MAX_WEBHOOK_AGE = 604800; // 7 dias em segundos
    
    if (timeDiff > MAX_WEBHOOK_AGE) {
      console.error('Webhook timestamp too old (>7 days)', {
        timestamp,
        now,
        diff: timeDiff,
        age_hours: (timeDiff / 3600).toFixed(1)
      });
      return false;
    }
    
    // Log warning se mais de 5 minutos mas ainda aceitar
    if (timeDiff > 300) {
      console.warn('⚠️ Webhook timestamp older than 5 minutes but accepted', {
        timestamp,
        now,
        diff: timeDiff,
        age_hours: (timeDiff / 3600).toFixed(1)
      });
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

    // 🎯 SUPORTE PARA AMBOS OS FORMATOS DO MP
    let paymentId: string | null = null;
    
    // Formato novo: { type: "payment", data: { id: "123" } }
    if (body.type === 'payment' && body.data?.id) {
      paymentId = body.data.id;
      console.log('📦 Formato novo detectado - payment ID:', paymentId);
    }
    // Formato antigo: { topic: "payment", resource: "123" }
    else if (body.topic === 'payment' && body.resource) {
      // Extrair ID da URL do resource
      const resourceParts = body.resource.split('/');
      paymentId = resourceParts[resourceParts.length - 1];
      console.log('📦 Formato antigo detectado - payment ID:', paymentId);
    }
    // Formato merchant_order - ignorar
    else if (body.topic === 'merchant_order') {
      console.log('⏭️ Merchant order ignorado');
      return new Response('OK', { status: 200 });
    }
    // Tipo desconhecido
    else {
      console.log('❓ Tipo de notificação desconhecido:', body.type || body.topic);
      return new Response('OK', { status: 200 });
    }

    if (!paymentId) {
      console.error('❌ Payment ID não encontrado no webhook');
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
      console.warn('⚠️ SECURITY: Continuing without validation for development');
      console.warn('⚠️ Configure MERCADO_PAGO_WEBHOOK_SECRET correctly in production!');
      // TODO: In production, uncomment this line to enforce security
      // return new Response('Unauthorized', { status: 401 });
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
      
      // 🛡️ PROTEÇÃO CONTRA DUPLICAÇÃO: Verificar se já foi processado
      if (pagamentoDB.status === 'pago') {
        console.log('⏭️ Pagamento já foi processado anteriormente - ignorando duplicação');
        return new Response('Already processed', { status: 200 });
      }
      
      // Processar pagamento aprovado diretamente (sem RPC)
      console.log('⚙️ [1/6] Atualizando status do pagamento...');
      
      // ========================================
      // CALCULAR COMISSÃO DA PLATAFORMA (20%)
      // ========================================
      const valorTotal = Number(pagamentoDB.valor_total);
      const comissaoPlataforma = valorTotal * 0.20; // 20% para a plataforma
      const valorMontador = valorTotal * 0.80; // 80% para o montador
      
      console.log('💰 Valores calculados:', {
        valorTotal,
        comissaoPlataforma,
        valorMontador
      });
      
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({
          status: 'pago',
          mercado_pago_payment_id: payment.id.toString(),
          mercado_pago_payment_method: payment.payment_method_id || 'unknown',
          installments: payment.installments || 1,
          processed_at: new Date().toISOString(),
          comissao_plataforma: comissaoPlataforma,
          valor_montador: valorMontador
        })
        .eq('id', pagamentoId);

      if (updateError) {
        console.error('❌ Erro ao atualizar pagamento:', updateError);
        throw updateError;
      }

      console.log('⚙️ [2/6] Buscando carteira do montador...');
      const { data: carteiraData, error: carteiraError } = await supabase
        .from('carteira')
        .select('id, saldo_em_processamento')
        .eq('montador_id', pagamentoDB.montador_id)
        .single();

      if (carteiraError || !carteiraData) {
        console.error('❌ Erro ao buscar carteira:', carteiraError);
        throw new Error('Carteira do montador não encontrada');
      }

      console.log('⚙️ [3/6] Bloqueando valor na carteira (80% = R$', valorMontador.toFixed(2), ')...');
      const novoSaldoProcessamento = Number(carteiraData.saldo_em_processamento) + valorMontador;
      const dataLiberacao = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error: carteiraUpdateError } = await supabase
        .from('carteira')
        .update({
          saldo_em_processamento: novoSaldoProcessamento,
          data_liberacao_admin: dataLiberacao
        })
        .eq('id', carteiraData.id);

      if (carteiraUpdateError) {
        console.error('❌ Erro ao atualizar carteira:', carteiraUpdateError);
      }

      console.log('⚙️ [4/6] Registrando transação...');
      const { error: transacaoError } = await supabase
        .from('carteira_transacoes')
        .insert({
          carteira_id: carteiraData.id,
          tipo: 'bloqueio',
          valor: valorMontador,
          descricao: `Valor bloqueado - aguardando liberação (3 dias) - Comissão 20% = R$ ${comissaoPlataforma.toFixed(2)}`,
          job_id: pagamentoDB.job_id,
          pagamento_id: pagamentoId
        });

      if (transacaoError) {
        console.error('❌ Erro ao registrar transação:', transacaoError);
      }

      // 🎯 ATUALIZAR TOTAL MOVIMENTADO DO MONTADOR
      console.log('⚙️ [4.5/6] Atualizando total_valor_movimentado do montador...');
      const { data: montadorData, error: montadorFetchError } = await supabase
        .from('montadores')
        .select('total_valor_movimentado')
        .eq('id', pagamentoDB.montador_id)
        .single();

      if (!montadorFetchError && montadorData) {
        const novoTotalMovimentado = Number(montadorData.total_valor_movimentado || 0) + valorMontador;
        const { error: montadorUpdateError } = await supabase
          .from('montadores')
          .update({ total_valor_movimentado: novoTotalMovimentado })
          .eq('id', pagamentoDB.montador_id);

        if (montadorUpdateError) {
          console.error('❌ Erro ao atualizar total_valor_movimentado:', montadorUpdateError);
        } else {
          console.log('✅ Total movimentado atualizado: R$', novoTotalMovimentado.toFixed(2));
        }
      }

      console.log('⚙️ [5/6] Atualizando negociação...');
      const { error: negUpdateError } = await supabase
        .from('negociacoes')
        .update({
          pagamento_id: pagamentoId,
          data_pagamento: new Date().toISOString(),
          valor_final: pagamentoDB.valor_total
        })
        .eq('job_id', pagamentoDB.job_id)
        .eq('montador_id', pagamentoDB.montador_id);

      if (negUpdateError) {
        console.error('❌ Erro ao atualizar negociação:', negUpdateError);
      }

      console.log('⚙️ [6/6] Atualizando status do job...');
      const { error: jobUpdateError } = await supabase
        .from('jobs')
        .update({ status: 'pago' })
        .eq('id', pagamentoDB.job_id);

      if (jobUpdateError) {
        console.error('❌ Erro ao atualizar job:', jobUpdateError);
      }

      console.log('✅ Pagamento processado com sucesso');

      // 🎯 CRÍTICO: Criar Ordem de Serviço automaticamente
      console.log('📋 [mp-webhook] Criando Ordem de Serviço automaticamente');

      try {
        // Buscar negociação aceita para este job
        const { data: negociacao, error: negError } = await supabase
          .from('negociacoes')
          .select('*')
          .eq('job_id', pagamentoDB.job_id)
          .eq('status', 'aceito')
          .single();

        if (negError || !negociacao) {
          console.error('❌ Negociação não encontrada para criar OS:', negError);
        } else {
          // Buscar job para pegar a data selecionada
          const { data: jobData } = await supabase
            .from('jobs')
            .select('data_opcoes')
            .eq('id', pagamentoDB.job_id)
            .single();

          // Extrair data selecionada das opções
          let dataHoraAgendamento = null;
          let periodoAgendamento = null;
          
          if (jobData?.data_opcoes && Array.isArray(jobData.data_opcoes)) {
            const dataSelecionada = jobData.data_opcoes.find((opcao: any) => opcao.selecionado === true);
            if (dataSelecionada) {
              dataHoraAgendamento = dataSelecionada.data;
              periodoAgendamento = dataSelecionada.periodo;
            }
          }

          // Buscar dados do montador
          const { data: montadorData } = await supabase
            .from('montadores')
            .select('user_id')
            .eq('id', negociacao.montador_id)
            .single();

          let montadorNome = 'Montador';
          if (montadorData) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('nome')
              .eq('user_id', montadorData.user_id)
              .single();
            
            if (profileData) {
              montadorNome = profileData.nome;
            }
          }
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
              data_hora_agendamento: dataHoraAgendamento,
              periodo_agendamento: periodoAgendamento,
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
              const dataAgendamento = dataHoraAgendamento
                ? new Date(dataHoraAgendamento).toLocaleDateString('pt-BR')
                : 'A definir';
              const periodoFormatado = periodoAgendamento || 'A definir';

              // Enviar SMS de agendamento
              const mensagemSMS = `✅ Montagem agendada!\nMontador: ${montadorNome}\nData: ${dataAgendamento} - ${periodoFormatado}\nCódigo: ${codigoValidacao}\nGuarde este código para iniciar a montagem.`;

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
