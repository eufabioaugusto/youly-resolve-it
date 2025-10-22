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

interface CadastroPendenteEmailProps {
  montadorNome: string;
}

export const CadastroPendenteEmail = ({ montadorNome }: CadastroPendenteEmailProps) => (
  <Html>
    <Head />
    <Preview>Cadastro efetuado com sucesso - Youly</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Cadastro Efetuado com Sucesso! 🎉</Heading>
        
        <Text style={text}>
          Olá, {montadorNome}!
        </Text>
        
        <Text style={text}>
          Seu cadastro foi recebido com sucesso e está em análise pela nossa equipe.
        </Text>
        
        <Text style={text}>
          <strong>Em até 48 horas</strong> você será notificado sobre o status da sua conta.
        </Text>
        
        <Text style={text}>
          Nossa equipe está verificando seus dados e documentos para garantir a segurança de todos os usuários da plataforma.
        </Text>
        
        <Text style={footer}>
          Atenciosamente,<br />
          <strong>Equipe Youly</strong>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CadastroPendenteEmail;

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

const footer = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  marginTop: '32px',
};
