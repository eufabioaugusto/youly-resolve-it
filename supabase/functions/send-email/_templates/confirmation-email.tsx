import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Img,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme sua conta no YOULY</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🔧 YOULY</Heading>
          <Text style={tagline}>Conectando você aos melhores montadores</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Bem-vindo ao YOULY!</Heading>
          <Text style={text}>
            Olá! Obrigado por se cadastrar no YOULY, sua plataforma para conectar-se com montadores profissionais.
          </Text>
          
          <Text style={text}>
            Para ativar sua conta, clique no botão abaixo:
          </Text>
          
          <Section style={buttonContainer}>
            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
              style={button}
            >
              Confirmar Conta
            </Link>
          </Section>
          
          <Text style={smallText}>
            Ou copie e cole este código de confirmação temporário:
          </Text>
          <Section style={codeContainer}>
            <Text style={code}>{token}</Text>
          </Section>
          
          <Hr style={hr} />
          
          <Text style={footerText}>
            Se você não criou uma conta no YOULY, pode ignorar este email com segurança.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 YOULY - Sua plataforma de montagem profissional
          </Text>
          <Text style={footerSmall}>
            Este email foi enviado para {user_email}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#dc2e37',
  borderRadius: '8px 8px 0 0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  marginBottom: '8px',
}

const tagline = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '0',
  opacity: 0.9,
}

const content = {
  padding: '40px',
}

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#dc2e37',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 4px 12px rgba(220, 46, 55, 0.25)',
}

const smallText = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px',
  textAlign: 'center' as const,
}

const codeContainer = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0 32px',
  textAlign: 'center' as const,
}

const code = {
  color: '#dc2e37',
  fontSize: '18px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  margin: '0',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e1e8ed',
  margin: '32px 0',
}

const footer = {
  padding: '0 40px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const footerSmall = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '4px 0',
}