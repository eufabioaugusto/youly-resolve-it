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
      clienteEmail,
      clienteNome,
      clienteId,
      hasAccessToken: !!mercadoPagoAccessToken
    });

    if (!jobId || !montadorId || !valor || !clienteId) {
      console.error('Parâmetros obrigatórios ausentes:', {
        jobId: !!jobId,
        montadorId: !!montadorId,
        valor: !!valor,
        clienteId: !!clienteId
      });
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes' }),
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

    // Buscar dados do job e montador
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('descricao, categoria')
      .eq('id', jobId)
      .single();

    console.log('Job data:', { jobData, jobError });

    const { data: montadorData, error: montadorError } = await supabase
      .from('montadores')
      .select('id')
      .eq('id', montadorId)
      .single();

    console.log('Montador data:', { montadorData, montadorError });

    const { data: clienteData, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .single();

    console.log('Cliente data:', { clienteData, clienteError });

    if (jobError || montadorError || clienteError) {
      console.error('Erros nas consultas:', {
        jobError,
        montadorError, 
        clienteError
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao buscar dados',
          details: { jobError, montadorError, clienteError }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    if (!jobData || !montadorData || !clienteData) {
      console.error('Dados não encontrados:', {
        jobData: !!jobData,
        montadorData: !!montadorData,
        clienteData: !!clienteData
      });
      return new Response(
        JSON.stringify({ 
          error: 'Dados não encontrados',
          details: {
            job: !!jobData,
            montador: !!montadorData,
            cliente: !!clienteData
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    // Criar pagamento no banco
    const { data: pagamento, error: pagamentoError } = await supabase
      .from('pagamentos')
      .insert({
        job_id: jobId,
        montador_id: montadorId,
        cliente_id: clienteData.id,
        valor_total: valor,
        status: 'pendente',
        metodo: 'mercado_pago'
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
          unit_price: parseFloat(valor.toString())
        }
      ],
      payer: {
        name: clienteNome,
        email: clienteEmail
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 12
      },
      back_urls: {
        success: `${req.headers.get('origin')}/pagamento/sucesso?payment_id={payment_id}&status={status}`,
        failure: `${req.headers.get('origin')}/pagamento/falha?payment_id={payment_id}&status={status}`,
        pending: `${req.headers.get('origin')}/pagamento/pendente?payment_id={payment_id}&status={status}`
      },
      auto_return: 'approved',
      external_reference: pagamento.id,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`
    };

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
    console.log('Preferência criada:', preference.id);

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