import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

interface AdminEstornoRequest {
  estornoId: string;
  acao: 'aprovar' | 'recusar';
  motivoRecusa?: string;
}

serve(async (req) => {
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
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // 2. VERIFICAR SE É ADMIN
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_uuid: userId });

    if (!isAdmin) {
      console.error('Usuário não é admin:', userId);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem aprovar/recusar estornos' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. VALIDAR PARÂMETROS
    const body: AdminEstornoRequest = await req.json();
    const { estornoId, acao, motivoRecusa } = body;

    if (!estornoId || !acao) {
      return new Response(
        JSON.stringify({ error: 'estornoId e acao são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (acao !== 'aprovar' && acao !== 'recusar') {
      return new Response(
        JSON.stringify({ error: 'Ação deve ser "aprovar" ou "recusar"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (acao === 'recusar' && (!motivoRecusa || motivoRecusa.trim().length < 10)) {
      return new Response(
        JSON.stringify({ error: 'Motivo da recusa deve ter pelo menos 10 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. BUSCAR ESTORNO
    const { data: estorno, error: estornoError } = await supabase
      .from('estornos')
      .select(`
        *,
        pagamentos!inner(id, mercado_pago_payment_id, valor_total, cliente_id, montador_id)
      `)
      .eq('id', estornoId)
      .single();

    if (estornoError || !estorno) {
      return new Response(
        JSON.stringify({ error: 'Estorno não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar status
    if (estorno.status !== 'solicitado') {
      return new Response(
        JSON.stringify({ error: `Estorno já foi processado (status: ${estorno.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔄 Admin ${userId} ${acao === 'aprovar' ? 'aprovando' : 'recusando'} estorno ${estornoId}`);

    // 5. PROCESSAR AÇÃO
    if (acao === 'recusar') {
      // Recusar estorno
      await supabase
        .from('estornos')
        .update({
          status: 'recusado',
          aprovado_por: userId,
          error_message: motivoRecusa?.trim(),
          processed_at: new Date().toISOString()
        })
        .eq('id', estornoId);

      // Notificar cliente
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', estorno.cliente_id)
        .single();

      if (clienteData) {
        await supabase
          .from('notificacoes')
          .insert({
            user_id: clienteData.user_id,
            tipo: 'pagamento',
            mensagem: `Solicitação de estorno recusada: ${motivoRecusa}`,
            metadata: { estorno_id: estornoId, job_id: estorno.job_id }
          });
      }

      return new Response(
        JSON.stringify({
          sucesso: true,
          mensagem: 'Estorno recusado com sucesso',
          estorno_id: estornoId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. APROVAR E PROCESSAR ESTORNO
    await supabase
      .from('estornos')
      .update({
        status: 'aprovado',
        aprovado_por: userId
      })
      .eq('id', estornoId);

    // Atualizar status do pagamento
    await supabase
      .from('pagamentos')
      .update({ status: 'estorno_processando' })
      .eq('id', estorno.pagamento_id);

    // Chamar API do Mercado Pago
    const mpPaymentId = estorno.pagamentos?.mercado_pago_payment_id;

    if (!mpPaymentId) {
      await supabase
        .from('estornos')
        .update({
          status: 'falhou',
          error_message: 'Pagamento não possui ID do Mercado Pago',
          processed_at: new Date().toISOString()
        })
        .eq('id', estornoId);

      return new Response(
        JSON.stringify({ error: 'Pagamento não possui ID do Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar chave de idempotência
    const idempotencyKey = `admin-refund-${estornoId}-${Date.now()}`;

    try {
      const refundBody: { amount?: number } = {};
      if (estorno.tipo === 'parcial') {
        refundBody.amount = estorno.valor_estorno;
      }

      console.log('📤 Chamando API MP para estorno (admin):', {
        payment_id: mpPaymentId,
        tipo: estorno.tipo,
        valor: estorno.valor_estorno
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
        await supabase
          .from('estornos')
          .update({
            status: 'falhou',
            error_message: mpResult.message || 'Erro ao processar estorno no Mercado Pago',
            processed_at: new Date().toISOString()
          })
          .eq('id', estornoId);

        await supabase
          .from('pagamentos')
          .update({ status: 'estorno_falhou' })
          .eq('id', estorno.pagamento_id);

        return new Response(
          JSON.stringify({
            error: 'Falha ao processar estorno no Mercado Pago',
            detalhes: mpResult.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Processar no banco
      console.log('✅ Estorno aprovado no MP:', mpResult.id);

      const { error: processError } = await supabase.rpc(
        'processar_estorno_completo',
        { p_estorno_id: estornoId, p_mp_refund_id: mpResult.id?.toString() }
      );

      if (processError) {
        console.error('Erro ao processar estorno no banco:', processError);
        // Marcar como concluído mesmo assim
        await supabase
          .from('estornos')
          .update({
            status: 'concluido',
            mercado_pago_refund_id: mpResult.id?.toString(),
            processed_at: new Date().toISOString(),
            error_message: 'Estorno realizado no MP. Erro interno: ' + processError.message
          })
          .eq('id', estornoId);
      }

      return new Response(
        JSON.stringify({
          sucesso: true,
          mensagem: 'Estorno processado com sucesso',
          estorno_id: estornoId,
          mercado_pago_refund_id: mpResult.id,
          valor_estornado: estorno.valor_estorno
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
        .eq('id', estornoId);

      return new Response(
        JSON.stringify({ error: 'Erro ao comunicar com Mercado Pago' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Erro no processamento admin de estorno:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
