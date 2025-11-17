import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY FIX: Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing authentication' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    // Create client with user's JWT (not service role) for authorization checks
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Invalid authentication:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      );
    }

    console.log('Authenticated user:', user.id);
    
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error('Erro ao parsear JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Formato JSON inválido' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    const { jobId, montadorId, valor, clienteEmail, clienteNome, clienteId } = requestBody;

    console.log('Dados recebidos:', {
      jobId,
      montadorId,
      valor,
      clienteId,
      userId: user.id
    });

    if (!jobId || !montadorId || !valor || !clienteId) {
      console.error('Parâmetros obrigatórios ausentes');
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    // SECURITY FIX: Validate valor is positive
    if (typeof valor !== 'number' || valor <= 0) {
      console.error('Invalid valor:', valor);
      return new Response(
        JSON.stringify({ error: 'Valor inválido - deve ser número positivo' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      );
    }

    if (!mercadoPagoAccessToken) {
      console.error('Token do Mercado Pago não configurado');
      return new Response(
        JSON.stringify({ error: 'Configuração do pagamento incompleta' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    // Verificar se o token é de produção ou teste
    const isTestToken = mercadoPagoAccessToken.startsWith('TEST-');
    const isProductionToken = mercadoPagoAccessToken.startsWith('APP_USR-');
    
    console.log('Mercado Pago token info:', {
      isTest: isTestToken,
      isProduction: isProductionToken,
      prefix: mercadoPagoAccessToken.substring(0, 8) + '...'
    });

    if (isTestToken) {
      console.warn('⚠️ ATENÇÃO: Usando token de TESTE do Mercado Pago');
    } else if (isProductionToken) {
      console.log('✓ Usando token de PRODUÇÃO do Mercado Pago');
    } else {
      console.warn('⚠️ Token do Mercado Pago em formato não reconhecido');
    }

    // Use service role for data fetching
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY FIX: Verify user owns this clienteId
    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .select('id, user_id')
      .eq('id', clienteId)
      .single();

    if (clienteError || !clienteData) {
      console.error('Cliente not found:', clienteError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // SECURITY FIX: Verify authenticated user owns this cliente
    if (user.id !== clienteData.user_id) {
      console.error('User does not own this cliente', {
        userId: user.id,
        clienteUserId: clienteData.user_id
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Este cliente não pertence a você' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // SECURITY FIX: Verify job belongs to this cliente and fetch job data
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('descricao, categoria, cliente_id, valor_estimado, status')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job não encontrado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // SECURITY FIX: Verify job belongs to this cliente
    if (jobData.cliente_id !== clienteId) {
      console.error('Job does not belong to cliente', {
        jobClienteId: jobData.cliente_id,
        requestClienteId: clienteId
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Este job não pertence a você' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403
        }
      );
    }

    // SECURITY FIX: Validate valor against accepted negotiation
    // Check if there's an accepted negotiation
    const { data: negociacaoData } = await supabase
      .from('negociacoes')
      .select('valor_final, status')
      .eq('job_id', jobId)
      .eq('montador_id', montadorId)
      .eq('status', 'aceito')
      .maybeSingle();

    // Validate against negotiated service value if exists
    if (negociacaoData?.valor_final) {
      const expectedValor = negociacaoData.valor_final;
      const variance = Math.abs(valor - expectedValor) / expectedValor;
      if (variance > 0.01) { // Allow 1% variance for rounding
        console.error('Valor differs from negotiated service amount', {
          requestedValor: valor,
          negotiatedValor: expectedValor
        });
        return new Response(
          JSON.stringify({ 
            error: 'Valor não corresponde ao serviço negociado',
            details: `O valor do serviço deve ser R$ ${expectedValor.toFixed(2)}`
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }
    }

    // Verify montador exists
    const { data: montadorData, error: montadorError } = await supabase
      .from('montadores')
      .select('id')
      .eq('id', montadorId)
      .single();

    if (montadorError || !montadorData) {
      console.error('Montador not found:', montadorError);
      return new Response(
        JSON.stringify({ error: 'Montador não encontrado' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Calcular comissão da plataforma (20%) e valor do montador (80%)
    const valorTotal = Number(valor);
    const comissaoPlataforma = valorTotal * 0.20;
    const valorMontador = valorTotal * 0.80;
    
    console.log('Valores calculados:', {
      valorTotal,
      comissaoPlataforma,
      valorMontador
    });

    // Criar pagamento no banco com valores já calculados
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        job_id: jobId,
        montador_id: montadorId,
        cliente_id: clienteData.id,
        valor_total: valorTotal,
        valor_montador: valorMontador,
        comissao_plataforma: comissaoPlataforma,
        status: 'pendente',
        metodo: 'cartao'
      })
      .select()
      .single();

    if (pagamentoError) {
      console.error('Erro ao criar pagamento:', pagamentoError);
      throw pagamentoError;
    }

    // Criar preferência no Mercado Pago  
    const preferenceData = {
      items: [
        {
          id: jobId,
          title: `Montagem: ${jobData.descricao.substring(0, 80)}`,
          description: `Categoria: ${jobData.categoria}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(valor)
        }
      ],
      payer: {
        name: clienteNome,
        email: clienteEmail
      },
      back_urls: {
        success: `https://youly.com.br/pagamento/sucesso`,
        failure: `https://youly.com.br/pagamento/falha`,
        pending: `https://youly.com.br/pagamento/pendente`
      },
      auto_return: 'approved',
      external_reference: pagamento.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      statement_descriptor: 'YOULY',
      payment_methods: {
        installments: 12,
        default_installments: 1
      },
      binary_mode: false
    };

    console.log('Criando preferência MP:', {
      valor: preferenceData.items[0].unit_price,
      payment_methods: preferenceData.payment_methods
    });

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceData)
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error('Erro MP:', errorText);
      throw new Error(`Erro Mercado Pago: ${mpResponse.status}`);
    }

    const preference = await mpResponse.json();
    console.log('Preferência criada com sucesso:', {
      id: preference.id,
      payment_methods: preference.payment_methods,
      collector_id: preference.collector_id
    });

    // Atualizar pagamento com preference_id
    await supabase
      .from('pagamentos')
      .update({ mercado_pago_preference_id: preference.id })
      .eq('id', pagamento.id);

    return new Response(
      JSON.stringify({
        success: true,
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point,
        pagamento_id: pagamento.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Erro detalhado no checkout:', {
      message: error?.message || 'Erro desconhecido',
      stack: error?.stack,
      name: error?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error?.message || 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
