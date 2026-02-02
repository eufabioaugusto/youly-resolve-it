
# Plano de Implementação: Sistema de Cancelamento/Estorno Avançado

## Resumo Executivo
Implementar um sistema completo e seguro de cancelamento e estorno automático para pagamentos realizados via Mercado Pago, com múltiplos níveis de validação, auditoria e reversão de todas as operações afetadas.

---

## Contexto Atual

### Fluxo de Pagamento Existente
1. Cliente aceita orçamento → abre modal de pagamento
2. Edge function `mp-create-checkout` cria preferência no Mercado Pago
3. Cliente é redirecionado para checkout do MP
4. Webhook `mp-webhook` recebe notificação de pagamento aprovado
5. Sistema atualiza: pagamento, carteira do montador, negociação, job e cria OS

### Estrutura de Banco de Dados Relevante
- `pagamentos`: status pode ser `pendente`, `pago`, `estornado`
- `carteira`: saldo_disponivel, saldo_em_processamento, saldo_bloqueado
- `ordem_servico`: status do serviço (pendente, a_caminho, iniciada, concluida)
- `negociacoes`: status da negociação

---

## Arquitetura da Solução

### Novo Status para Pagamentos
Adicionar ao enum `pagamento_status`:
- `estorno_solicitado` - Solicitação pendente de aprovação
- `estorno_processando` - Estorno em processamento no MP
- `estornado` - Estorno concluído com sucesso
- `estorno_falhou` - Falha no estorno (requer ação manual)

### Nova Tabela: `estornos`
Registrar todas as solicitações de estorno para auditoria completa:

```text
┌─────────────────────────────────────────────────────────────────┐
│                          estornos                               │
├─────────────────────────────────────────────────────────────────┤
│ id                     UUID (PK)                                │
│ pagamento_id           UUID (FK → pagamentos)                   │
│ job_id                 UUID (FK → jobs)                         │
│ ordem_servico_id       UUID (FK → ordem_servico, nullable)      │
│ cliente_id             UUID (FK → clientes)                     │
│ montador_id            UUID (FK → montadores)                   │
│ valor_estorno          NUMERIC                                  │
│ valor_original         NUMERIC                                  │
│ tipo                   ENUM (total, parcial)                    │
│ motivo                 TEXT                                     │
│ motivo_categoria       ENUM (nao_compareceu, defeito, etc)      │
│ solicitado_por         UUID (user_id)                           │
│ aprovado_por           UUID (user_id, nullable)                 │
│ status                 ENUM (solicitado, aprovado, processando, │
│                             concluido, recusado, falhou)        │
│ mercado_pago_refund_id TEXT (nullable)                          │
│ error_message          TEXT (nullable)                          │
│ metadata               JSONB                                    │
│ created_at             TIMESTAMPTZ                              │
│ processed_at           TIMESTAMPTZ (nullable)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Regras de Negócio para Estorno

### Condições para Permitir Estorno

```text
┌────────────────────────────────────────────────────────────────┐
│                    JANELA DE ESTORNO                           │
├────────────────────────────────────────────────────────────────┤
│ Situação                    │ Estorno Permitido?  │ Aprovação  │
├─────────────────────────────┼─────────────────────┼────────────┤
│ Pagamento < 24h             │ SIM (100%)          │ Automático │
│ OS status = pendente        │ SIM (100%)          │ Automático │
│ OS status = a_caminho       │ SIM (90%)           │ Admin      │
│ OS status = iniciada        │ PARCIAL (até 50%)   │ Admin      │
│ OS status = concluida       │ NÃO                 │ -          │
│ Montador não compareceu     │ SIM (100%)          │ Admin      │
│ Garantia ativa + defeito    │ PARCIAL             │ Admin      │
└────────────────────────────────────────────────────────────────┘
```

### Validações de Segurança Críticas
1. **Autenticação**: Verificar JWT válido
2. **Autorização**: Apenas cliente dono do pagamento OU admin pode solicitar
3. **Status do pagamento**: Deve estar como `pago`
4. **Tempo**: Verificar janela de tempo do Mercado Pago (até 180 dias)
5. **Valor**: Não pode exceder valor original do pagamento
6. **Idempotência**: Usar X-Idempotency-Key para evitar estornos duplicados
7. **Rate limiting**: Máximo 1 solicitação por pagamento por hora

---

## Componentes a Implementar

### 1. Edge Function: `mp-refund`
Nova função para processar estornos via API do Mercado Pago.

Endpoint da API Mercado Pago:
```
POST https://api.mercadopago.com/v1/payments/{payment_id}/refunds
Headers:
  - Authorization: Bearer {access_token}
  - X-Idempotency-Key: {unique_key}
