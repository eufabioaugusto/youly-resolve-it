import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  telefone: string;
  mensagem: string;
  tipo: 'agendamento' | 'a_caminho' | 'codigo_validacao' | 'pesquisa';
  ordem_servico_id?: string;
}

// Função para enviar SMS via ClickSend
async function enviarViaClickSend(telefone: string, mensagem: string) {
  const username = Deno.env.get('CLICKSEND_USERNAME');
  const apiKey = Deno.env.get('CLICKSEND_API_KEY');
  
  if (!username || !apiKey) {
    throw new Error('ClickSend credentials not configured');
  }
  
  console.log('📤 [ClickSend] Enviando SMS', { telefone, mensagemLength: mensagem.length });
  
  const credentials = btoa(`${username}:${apiKey}`);
  
  const response = await fetch('https://rest.clicksend.com/v3/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    },
    body: JSON.stringify({
      messages: [{
        source: 'youly',
        from: 'Youly',
        to: telefone,
        body: mensagem
      }]
    })
  });
  
  const result = await response.json();
  
  if (response.ok && result.data?.messages?.[0]?.status === 'SUCCESS') {
    console.log('✅ [ClickSend] SMS enviado com sucesso', result);
    return { success: true, data: result };
  } else {
    console.error('❌ [ClickSend] Erro ao enviar SMS', result);
    throw new Error(result.response_msg || 'Failed to send SMS');
  }
}

serve(async (req) => {
  console.log('🚀 [sms-send] Iniciado', { timestamp: new Date().toISOString() });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const smsGatewayApiKey = Deno.env.get("SMS_GATEWAY_API_KEY");
    const smsGatewayUrl = Deno.env.get("SMS_GATEWAY_URL");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { telefone, mensagem, tipo, ordem_servico_id }: SMSRequest = await req.json();

    console.log('📱 [sms-send] Dados recebidos', { telefone, tipo, ordem_servico_id });

    // Validações
    if (!telefone || !mensagem || !tipo) {
      throw new Error('Telefone, mensagem e tipo são obrigatórios');
    }

    // Criar registro do SMS
    const { data: smsRecord, error: insertError } = await supabaseAdmin
      .from('sms_enviados')
      .insert({
        telefone,
        mensagem,
        tipo,
        ordem_servico_id,
        status: 'pendente',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ [sms-send] Erro ao criar registro SMS', insertError);
      throw insertError;
    }

    console.log('✅ [sms-send] Registro SMS criado', { id: smsRecord.id });

    // Enviar SMS via ClickSend
    let envioSucesso = false;
    let errorMessage = null;

    try {
      console.log('📤 [sms-send] Enviando SMS via ClickSend');
      await enviarViaClickSend(telefone, mensagem);
      envioSucesso = true;
      console.log('✅ [sms-send] SMS enviado com sucesso via ClickSend');
    } catch (clicksendError: any) {
      errorMessage = clicksendError.message;
      console.error('❌ [sms-send] Erro ao enviar via ClickSend', clicksendError);
    }

    // Atualizar status do registro
    const { error: updateError } = await supabaseAdmin
      .from('sms_enviados')
      .update({
        status: envioSucesso ? 'enviado' : 'erro',
        error_message: errorMessage,
      })
      .eq('id', smsRecord.id);

    if (updateError) {
      console.error('❌ [sms-send] Erro ao atualizar status SMS', updateError);
    }

    return new Response(
      JSON.stringify({
        success: envioSucesso,
        message: envioSucesso ? 'SMS enviado com sucesso' : 'SMS registrado mas não enviado',
        sms_id: smsRecord.id,
        error: errorMessage,
      }),
      { status: envioSucesso ? 200 : 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ [sms-send] Erro geral', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
