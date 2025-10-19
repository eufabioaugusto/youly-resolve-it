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
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface NovoJobEmailProps {
  montadorNome: string
  jobDescricao: string
  jobCategoria: string
  jobEndereco: string
  linkJob: string
}

export const NovoJobEmail = ({
  montadorNome,
  jobDescricao,
  jobCategoria,
  jobEndereco,
  linkJob,
}: NovoJobEmailProps) => (
  <Html>
    <Head />
    <Preview>Novo trabalho disponível na sua região</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>🔔 Novo Trabalho</Heading>
          <Text style={tagline}>Um novo pedido foi publicado!</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Olá {montadorNome}!</Heading>
          <Text style={text}>
            Um novo trabalho foi publicado na sua região e pode ser perfeito para você.
          </Text>
          
          <Section style={jobCard}>
            <Text style={jobLabel}>📋 Descrição</Text>
            <Text style={jobValue}>{jobDescricao}</Text>
            
            <Text style={jobLabel}>🏷️ Categoria</Text>
            <Text style={jobValue}>{jobCategoria}</Text>
            
            <Text style={jobLabel}>📍 Localização</Text>
            <Text style={jobValue}>{jobEndereco}</Text>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={linkJob} style={button}>
              Ver Detalhes e Candidatar-se
            </Link>
          </Section>
          
          <Text style={warningText}>
            ⏱️ Responda rápido! Os melhores trabalhos são preenchidos rapidamente.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 YOULY - Conectando você aos melhores trabalhos
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default NovoJobEmail

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
  background: 'linear-gradient(135deg, #dc2e37 0%, #ff6b6b 100%)',
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
  opacity: 0.95,
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

const jobCard = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const jobLabel = {
  color: '#6a6a6a',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '16px 0 4px',
  letterSpacing: '0.5px',
}

const jobValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0 0 8px',
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

const warningText = {
  color: '#e94560',
  fontSize: '14px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '12px',
  backgroundColor: '#fff5f5',
  borderRadius: '6px',
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e1e8ed',
  margin: '0',
}

const footer = {
  padding: '20px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
}

const footerText = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}
