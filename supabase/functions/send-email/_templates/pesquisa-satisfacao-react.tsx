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

interface PesquisaSatisfacaoEmailProps {
  clienteNome: string
  montadorNome: string
  jobDescricao: string
  linkPesquisa: string
}

export const PesquisaSatisfacaoEmail = ({
  clienteNome,
  montadorNome,
  jobDescricao,
  linkPesquisa,
}: PesquisaSatisfacaoEmailProps) => (
  <Html>
    <Head />
    <Preview>Avalie seu serviço - Sua opinião é importante</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>⭐ Pesquisa de Satisfação</Heading>
          <Text style={tagline}>Como foi sua experiência?</Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={content}>
          <Heading style={h2}>Olá {clienteNome}!</Heading>
          <Text style={text}>
            O serviço de montagem foi concluído. Gostaríamos muito de saber como foi sua experiência!
          </Text>
          
          <Section style={infoCard}>
            <Text style={infoLabel}>👤 Montador</Text>
            <Text style={infoValue}>{montadorNome}</Text>
            
            <Text style={infoLabel}>🔧 Serviço</Text>
            <Text style={infoValue}>{jobDescricao}</Text>
          </Section>
          
          <Section style={starsSection}>
            <Text style={starsText}>⭐⭐⭐⭐⭐</Text>
          </Section>
          
          <Text style={text}>
            Sua avaliação nos ajuda a manter a qualidade dos serviços e a melhorar continuamente.
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={linkPesquisa} style={button}>
              Avaliar Agora
            </Link>
          </Section>
          
          <Section style={benefitsBox}>
            <Heading style={h3}>Por que avaliar?</Heading>
            <Text style={benefitItem}>✓ Ajuda outros clientes a escolherem bem</Text>
            <Text style={benefitItem}>✓ Incentiva montadores de qualidade</Text>
            <Text style={benefitItem}>✓ Melhora o serviço para todos</Text>
          </Section>
          
          <Text style={validityText}>
            Este link é válido por 30 dias
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerText}>
            © 2024 YOULY - Comprometidos com sua satisfação
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default PesquisaSatisfacaoEmail

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
  background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
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
}

const text = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const infoCard = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e1e8ed',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const infoLabel = {
  color: '#6a6a6a',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '16px 0 4px',
  letterSpacing: '0.5px',
}

const infoValue = {
  color: '#1a1a1a',
  fontSize: '16px',
  margin: '0 0 8px',
}

const starsSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const starsText = {
  fontSize: '48px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#FFB74D',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  boxShadow: '0 4px 12px rgba(255, 183, 77, 0.35)',
}

const benefitsBox = {
  backgroundColor: '#fff9e6',
  border: '1px solid #FFE082',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const benefitItem = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '8px 0',
}

const validityText = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '24px 0 8px',
  fontStyle: 'italic' as const,
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
