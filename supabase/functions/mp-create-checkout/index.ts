import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const mercadoPagoAccessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { jobId, montadorId, valor, clienteEmail, clienteNome } = await req.json();

    console.log('Criando checkout MP:', { jobId, montadorId, valor, clienteEmail });

    // Buscar dados do job e montador
    const { data: jobData } = await supabase
      .from('jobs')
      .select('descricao, categoria')
      .eq('id', jobId)
      .single();

    const { data: montadorData } = await supabase
      .from('montadores')
      .select('id')
      .eq('id', montadorId)
      .single();

    const { data: clienteData } = await supabase
      .from('clientes')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!jobData || !montadorData || !clienteData) {
      throw new Error('Dados não encontrados');
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

  } catch (error) {
    console.error('Erro no checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});