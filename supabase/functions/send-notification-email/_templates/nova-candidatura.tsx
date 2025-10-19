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

interface NovaCandidaturaEmailProps {
  clienteNome: string
  montadorNome: string
  jobDescricao: string
  montadorAvaliacao: number
  montadorProjetos: number
  linkCandidaturas: string
}

export const NovaCandidaturaEmail = ({
  clienteNome,
  montadorNome,
  jobDescricao,
  montadorAvaliacao,
  montadorProjetos,
  linkCandidaturas,
}: NovaCandidaturaEmailProps) => (
  <Html>
    <Head />
    <Preview>Nova candidatura recebida para seu pedido</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>👷 Nova Candidatura</Heading>
          <Text style={tagline}>Um montador se interessou pelo seu trabalho</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Olá {clienteNome}!</Heading>
          <Text style={text}>
            Você recebeu uma nova candidatura para seu pedido!
          </Text>
          
          <Section style={jobCard}>
            <Text style={jobLabel}>📋 Seu Pedido</Text>
            <Text style={jobValue}>{jobDescricao}</Text>
          </Section>
          
          <Section style={montadorCard}>
            <Heading style={h3}>Montador Interessado</Heading>
            <Text style={montadorName}>👤 {montadorNome}</Text>
            <Section style={stats}>
              <Section style={stat}>
                <Text style={statValue}>⭐ {montadorAvaliacao.toFixed(1)}</Text>
                <Text style={statLabel}>Avaliação</Text>
              </Section>
              <Section style={stat}>
                <Text style={statValue}>🔧 {montadorProjetos}</Text>
                <Text style={statLabel}>Projetos</Text>
              </Section>
            </Section>
          </Section>
          
          <Section style={buttonContainer}>
            <Link href={linkCandidaturas} style={button}>
              Ver Perfil e Contratar
            </Link>
          </Section>
          
          <Text style={tipText}>
            💡 Dica: Avalie o perfil do montador e inicie uma negociação para obter um orçamento personalizado.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 YOULY - Conectando você aos melhores profissionais
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default NovaCandidaturaEmail

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
  background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
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

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
  textAlign: 'center' as const,
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

const montadorCard = {
  backgroundColor: '#f0f9ff',
  border: '2px solid #4CAF50',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
}

const montadorName = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  textAlign: 'center' as const,
}

const stats = {
  display: 'flex',
  justifyContent: 'space-around',
  margin: '16px 0',
}

const stat = {
  textAlign: 'center' as const,
  flex: '1',
}

const statValue = {
  color: '#4CAF50',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 4px',
}

const statLabel = {
  color: '#6a6a6a',
  fontSize: '12px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#4CAF50',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.25)',
}

const tipText = {
  color: '#2196F3',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0',
  padding: '12px',
  backgroundColor: '#e3f2fd',
  borderRadius: '6px',
  borderLeft: '4px solid #2196F3',
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
