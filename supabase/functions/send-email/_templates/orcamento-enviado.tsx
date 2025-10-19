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

interface OrcamentoEnviadoEmailProps {
  clienteNome: string
  montadorNome: string
  jobDescricao: string
  valorOrcamento: number
  linkNegociacao: string
}

export const OrcamentoEnviadoEmail = ({
  clienteNome,
  montadorNome,
  jobDescricao,
  valorOrcamento,
  linkNegociacao,
}: OrcamentoEnviadoEmailProps) => (
  <Html>
    <Head />
    <Preview>Você recebeu um orçamento</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>💰 Orçamento Recebido</Heading>
          <Text style={tagline}>O montador enviou sua proposta</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Olá {clienteNome}!</Heading>
          <Text style={text}>
            O montador <strong>{montadorNome}</strong> enviou um orçamento para seu pedido.
          </Text>
          
          <Section style={jobCard}>
            <Text style={jobLabel}>📋 Pedido</Text>
            <Text style={jobValue}>{jobDescricao}</Text>
          </Section>
          
          <Section style={orcamentoCard}>
            <Text style={orcamentoLabel}>Valor do Orçamento</Text>
            <Text style={orcamentoValue}>
              R$ {valorOrcamento.toFixed(2).replace('.', ',')}
            </Text>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={linkNegociacao} style={acceptButton}>
              Aceitar Orçamento
            </Link>
            <Link href={linkNegociacao} style={negotiateButton}>
              Fazer Contra-Proposta
            </Link>
          </Section>
          
          <Text style={infoText}>
            ℹ️ Você pode aceitar o orçamento ou fazer uma contra-proposta. A negociação é rápida e segura!
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 YOULY - Negociações transparentes e seguras
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default OrcamentoEnviadoEmail

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
  background: 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
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
  padding: '20px',
  margin: '24px 0',
}

const jobLabel = {
  color: '#6a6a6a',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
  letterSpacing: '0.5px',
}

const jobValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0',
}

const orcamentoCard = {
  backgroundColor: '#e3f2fd',
  border: '2px solid #2196F3',
  borderRadius: '12px',
  padding: '32px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const orcamentoLabel = {
  color: '#1976D2',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
  letterSpacing: '1px',
}

const orcamentoValue = {
  color: '#1976D2',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const acceptButton = {
  backgroundColor: '#4CAF50',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 8px 12px',
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.25)',
}

const negotiateButton = {
  backgroundColor: '#FF9800',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  margin: '0 8px 12px',
  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.25)',
}

const infoText = {
  color: '#2196F3',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '12px',
  backgroundColor: '#e3f2fd',
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
