-- Atualizar tabela negociacoes para incluir campos de pagamento
ALTER TABLE negociacoes 
ADD COLUMN IF NOT EXISTS pagamento_id uuid REFERENCES pagamentos(id),
ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone,
ADD COLUMN IF NOT EXISTS valor_final numeric;

-- Atualizar tabela pagamentos para incluir novos campos
ALTER TABLE pagamentos 
ADD COLUMN IF NOT EXISTS mercado_pago_preference_id text,
ADD COLUMN IF NOT EXISTS mercado_pago_payment_id text,
ADD COLUMN IF NOT EXISTS mercado_pago_payment_method text,
ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS processed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS failure_reason text;

-- Atualizar tabela carteira para incluir sistema de maturação
ALTER TABLE carteira 
ADD COLUMN IF NOT EXISTS saldo_em_processamento numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_liberacao_admin timestamp with time zone;

-- Criar tabela para histórico de transações na carteira
CREATE TABLE IF NOT EXISTS carteira_transacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carteira_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('entrada', 'saida', 'bloqueio', 'liberacao')),
  valor numeric NOT NULL,
  descricao text NOT NULL,
  job_id uuid,
  pagamento_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  processed_by uuid
);

-- Enable RLS
ALTER TABLE carteira_transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas para carteira_transacoes
CREATE POLICY "Montadores podem ver suas transações" 
ON carteira_transacoes FOR SELECT 
USING (
  carteira_id IN (
    SELECT c.id FROM carteira c 
    JOIN montadores m ON c.montador_id = m.id 
    WHERE m.user_id = auth.uid()
  )
);

-- Admins podem ver todas as transações
CREATE POLICY "Admins podem ver todas as transações" 
ON carteira_transacoes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Função para processar pagamento aprovado
CREATE OR REPLACE FUNCTION processar_pagamento_aprovado(
  p_pagamento_id uuid,
  p_mp_payment_id text,
  p_mp_payment_method text,
  p_installments integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor numeric;
  v_montador_id uuid;
  v_job_id uuid;
  v_carteira_id uuid;
  v_negociacao_id uuid;
BEGIN
  -- Buscar dados do pagamento
  SELECT valor_total, montador_id, job_id 
  INTO v_valor, v_montador_id, v_job_id
  FROM pagamentos 
  WHERE id = p_pagamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado';
  END IF;

  -- Atualizar pagamento como aprovado
  UPDATE pagamentos SET 
    status = 'aprovado',
    mercado_pago_payment_id = p_mp_payment_id,
    mercado_pago_payment_method = p_mp_payment_method,
    installments = p_installments,
    processed_at = now()
  WHERE id = p_pagamento_id;

  -- Buscar carteira do montador
  SELECT id INTO v_carteira_id 
  FROM carteira 
  WHERE montador_id = v_montador_id;

  -- Bloquear valor na carteira (vai para saldo_em_processamento)
  UPDATE carteira SET 
    saldo_em_processamento = saldo_em_processamento + v_valor,
    data_liberacao_admin = now() + interval '3 days'
  WHERE id = v_carteira_id;

  -- Registrar transação de bloqueio
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, job_id, pagamento_id
  ) VALUES (
    v_carteira_id, 'bloqueio', v_valor, 
    'Valor bloqueado - aguardando liberação (3 dias)', 
    v_job_id, p_pagamento_id
  );

  -- Atualizar negociação
  SELECT id INTO v_negociacao_id
  FROM negociacoes 
  WHERE job_id = v_job_id AND montador_id = v_montador_id;

  UPDATE negociacoes SET 
    pagamento_id = p_pagamento_id,
    data_pagamento = now(),
    valor_final = v_valor
  WHERE id = v_negociacao_id;

  -- Atualizar status do job para 'pago'
  UPDATE jobs SET status = 'pago' WHERE id = v_job_id;

  RETURN true;
END;
$$;

-- Função para liberar valor bloqueado (admin)
CREATE OR REPLACE FUNCTION liberar_valor_carteira(
  p_carteira_id uuid,
  p_admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_processamento numeric;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem liberar valores';
  END IF;

  -- Buscar valor em processamento
  SELECT saldo_em_processamento 
  INTO v_valor_processamento
  FROM carteira 
  WHERE id = p_carteira_id;

  IF v_valor_processamento <= 0 THEN
    RAISE EXCEPTION 'Não há valor para liberar';
  END IF;

  -- Transferir de processamento para disponível
  UPDATE carteira SET 
    saldo_disponivel = saldo_disponivel + v_valor_processamento,
    saldo_em_processamento = 0,
    data_liberacao_admin = null
  WHERE id = p_carteira_id;

  -- Registrar transação de liberação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, processed_by
  ) VALUES (
    p_carteira_id, 'liberacao', v_valor_processamento, 
    'Valor liberado pelo admin', p_admin_user_id
  );

  RETURN true;
END;
$$;

-- Trigger para notificar sobre pagamentos aprovados
CREATE OR REPLACE FUNCTION notify_payment_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  montador_user_id UUID;
  cliente_user_id UUID;
  job_descricao TEXT;
BEGIN
  -- Só processar quando status muda para aprovado
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    -- Buscar user_id do montador
    SELECT m.user_id INTO montador_user_id
    FROM montadores m
    WHERE m.id = NEW.montador_id;
    
    -- Buscar user_id do cliente
    SELECT c.user_id INTO cliente_user_id
    FROM clientes c
    WHERE c.id = NEW.cliente_id;
    
    -- Buscar descrição do job
    SELECT j.descricao INTO job_descricao
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    -- Notificar montador
    INSERT INTO notificacoes (user_id, tipo, mensagem)
    VALUES (
      montador_user_id,
      'pagamento',
      'Pagamento recebido: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '... (Valor bloqueado por 3 dias)'
    );
    
    -- Notificar cliente
    INSERT INTO notificacoes (user_id, tipo, mensagem)
    VALUES (
      cliente_user_id,
      'pagamento',
      'Pagamento confirmado: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '...'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para pagamentos
CREATE TRIGGER notify_payment_status_change
  AFTER UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_approved();