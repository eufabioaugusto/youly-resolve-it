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

interface PagamentoAprovadoEmailProps {
  userName: string
  userType: 'cliente' | 'montador'
  jobDescricao: string
  valorPagamento: number
  linkOrdemServico: string
}

export const PagamentoAprovadoEmail = ({
  userName,
  userType,
  jobDescricao,
  valorPagamento,
  linkOrdemServico,
}: PagamentoAprovadoEmailProps) => {
  const isCliente = userType === 'cliente'
  
  return (
    <Html>
      <Head />
      <Preview>{isCliente ? 'Pagamento confirmado' : 'Você recebeu um pagamento'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>
              {isCliente ? '✅ Pagamento Confirmado' : '💵 Pagamento Recebido'}
            </Heading>
            <Text style={tagline}>
              {isCliente ? 'Seu pagamento foi processado' : 'Valor creditado na sua carteira'}
            </Text>
          </Section>
          
          <Hr style={hr} />
          
          <Section style={content}>
            <Heading style={h2}>Olá {userName}!</Heading>
            <Text style={text}>
              {isCliente 
                ? 'Seu pagamento foi confirmado com sucesso! O montador já pode iniciar o trabalho.'
                : 'Você recebeu um pagamento! O valor foi bloqueado na sua carteira e será liberado em 3 dias após a conclusão.'
              }
            </Text>
            
            <Section style={jobCard}>
              <Text style={jobLabel}>📋 Trabalho</Text>
              <Text style={jobValue}>{jobDescricao}</Text>
            </Section>
            
            <Section style={valorCard}>
              <Text style={valorLabel}>Valor Total</Text>
              <Text style={valorValue}>
                R$ {valorPagamento.toFixed(2).replace('.', ',')}
              </Text>
            </Section>
            
            {!isCliente && (
              <Section style={warningBox}>
                <Text style={warningTitle}>⏳ Período de Segurança</Text>
                <Text style={warningText}>
                  O valor ficará bloqueado por 3 dias após a conclusão do trabalho. 
                  Após esse período, será liberado automaticamente para saque.
                </Text>
              </Section>
            )}
            
            <Section style={buttonContainer}>
              <Link href={linkOrdemServico} style={button}>
                Ver Ordem de Serviço
              </Link>
            </Section>
            
            <Text style={infoText}>
              {isCliente 
                ? '📱 Acompanhe o andamento do trabalho pela plataforma.'
                : '🔧 Não esqueça de iniciar o trabalho e enviar fotos do antes/depois!'
              }
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © 2024 YOULY - Pagamentos seguros e transparentes
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default PagamentoAprovadoEmail

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

const valorCard = {
  backgroundColor: '#e8f5e9',
  border: '2px solid #4CAF50',
  borderRadius: '12px',
  padding: '32px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const valorLabel = {
  color: '#2E7D32',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  margin: '0 0 12px',
  letterSpacing: '1px',
}

const valorValue = {
  color: '#2E7D32',
  fontSize: '40px',
  fontWeight: 'bold',
  margin: '0',
}

const warningBox = {
  backgroundColor: '#fff9e6',
  border: '1px solid #FFB74D',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
}

const warningTitle = {
  color: '#F57C00',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px',
}

const warningText = {
  color: '#6a6a6a',
  fontSize: '14px',
  lineHeight: '20px',
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
