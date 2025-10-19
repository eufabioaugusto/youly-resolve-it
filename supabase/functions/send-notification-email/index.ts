import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'jsr:@supabase/supabase-js@2'

import { NovoJobEmail } from '../send-email/_templates/novo-job.tsx'
import { NovaCandidaturaEmail } from '../send-email/_templates/nova-candidatura.tsx'
import { OrcamentoEnviadoEmail } from '../send-email/_templates/orcamento-enviado.tsx'
import { PagamentoAprovadoEmail } from '../send-email/_templates/pagamento-aprovado.tsx'
import { PesquisaSatisfacaoEmail } from '../send-email/_templates/pesquisa-satisfacao-react.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationEmailRequest {
  type: 'novo_job' | 'nova_candidatura' | 'orcamento_enviado' | 'pagamento' | 'pesquisa_satisfacao'
  to: string
  data: any
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const { type, to, data }: NotificationEmailRequest = await req.json()
    
    console.log(`📧 Sending ${type} email to ${to}`)

    let html: string
    let subject: string

    switch (type) {
      case 'novo_job':
        html = await renderAsync(
          React.createElement(NovoJobEmail, {
            montadorNome: data.montadorNome,
            jobDescricao: data.jobDescricao,
            jobCategoria: data.jobCategoria,
            jobEndereco: data.jobEndereco,
            linkJob: data.linkJob,
          })
        )
        subject = '🔔 Novo trabalho disponível na sua região'
        break

      case 'nova_candidatura':
        html = await renderAsync(
          React.createElement(NovaCandidaturaEmail, {
            clienteNome: data.clienteNome,
            montadorNome: data.montadorNome,
            jobDescricao: data.jobDescricao,
            montadorAvaliacao: data.montadorAvaliacao,
            montadorProjetos: data.montadorProjetos,
            linkCandidaturas: data.linkCandidaturas,
          })
        )
        subject = '👷 Nova candidatura para seu pedido'
        break

      case 'orcamento_enviado':
        html = await renderAsync(
          React.createElement(OrcamentoEnviadoEmail, {
            clienteNome: data.clienteNome,
            montadorNome: data.montadorNome,
            jobDescricao: data.jobDescricao,
            valorOrcamento: data.valorOrcamento,
            linkNegociacao: data.linkNegociacao,
          })
        )
        subject = '💰 Você recebeu um orçamento'
        break

      case 'pagamento':
        html = await renderAsync(
          React.createElement(PagamentoAprovadoEmail, {
            userName: data.userName,
            userType: data.userType,
            jobDescricao: data.jobDescricao,
            valorPagamento: data.valorPagamento,
            linkOrdemServico: data.linkOrdemServico,
          })
        )
        subject = data.userType === 'cliente' 
          ? '✅ Pagamento confirmado' 
          : '💵 Você recebeu um pagamento'
        break

      case 'pesquisa_satisfacao':
        html = await renderAsync(
          React.createElement(PesquisaSatisfacaoEmail, {
            clienteNome: data.clienteNome,
            montadorNome: data.montadorNome,
            jobDescricao: data.jobDescricao,
            linkPesquisa: data.linkPesquisa,
          })
        )
        subject = '⭐ Avalie seu serviço - Sua opinião é importante'
        break

      default:
        throw new Error(`Unknown notification type: ${type}`)
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'YOULY <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', emailData)

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error in send-notification-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message || 'Internal server error',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})
