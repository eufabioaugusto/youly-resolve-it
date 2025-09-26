import { Resend } from 'https://esm.sh/resend@2.0.0'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple HTML template function
function createConfirmationEmailHTML({
  supabase_url,
  token_hash,
  email_action_type,
  redirect_to,
  user_email,
  token
}: {
  supabase_url: string
  token_hash: string
  email_action_type: string
  redirect_to: string
  user_email: string
  token: string
}) {
  const confirmationUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Confirme sua conta</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px;">
          <h1 style="color: #2c3e50;">🔧 YOULY - Confirmação de Conta</h1>
          <p>Olá!</p>
          <p>Obrigado por se cadastrar no YOULY. Para confirmar sua conta e começar a usar nossa plataforma, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Confirmar Conta
            </a>
          </div>
          
          <p>Ou copie e cole este código de confirmação:</p>
          <div style="background: #eee; padding: 15px; border-radius: 5px; text-align: center; font-family: monospace; font-size: 18px; font-weight: bold; color: #2c3e50; margin: 20px 0;">
            ${token}
          </div>
          
          <p>Ou use este link direto:</p>
          <p style="background: #eee; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
            ${confirmationUrl}
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="font-size: 12px; color: #666;">
            Se você não se cadastrou no YOULY, pode ignorar este email com segurança.
          </p>
          
          <p style="font-size: 12px; color: #666;">
            Atenciosamente,<br>
            Equipe YOULY
          </p>
        </div>
      </body>
    </html>
  `
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(hookSecret)
    
    console.log('Received webhook payload for email confirmation')
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
      }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
        site_url: string
      }
    }

    console.log(`Sending confirmation email to: ${user.email}`)

    // Generate HTML using the simple template
    const html = createConfirmationEmailHTML({
      supabase_url: Deno.env.get('SUPABASE_URL') ?? '',
      token,
      token_hash,
      redirect_to,
      email_action_type,
      user_email: user.email,
    })

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'YOULY <onboarding@resend.dev>',
      to: [user.email],
      subject: '🔧 Confirme sua conta no YOULY',
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          http_code: error.code || 500,
          message: error.message || 'Internal server error',
        },
      }),
      {
        status: error.code === 'webhook_verification_failed' ? 401 : 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})