Body (opcional para estorno parcial):
  { "amount": 50.00 }
```

Fluxo da Edge Function:
```text
1. Validar autenticação (JWT)
2. Validar parâmetros (pagamento_id, motivo)
3. Buscar pagamento no banco
4. Verificar se usuário tem permissão
5. Verificar condições de estorno (status OS, tempo)
6. Criar registro na tabela estornos (status: processando)
7. Chamar API do Mercado Pago
8. Se sucesso:
   a. Atualizar pagamento → status: estornado
   b. Reverter saldo na carteira do montador
   c. Cancelar ordem de serviço (se existir)
   d. Atualizar job → status: cancelado
   e. Notificar cliente e montador
   f. Atualizar registro de estorno → status: concluido
9. Se falha:
   a. Registrar erro
   b. Notificar admin
   c. Atualizar estorno → status: falhou
```

### 2. Database Function: `processar_estorno`
Função para reverter todas as operações de forma atômica:

```text
TRANSAÇÃO:
├── Atualizar pagamento.status → 'estornado'
├── Subtrair valor de carteira.saldo_em_processamento
│   (ou saldo_disponivel se já liberado)
├── Registrar carteira_transacoes (tipo: 'estorno')
├── Atualizar ordem_servico.status → 'cancelada' (se existir)
├── Atualizar job.status → 'cancelado'
├── Atualizar negociacao.status → 'cancelado'
├── Criar notificação para cliente
└── Criar notificação para montador
```

### 3. UI: Botão de Solicitar Estorno
Localização: Página da Ordem de Serviço e Dashboard do Cliente

Condições de exibição:
- Pagamento status = 'pago'
- OS status != 'concluida' ou 'concluida_com_assistencia'
- Dentro da janela de tempo permitida

### 4. UI Admin: Gestão de Estornos
Nova aba no painel administrativo para:
- Listar solicitações pendentes
- Aprovar/Recusar estornos
- Processar estornos manualmente
- Ver histórico completo

### 5. Webhook Handler: Notificações de Estorno
Atualizar `mp-webhook` para processar:
- `refund.created`
- `refund.cancelled`

---

## Detalhamento Técnico

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `supabase/functions/mp-refund/index.ts` | Edge function para processar estornos |
| `src/hooks/useEstorno.tsx` | Hook React para operações de estorno |
| `src/components/SolicitarEstornoModal.tsx` | Modal para cliente solicitar estorno |
| `src/components/AdminEstornos.tsx` | Painel admin para gestão de estornos |

### Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/mp-webhook/index.ts` | Adicionar handler para refund events |
| `src/pages/OrdemServicoPage.tsx` | Adicionar botão de estorno |
| `src/pages/ClientDashboard.tsx` | Mostrar status de estorno |
| `src/pages/AdminDashboard.tsx` | Adicionar aba de estornos |
| `src/hooks/usePagamentos.tsx` | Adicionar tipos e funções de estorno |

### Migrações de Banco de Dados

