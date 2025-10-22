import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface CadastroReprovadoEmailProps {
  montadorNome: string;
  motivo?: string;
}

export const CadastroReprovadoEmail = ({ montadorNome, motivo }: CadastroReprovadoEmailProps) => (
  <Html>
    <Head />
    <Preview>Atualização sobre seu cadastro - Youly</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Atualização sobre seu Cadastro</Heading>
        
        <Text style={text}>
          Olá, {montadorNome}!
        </Text>
        
        <Text style={text}>
          Após análise do seu cadastro, identificamos inconsistências nos seus dados e sua conta não foi aprovada.
        </Text>
        
        {motivo && (
          <Text style={alertBox}>
            <strong>Motivo:</strong> {motivo}
          </Text>
        )}
        
        <Text style={text}>
          Sentimos muito por isso. Você poderá fazer uma nova solicitação corrigindo as informações necessárias.
        </Text>
        
        <Text style={text}>
          Se você acredita que houve um erro ou deseja mais informações, entre em contato com nosso suporte.
        </Text>
        
        <Text style={footer}>
          Atenciosamente,<br />
          <strong>Equipe Youly</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CadastroReprovadoEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '5px',
  padding: '16px',
  color: '#856404',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
};
