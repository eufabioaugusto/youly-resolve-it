-- =====================================================
-- SISTEMA DE ESTORNO/CANCELAMENTO AVANÇADO
-- =====================================================

-- 1. Adicionar novos status ao enum pagamento_status
ALTER TYPE pagamento_status ADD VALUE IF NOT EXISTS 'estorno_solicitado';
ALTER TYPE pagamento_status ADD VALUE IF NOT EXISTS 'estorno_processando';
ALTER TYPE pagamento_status ADD VALUE IF NOT EXISTS 'estorno_falhou';

-- 2. Adicionar status cancelada ao enum ordem_servico_status
ALTER TYPE ordem_servico_status ADD VALUE IF NOT EXISTS 'cancelada';

-- 3. Criar enum para tipo de estorno
DO $$ BEGIN
  CREATE TYPE estorno_tipo AS ENUM ('total', 'parcial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Criar enum para status do estorno
DO $$ BEGIN
  CREATE TYPE estorno_status AS ENUM (
    'solicitado', 
    'aprovado', 
    'processando', 
    'concluido', 
    'recusado', 
    'falhou'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 5. Criar enum para categoria do motivo
DO $$ BEGIN
  CREATE TYPE estorno_motivo_categoria AS ENUM (
    'nao_compareceu', 
    'defeito_produto', 
    'servico_incompleto',
    'desistencia_cliente', 
    'erro_sistema', 
    'outro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 6. Criar tabela de estornos
CREATE TABLE IF NOT EXISTS public.estornos (
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

-- 7. Criar índices
CREATE INDEX IF NOT EXISTS idx_estornos_pagamento ON estornos(pagamento_id);
CREATE INDEX IF NOT EXISTS idx_estornos_status ON estornos(status);
CREATE INDEX IF NOT EXISTS idx_estornos_created ON estornos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estornos_cliente ON estornos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estornos_montador ON estornos(montador_id);

-- 8. Habilitar RLS
ALTER TABLE estornos ENABLE ROW LEVEL SECURITY;

-- 9. Políticas de segurança
CREATE POLICY "Clientes podem ver seus estornos"
  ON estornos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = estornos.cliente_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Montadores podem ver estornos relacionados"
  ON estornos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM montadores m 
    WHERE m.id = estornos.montador_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Admins podem ver todos os estornos"
  ON estornos FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins podem atualizar estornos"
  ON estornos FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Sistema pode gerenciar estornos"
  ON estornos FOR ALL
  USING (true)
  WITH CHECK (true);

-- 10. Função para processar estorno completo (ATOMIC)
CREATE OR REPLACE FUNCTION public.processar_estorno_completo(
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
  v_valor_montador NUMERIC;
BEGIN
  -- Buscar dados do estorno
  SELECT * INTO v_estorno FROM estornos WHERE id = p_estorno_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estorno não encontrado';
  END IF;

  -- Verificar se já foi processado (idempotência)
  IF v_estorno.status = 'concluido' THEN
    RAISE NOTICE 'Estorno já foi processado anteriormente';
    RETURN true;
  END IF;

  -- Calcular valor do montador (80%)
  v_valor_montador := v_estorno.valor_estorno * 0.80;

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
  IF v_saldo_processamento >= v_valor_montador THEN
    -- Valor ainda em processamento - debitar de lá
    UPDATE carteira SET 
      saldo_em_processamento = saldo_em_processamento - v_valor_montador,
      updated_at = now()
    WHERE id = v_carteira_id;
  ELSIF v_saldo_disponivel >= v_valor_montador THEN
    -- Valor já disponível - debitar do disponível
    UPDATE carteira SET 
      saldo_disponivel = saldo_disponivel - v_valor_montador,
      updated_at = now()
    WHERE id = v_carteira_id;
  ELSE
    -- Combinar ambos os saldos se necessário
    UPDATE carteira SET 
      saldo_em_processamento = GREATEST(0, saldo_em_processamento - v_valor_montador),
      saldo_disponivel = GREATEST(0, saldo_disponivel - GREATEST(0, v_valor_montador - saldo_em_processamento)),
      updated_at = now()
    WHERE id = v_carteira_id;
  END IF;

  -- Registrar transação de estorno
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, job_id, pagamento_id
  ) VALUES (
    v_carteira_id, 'estorno', -v_valor_montador,
    'Estorno de pagamento - ' || v_estorno.motivo,
    v_estorno.job_id, v_estorno.pagamento_id
  );

  -- Cancelar ordem de serviço (se existir)
  IF v_estorno.ordem_servico_id IS NOT NULL THEN
    UPDATE ordem_servico SET 
      status = 'cancelada',
      updated_at = now()
    WHERE id = v_estorno.ordem_servico_id;
  END IF;

  -- Atualizar job
  UPDATE jobs SET 
    status = 'cancelado',
    updated_at = now()
  WHERE id = v_estorno.job_id;

  -- Atualizar negociação
  UPDATE negociacoes SET 
    status = 'cancelado',
    motivo_cancelamento = 'Estorno processado: ' || v_estorno.motivo,
    data_cancelamento = now(),
    updated_at = now()
  WHERE job_id = v_estorno.job_id 
    AND montador_id = v_estorno.montador_id;

  -- Reverter total_valor_movimentado do montador
  UPDATE montadores SET
    total_valor_movimentado = GREATEST(0, total_valor_movimentado - v_valor_montador),
    updated_at = now()
  WHERE id = v_estorno.montador_id;

  -- Buscar user_ids para notificações
  SELECT user_id INTO v_montador_user_id 
  FROM montadores WHERE id = v_estorno.montador_id;
  
  SELECT user_id INTO v_cliente_user_id 
  FROM clientes WHERE id = v_estorno.cliente_id;

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id, 'pagamento',
    'Pagamento estornado: R$ ' || v_estorno.valor_estorno::TEXT || ' - ' || v_estorno.motivo,
    jsonb_build_object('estorno_id', p_estorno_id, 'job_id', v_estorno.job_id)
  );

  -- Notificar cliente
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_cliente_user_id, 'pagamento',
    'Estorno processado: R$ ' || v_estorno.valor_estorno::TEXT || ' será devolvido em até 10 dias úteis',
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

-- 11. Função para verificar se estorno é permitido
CREATE OR REPLACE FUNCTION public.verificar_permissao_estorno(
  p_pagamento_id UUID,
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_pagamento RECORD;
  v_os RECORD;
  v_cliente_user_id UUID;
  v_is_admin BOOLEAN;
  v_horas_desde_pagamento NUMERIC;
  v_resultado JSONB;
BEGIN
  -- Verificar se é admin
  v_is_admin := public.is_admin(p_user_id);

  -- Buscar pagamento
  SELECT p.*, c.user_id as cliente_user_id
  INTO v_pagamento
  FROM pagamentos p
  JOIN clientes c ON p.cliente_id = c.id
  WHERE p.id = p_pagamento_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('permitido', false, 'motivo', 'Pagamento não encontrado');
  END IF;

  -- Verificar se já existe estorno em andamento
  IF EXISTS (SELECT 1 FROM estornos WHERE pagamento_id = p_pagamento_id AND status NOT IN ('concluido', 'recusado', 'falhou')) THEN
    RETURN jsonb_build_object('permitido', false, 'motivo', 'Já existe uma solicitação de estorno em andamento');
  END IF;

  -- Verificar se usuário tem permissão (cliente dono ou admin)
  IF NOT v_is_admin AND v_pagamento.cliente_user_id != p_user_id THEN
    RETURN jsonb_build_object('permitido', false, 'motivo', 'Você não tem permissão para solicitar estorno deste pagamento');
  END IF;

  -- Verificar status do pagamento
  IF v_pagamento.status != 'pago' THEN
    RETURN jsonb_build_object('permitido', false, 'motivo', 'Pagamento não está com status pago');
  END IF;

  -- Calcular tempo desde o pagamento
  v_horas_desde_pagamento := EXTRACT(EPOCH FROM (now() - v_pagamento.processed_at)) / 3600;

  -- Buscar ordem de serviço (se existir)
  SELECT * INTO v_os
  FROM ordem_servico
  WHERE job_id = v_pagamento.job_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Verificar status da OS e definir regras
  IF v_os IS NOT NULL THEN
    CASE v_os.status
      WHEN 'concluida', 'concluida_com_assistencia' THEN
        RETURN jsonb_build_object(
          'permitido', false, 
          'motivo', 'Não é possível estornar após conclusão do serviço'
        );
      WHEN 'iniciada' THEN
        RETURN jsonb_build_object(
          'permitido', true,
          'requer_aprovacao', true,
          'percentual_maximo', 50,
          'motivo', 'Estorno parcial - serviço em andamento'
        );
      WHEN 'a_caminho' THEN
        RETURN jsonb_build_object(
          'permitido', true,
          'requer_aprovacao', true,
          'percentual_maximo', 90,
          'motivo', 'Estorno com desconto - montador já está a caminho'
        );
      WHEN 'pendente' THEN
        IF v_horas_desde_pagamento <= 24 THEN
          RETURN jsonb_build_object(
            'permitido', true,
            'requer_aprovacao', false,
            'percentual_maximo', 100,
            'motivo', 'Estorno automático - menos de 24h e serviço não iniciado'
          );
        ELSE
          RETURN jsonb_build_object(
            'permitido', true,
            'requer_aprovacao', true,
            'percentual_maximo', 100,
            'motivo', 'Estorno requer aprovação - mais de 24h'
          );
        END IF;
      ELSE
        RETURN jsonb_build_object(
          'permitido', true,
          'requer_aprovacao', true,
          'percentual_maximo', 100,
          'motivo', 'Estorno requer aprovação administrativa'
        );
    END CASE;
  ELSE
    -- Sem OS ainda - permitir estorno total
    RETURN jsonb_build_object(
      'permitido', true,
      'requer_aprovacao', false,
      'percentual_maximo', 100,
      'motivo', 'Estorno automático - OS não criada'
    );
  END IF;
END;
$$;

-- 12. Trigger para notificar admin quando estorno é criado
CREATE OR REPLACE FUNCTION public.notify_admin_new_estorno()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_admin_user_id UUID;
  v_job_descricao TEXT;
BEGIN
  -- Buscar descrição do job
  SELECT descricao INTO v_job_descricao
  FROM jobs WHERE id = NEW.job_id;

  -- Notificar todos os admins
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  SELECT 
    ur.user_id,
    'sistema',
    'Nova solicitação de estorno: R$ ' || NEW.valor_estorno::TEXT || ' - ' || substring(v_job_descricao, 1, 40) || '...',
    jsonb_build_object('estorno_id', NEW.id, 'job_id', NEW.job_id)
  FROM user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$$;

-- Criar trigger apenas para estornos que requerem aprovação
DROP TRIGGER IF EXISTS trigger_notify_admin_estorno ON estornos;
CREATE TRIGGER trigger_notify_admin_estorno
  AFTER INSERT ON estornos
  FOR EACH ROW
  WHEN (NEW.status = 'solicitado')
  EXECUTE FUNCTION notify_admin_new_estorno();