**Migração 1: Novo enum e tabela**
```sql
-- Adicionar novos status ao enum
ALTER TYPE pagamento_status ADD VALUE 'estorno_solicitado';
ALTER TYPE pagamento_status ADD VALUE 'estorno_processando';
ALTER TYPE pagamento_status ADD VALUE 'estorno_falhou';

-- Novo enum para tipo de estorno
CREATE TYPE estorno_tipo AS ENUM ('total', 'parcial');

-- Novo enum para status do estorno
CREATE TYPE estorno_status AS ENUM (
  'solicitado', 'aprovado', 'processando', 
  'concluido', 'recusado', 'falhou'
);

-- Novo enum para categoria do motivo
CREATE TYPE estorno_motivo_categoria AS ENUM (
  'nao_compareceu', 'defeito_produto', 'servico_incompleto',
  'desistencia_cliente', 'erro_sistema', 'outro'
);

-- Tabela de estornos
CREATE TABLE estornos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pagamento_id UUID NOT NULL REFERENCES pagamentos(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  ordem_servico_id UUID REFERENCES ordem_servico(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  montador_id UUID NOT NULL REFERENCES montadores(id),
  valor_estorno NUMERIC NOT NULL,
  valor_original NUMERIC NOT NULL,
  tipo estorno_tipo NOT NULL DEFAULT 'total',
  motivo TEXT NOT NULL,
  motivo_categoria estorno_motivo_categoria NOT NULL,
  solicitado_por UUID NOT NULL,
  aprovado_por UUID,
  status estorno_status NOT NULL DEFAULT 'solicitado',
  mercado_pago_refund_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT valor_estorno_positivo CHECK (valor_estorno > 0),
  CONSTRAINT valor_estorno_max CHECK (valor_estorno <= valor_original)
);

-- Índices
CREATE INDEX idx_estornos_pagamento ON estornos(pagamento_id);
CREATE INDEX idx_estornos_status ON estornos(status);
CREATE INDEX idx_estornos_created ON estornos(created_at DESC);

-- RLS
ALTER TABLE estornos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Clientes podem ver seus estornos"
  ON estornos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = estornos.cliente_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Admins podem ver todos os estornos"
  ON estornos FOR SELECT
  USING (is_admin());

CREATE POLICY "Sistema pode gerenciar estornos"
  ON estornos FOR ALL
  USING (true);
```

**Migração 2: Status cancelado para OS**
```sql
ALTER TYPE ordem_servico_status ADD VALUE 'cancelada';
```

**Migração 3: Função de processamento**
```sql
CREATE OR REPLACE FUNCTION processar_estorno_completo(
  p_estorno_id UUID,
  p_mp_refund_id TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_estorno RECORD;
  v_carteira_id UUID;
  v_saldo_processamento NUMERIC;
  v_saldo_disponivel NUMERIC;
  v_montador_user_id UUID;
  v_cliente_user_id UUID;
BEGIN
  -- Buscar dados do estorno
  SELECT * INTO v_estorno FROM estornos WHERE id = p_estorno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estorno não encontrado';
  END IF;

  -- Atualizar pagamento
  UPDATE pagamentos SET 
    status = 'estornado',
    updated_at = now()
  WHERE id = v_estorno.pagamento_id;

  -- Buscar carteira e saldos
  SELECT id, saldo_em_processamento, saldo_disponivel 
  INTO v_carteira_id, v_saldo_processamento, v_saldo_disponivel
  FROM carteira WHERE montador_id = v_estorno.montador_id;

  -- Reverter valor da carteira (80% do valor estornado)
  DECLARE
    v_valor_montador NUMERIC := v_estorno.valor_estorno * 0.80;
  BEGIN
    IF v_saldo_processamento >= v_valor_montador THEN
      -- Valor ainda em processamento
      UPDATE carteira SET 
        saldo_em_processamento = saldo_em_processamento - v_valor_montador
      WHERE id = v_carteira_id;
    ELSE
      -- Valor já disponível, debitar do disponível
      UPDATE carteira SET 
        saldo_disponivel = saldo_disponivel - v_valor_montador
      WHERE id = v_carteira_id;
    END IF;
  END;

  -- Registrar transação de estorno
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, job_id, pagamento_id
  ) VALUES (
    v_carteira_id, 'estorno', v_estorno.valor_estorno * 0.80,
    'Estorno de pagamento - ' || v_estorno.motivo,
    v_estorno.job_id, v_estorno.pagamento_id
  );

  -- Cancelar ordem de serviço (se existir)
  IF v_estorno.ordem_servico_id IS NOT NULL THEN
    UPDATE ordem_servico SET status = 'cancelada'
    WHERE id = v_estorno.ordem_servico_id;
  END IF;

  -- Atualizar job
  UPDATE jobs SET status = 'cancelado'
  WHERE id = v_estorno.job_id;

  -- Atualizar negociação
  UPDATE negociacoes SET 
    status = 'cancelado',
    motivo_cancelamento = 'Estorno solicitado: ' || v_estorno.motivo
  WHERE job_id = v_estorno.job_id;

  -- Buscar user_ids para notificações
  SELECT user_id INTO v_montador_user_id 
  FROM montadores WHERE id = v_estorno.montador_id;
  
  SELECT user_id INTO v_cliente_user_id 
  FROM clientes WHERE id = v_estorno.cliente_id;

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id, 'pagamento',
    'Pagamento estornado: R$ ' || v_estorno.valor_estorno || ' - ' || v_estorno.motivo,
    jsonb_build_object('estorno_id', p_estorno_id, 'job_id', v_estorno.job_id)
  );

  -- Notificar cliente
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_cliente_user_id, 'pagamento',
    'Estorno processado: R$ ' || v_estorno.valor_estorno || ' será devolvido em até 10 dias úteis',
    jsonb_build_object('estorno_id', p_estorno_id, 'job_id', v_estorno.job_id)
  );

  -- Atualizar estorno como concluído
  UPDATE estornos SET 
    status = 'concluido',
    mercado_pago_refund_id = p_mp_refund_id,
    processed_at = now()
  WHERE id = p_estorno_id;

  RETURN true;
END;
$$;
```

