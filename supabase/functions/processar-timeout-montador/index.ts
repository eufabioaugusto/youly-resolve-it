import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('🚀 [processar-timeout-montador] Iniciado', { timestamp: new Date().toISOString() });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Buscar timeouts expirados
    const agora = new Date().toISOString();
    
    const { data: timeouts, error: fetchError } = await supabaseAdmin
      .from('timeout_montador')
      .select(`
        id,
        negociacao_id,
        job_id,
        montador_id,
        data_expiracao
      `)
      .eq('expirado', false)
      .eq('respondido', false)
      .lt('data_expiracao', agora);

    if (fetchError) {
      console.error('❌ [processar-timeout-montador] Erro ao buscar timeouts', fetchError);
      throw fetchError;
    }

    console.log(`✅ [processar-timeout-montador] ${timeouts?.length || 0} timeouts expirados encontrados`);

    if (!timeouts || timeouts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum timeout expirado', processados: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processados = 0;

    for (const timeout of timeouts) {
      console.log(`🔄 [processar-timeout-montador] Processando timeout ${timeout.id}`);

      // Marcar timeout como expirado
      const { error: updateTimeoutError } = await supabaseAdmin
        .from('timeout_montador')
        .update({ expirado: true })
        .eq('id', timeout.id);

      if (updateTimeoutError) {
        console.error(`❌ [processar-timeout-montador] Erro ao marcar timeout ${timeout.id}`, updateTimeoutError);
        continue;
      }

      // Marcar negociação como timeout expirado (se existir)
      if (timeout.negociacao_id) {
        const { error: updateNegociacaoError } = await supabaseAdmin
          .from('negociacoes')
          .update({ timeout_expirado: true })
          .eq('id', timeout.negociacao_id);

        if (updateNegociacaoError) {
          console.error(`❌ [processar-timeout-montador] Erro ao marcar negociação`, updateNegociacaoError);
          continue;
        }
      } else {
        console.log(`⚠️ [processar-timeout-montador] Timeout ${timeout.id} sem negociacao_id associada`);
      }

      // Buscar admins
      const { data: admins, error: adminsError } = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminsError || !admins || admins.length === 0) {
        console.error('❌ [processar-timeout-montador] Erro ao buscar admins', adminsError);
        continue;
      }

      // Buscar informações do job e montador separadamente
      const { data: jobData } = await supabaseAdmin
        .from('jobs')
        .select('descricao')
        .eq('id', timeout.job_id)
        .single();
      
      const jobDescricao = jobData?.descricao || 'Pedido';
      
      // Buscar informações do montador
      const { data: montadorInfo } = await supabaseAdmin
        .from('montadores')
        .select('user_id')
        .eq('id', timeout.montador_id)
        .single();
      
      const { data: montadorProfile } = await supabaseAdmin
        .from('profiles')
        .select('nome')
        .eq('user_id', montadorInfo?.user_id)
        .maybeSingle();
      
      const montadorNome = montadorProfile?.nome || 'Montador';

      for (const admin of admins) {
        const { error: notifError } = await supabaseAdmin
          .from('notificacoes')
          .insert({
            user_id: admin.user_id,
            tipo: 'sistema',
            mensagem: `⏰ TIMEOUT: ${montadorNome} não respondeu em 40min para "${jobDescricao.substring(0, 40)}...". Ação manual necessária.`,
          });

        if (notifError) {
          console.error('❌ [processar-timeout-montador] Erro ao criar notificação admin', notifError);
        }
      }

      // Atualizar status do job para indicar necessidade de intervenção
      const { error: updateJobError } = await supabaseAdmin
        .from('jobs')
        .update({ 
          status: 'em_negociacao' // Mantém em negociação mas admin verá timeout_expirado
        })
        .eq('id', timeout.job_id);

      if (updateJobError) {
        console.error(`❌ [processar-timeout-montador] Erro ao atualizar job`, updateJobError);
      }

      processados++;
      console.log(`✅ [processar-timeout-montador] Timeout ${timeout.id} processado com sucesso`);
    }

    console.log(`✅ [processar-timeout-montador] Total processados: ${processados}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${processados} timeouts processados`,
        processados 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error('❌ [processar-timeout-montador] Erro geral', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
