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

    // Tentar enviar SMS via gateway (se configurado)
    let envioSucesso = false;
    let errorMessage = null;

    if (smsGatewayApiKey && smsGatewayUrl) {
      try {
        console.log('📤 [sms-send] Enviando SMS via gateway', { url: smsGatewayUrl });

        // Aqui você deve integrar com seu gateway de SMS real (Twilio, AWS SNS, etc)
        // Exemplo genérico:
        const response = await fetch(smsGatewayUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${smsGatewayApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: telefone,
            message: mensagem,
          }),
        });

        if (response.ok) {
          envioSucesso = true;
          console.log('✅ [sms-send] SMS enviado com sucesso');
        } else {
          const errorData = await response.text();
          errorMessage = `Gateway error: ${response.status} - ${errorData}`;
          console.error('❌ [sms-send] Erro do gateway', errorMessage);
        }
      } catch (gatewayError: any) {
        errorMessage = gatewayError.message;
        console.error('❌ [sms-send] Erro ao enviar via gateway', gatewayError);
      }
    } else {
      console.warn('⚠️ [sms-send] Gateway de SMS não configurado. SMS registrado mas não enviado.');
      errorMessage = 'Gateway não configurado';
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