---

## Fluxo Visual

```text
Cliente                 Sistema                 Mercado Pago              Admin
   │                       │                         │                      │
   │  Solicitar Estorno    │                         │                      │
   ├──────────────────────>│                         │                      │
   │                       │                         │                      │
   │                       │ Validar condições       │                      │
   │                       ├─────────────────────────│                      │
   │                       │                         │                      │
   │                       │ Criar registro estorno  │                      │
   │                       ├─────────────────────────│                      │
   │                       │                         │                      │
   │                       │  [Se automático]        │                      │
   │                       │  POST /refunds          │                      │
   │                       ├────────────────────────>│                      │
   │                       │                         │                      │
   │                       │     Refund ID           │                      │
   │                       │<────────────────────────│                      │
   │                       │                         │                      │
   │                       │ processar_estorno()     │                      │
   │                       ├─────────────────────────│                      │
   │                       │                         │                      │
   │  Notificação          │                         │                      │
   │<──────────────────────│                         │                      │
   │                       │                         │                      │
   │                       │  [Se requer aprovação]  │                      │
   │                       │  Notificar admin        │                      │
   │                       ├─────────────────────────────────────────────────>
   │                       │                         │                      │
   │                       │                         │  Aprovar/Recusar     │
   │                       │<─────────────────────────────────────────────────
   │                       │                         │                      │
   │                       │  [Se aprovado]          │                      │
   │                       │  POST /refunds          │                      │
   │                       ├────────────────────────>│                      │
```

---

## Medidas de Segurança

### Validações Implementadas
1. **Autenticação JWT obrigatória** em todas as requisições
2. **Verificação de propriedade** - cliente só pode estornar seus próprios pagamentos
3. **Idempotência** - chave única para evitar estornos duplicados
4. **Limite de valor** - não pode exceder valor original
5. **Janela de tempo** - respeitar limite do Mercado Pago (180 dias)
6. **Rate limiting** - 1 solicitação por pagamento por hora
7. **Auditoria completa** - todos os estornos registrados com metadata

### Proteções Contra Fraude
1. **Verificação de status da OS** - não permitir estorno após conclusão
2. **Verificação de garantia** - regras especiais durante período de garantia
3. **Aprovação admin** - estornos acima de X valor requerem aprovação
4. **Logs detalhados** - rastreabilidade completa

---

## Próximos Passos Após Aprovação

1. Executar migrações de banco de dados
2. Criar edge function `mp-refund`
3. Atualizar `mp-webhook` para eventos de refund
4. Implementar hook `useEstorno`
5. Criar modal de solicitação de estorno
6. Criar painel admin de gestão de estornos
7. Testar fluxo completo em ambiente de teste
8. Deploy em produção

---

## Considerações Importantes

### Limitações do Mercado Pago
- Estornos podem levar até 10 dias úteis para serem creditados
- Estornos parciais podem não ser suportados para alguns métodos de pagamento
- Pagamentos via boleto têm regras específicas de estorno

### Comunicação com Usuário
- Informar prazo estimado de devolução (até 10 dias úteis)
- Notificar em tempo real sobre cada etapa do processo
- Fornecer número de protocolo (estorno_id) para acompanhamento
