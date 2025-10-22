import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface CadastroAprovadoEmailProps {
  montadorNome: string;
  loginUrl: string;
}

export const CadastroAprovadoEmail = ({ montadorNome, loginUrl }: CadastroAprovadoEmailProps) => (
  <Html>
    <Head />
    <Preview>Parabéns! Sua conta foi aprovada - Youly</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Parabéns! Sua Conta Foi Aprovada!</Heading>
        
        <Text style={text}>
          Olá, {montadorNome}!
        </Text>
        
        <Text style={text}>
          Temos uma ótima notícia! Sua conta foi <strong>aprovada</strong> e você já pode começar a trabalhar na plataforma Youly.
        </Text>
        
        <Text style={text}>
          Agora você tem acesso a todos os recursos da plataforma e pode começar a receber pedidos de montagem.
        </Text>
        
        <Button style={button} href={loginUrl}>
          Acessar Plataforma
        </Button>
        
        <Text style={text}>
          Ou copie e cole este link no seu navegador:
        </Text>
        <Text style={link}>
          {loginUrl}
        </Text>
        
        <Text style={footer}>
          Boa sorte e bons trabalhos!<br />
          <strong>Equipe Youly</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CadastroAprovadoEmail;

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

const button = {
  backgroundColor: '#5469d4',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  margin: '24px 0',
};

const link = {
  color: '#5469d4',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
};
