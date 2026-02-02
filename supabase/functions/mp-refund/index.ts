import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

// Categorias de motivo válidas
const MOTIVO_CATEGORIAS_VALIDAS = [
  'nao_compareceu',
  'defeito_produto',
  'servico_incompleto',
  'desistencia_cliente',
  'erro_sistema',
  'outro'
];

interface EstornoRequest {
  pagamentoId: string;
  motivo: string;
  motivoCategoria: string;
  valorEstorno?: number; // Opcional para estorno parcial
  forcarAprovacao?: boolean; // Para admins forçarem aprovação
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. VALIDAR AUTENTICAÇÃO
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);

    if (claimsError || !claimsData?.user) {
      console.error('Erro ao validar token:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.user.id;
    console.log('🔐 Usuário autenticado:', userId);

    // 2. VALIDAR PARÂMETROS
    const body: EstornoRequest = await req.json();
    const { pagamentoId, motivo, motivoCategoria, valorEstorno, forcarAprovacao } = body;

    if (!pagamentoId) {
      return new Response(
        JSON.stringify({ error: 'pagamentoId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!motivo || motivo.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Motivo deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!motivoCategoria || !MOTIVO_CATEGORIAS_VALIDAS.includes(motivoCategoria)) {
      return new Response(
        JSON.stringify({ error: 'Categoria de motivo inválida', categorias_validas: MOTIVO_CATEGORIAS_VALIDAS }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. VERIFICAR PERMISSÃO DE ESTORNO
    const { data: permissao, error: permissaoError } = await supabase.rpc(
      'verificar_permissao_estorno',
      { p_pagamento_id: pagamentoId, p_user_id: userId }
    );

    if (permissaoError) {
      console.error('Erro ao verificar permissão:', permissaoError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissão de estorno' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📋 Permissão de estorno:', permissao);

    if (!permissao.permitido) {
      return new Response(
        JSON.stringify({ error: permissao.motivo }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. BUSCAR DADOS DO PAGAMENTO
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .select(`
        *,
        clientes!inner(id, user_id),
        montadores!inner(id, user_id),
        jobs!inner(id, descricao, ordem_servico_id)
      `)
      .eq('id', pagamentoId)
      .single();

    if (pagamentoError || !pagamento) {
      console.error('Erro ao buscar pagamento:', pagamentoError);
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. CALCULAR VALOR DO ESTORNO
    let valorFinalEstorno = valorEstorno || pagamento.valor_total;
    const percentualMaximo = permissao.percentual_maximo || 100;
    const valorMaximoPermitido = pagamento.valor_total * (percentualMaximo / 100);

    if (valorFinalEstorno > valorMaximoPermitido) {
      valorFinalEstorno = valorMaximoPermitido;
      console.log(`⚠️ Valor ajustado para máximo permitido: R$ ${valorFinalEstorno}`);
    }

    // Verificar se é admin tentando forçar aprovação
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: userId });
    const requerAprovacao = permissao.requer_aprovacao && !forcarAprovacao;

    // 6. VERIFICAR RATE LIMITING (1 solicitação por hora por pagamento)
    const { data: estornoRecente } = await supabase
      .from('estornos')
      .select('id, created_at')
      .eq('pagamento_id', pagamentoId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (estornoRecente && estornoRecente.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Já existe uma solicitação de estorno recente. Aguarde 1 hora para tentar novamente.',
          ultima_solicitacao: estornoRecente[0].created_at
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. CRIAR REGISTRO DE ESTORNO
    const tipoEstorno = valorFinalEstorno < pagamento.valor_total ? 'parcial' : 'total';
    const statusInicial = requerAprovacao ? 'solicitado' : 'processando';

    const { data: estorno, error: estornoError } = await supabase
      .from('estornos')
      .insert({
        pagamento_id: pagamentoId,
        job_id: pagamento.job_id,
        ordem_servico_id: pagamento.jobs?.ordem_servico_id,
        cliente_id: pagamento.cliente_id,
        montador_id: pagamento.montador_id,
        valor_estorno: valorFinalEstorno,
        valor_original: pagamento.valor_total,
        tipo: tipoEstorno,
        motivo: motivo.trim(),
        motivo_categoria: motivoCategoria,
        solicitado_por: userId,
        status: statusInicial,
        metadata: {
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent'),
          is_admin_request: isAdmin,
          permissao_original: permissao
        }
      })
      .select()
      .single();

    if (estornoError) {
      console.error('Erro ao criar estorno:', estornoError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar solicitação de estorno' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📝 Estorno criado:', estorno.id, 'Status:', statusInicial);

    // 8. SE NÃO REQUER APROVAÇÃO, PROCESSAR AUTOMATICAMENTE
    if (!requerAprovacao) {
      console.log('🚀 Processando estorno automaticamente...');

      // Atualizar status do pagamento
      await supabase
        .from('pagamentos')
        .update({ status: 'estorno_processando' })
        .eq('id', pagamentoId);

      // Chamar API do Mercado Pago
      const mpPaymentId = pagamento.mercado_pago_payment_id;
      
      if (!mpPaymentId) {
        // Sem ID do MP, não podemos estornar automaticamente
        await supabase
          .from('estornos')
          .update({ 
            status: 'falhou',
            error_message: 'Pagamento não possui ID do Mercado Pago',
            processed_at: new Date().toISOString()
          })
          .eq('id', estorno.id);

        return new Response(
          JSON.stringify({ 
            error: 'Não foi possível processar o estorno automaticamente. ID do Mercado Pago não encontrado.',
            estorno_id: estorno.id
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar chave de idempotência
      const idempotencyKey = `refund-${pagamentoId}-${Date.now()}`;

      try {
        // Chamar API de estorno do Mercado Pago
        const refundBody: { amount?: number } = {};
        if (tipoEstorno === 'parcial') {
          refundBody.amount = valorFinalEstorno;
        }

        console.log('📤 Chamando API MP para estorno:', {
          payment_id: mpPaymentId,
          tipo: tipoEstorno,
          valor: valorFinalEstorno
        });

        const mpResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mercadoPagoAccessToken}`,
              'Content-Type': 'application/json',
              'X-Idempotency-Key': idempotencyKey
            },
            body: Object.keys(refundBody).length > 0 ? JSON.stringify(refundBody) : undefined
          }
        );

        const mpResult = await mpResponse.json();
        console.log('📥 Resposta MP:', mpResult);

        if (!mpResponse.ok) {
          // Estorno falhou no Mercado Pago
          await supabase
            .from('estornos')
            .update({
              status: 'falhou',
              error_message: mpResult.message || 'Erro ao processar estorno no Mercado Pago',
              processed_at: new Date().toISOString()
            })
            .eq('id', estorno.id);

          await supabase
            .from('pagamentos')
            .update({ status: 'estorno_falhou' })
            .eq('id', pagamentoId);

          return new Response(
            JSON.stringify({
              error: 'Falha ao processar estorno no Mercado Pago',
              detalhes: mpResult.message,
              estorno_id: estorno.id
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Estorno aprovado no MP - processar no banco
        console.log('✅ Estorno aprovado no MP:', mpResult.id);

        const { error: processError } = await supabase.rpc(
          'processar_estorno_completo',
          { p_estorno_id: estorno.id, p_mp_refund_id: mpResult.id?.toString() }
        );

        if (processError) {
          console.error('Erro ao processar estorno no banco:', processError);
          // Mesmo que falhe no banco, o estorno foi feito no MP
          // Marcar como concluído manualmente
          await supabase
            .from('estornos')
            .update({
              status: 'concluido',
              mercado_pago_refund_id: mpResult.id?.toString(),
              processed_at: new Date().toISOString(),
              error_message: 'Estorno realizado no MP, mas houve erro no processamento interno: ' + processError.message
            })
            .eq('id', estorno.id);
        }

        return new Response(
          JSON.stringify({
            sucesso: true,
            mensagem: 'Estorno processado com sucesso',
            estorno_id: estorno.id,
            mercado_pago_refund_id: mpResult.id,
            valor_estornado: valorFinalEstorno,
            tipo: tipoEstorno
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (mpError: any) {
        console.error('Erro ao chamar API MP:', mpError);
        
        await supabase
          .from('estornos')
          .update({
            status: 'falhou',
            error_message: mpError.message || 'Erro de comunicação com Mercado Pago',
            processed_at: new Date().toISOString()
          })
          .eq('id', estorno.id);

        return new Response(
          JSON.stringify({
            error: 'Erro ao comunicar com Mercado Pago',
            estorno_id: estorno.id
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. ESTORNO REQUER APROVAÇÃO - RETORNAR STATUS
    return new Response(
      JSON.stringify({
        sucesso: true,
        mensagem: 'Solicitação de estorno criada e aguardando aprovação administrativa',
        estorno_id: estorno.id,
        status: 'solicitado',
        valor_solicitado: valorFinalEstorno,
        tipo: tipoEstorno,
        requer_aprovacao: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro no processamento de estorno:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
