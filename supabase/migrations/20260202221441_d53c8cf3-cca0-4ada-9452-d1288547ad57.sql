-- Recriar a função verificar_permissao_estorno com correção
CREATE OR REPLACE FUNCTION public.verificar_permissao_estorno(p_pagamento_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pagamento RECORD;
  v_os RECORD;
  v_is_admin BOOLEAN;
  v_horas_desde_pagamento NUMERIC;
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

  -- Buscar ordem de serviço (se existir) - corrigido para garantir a busca
  SELECT os.* INTO v_os
  FROM ordem_servico os
  WHERE os.job_id = v_pagamento.job_id
  ORDER BY os.created_at DESC
  LIMIT 1;

  -- Debug: Log se encontrou a OS
  RAISE NOTICE 'OS encontrada para job %: %', v_pagamento.job_id, v_os.id;

  -- Verificar status da OS e definir regras
  IF v_os.id IS NOT NULL THEN
    CASE v_os.status
      WHEN 'concluida' THEN
        RETURN jsonb_build_object(
          'permitido', false, 
          'motivo', 'Não é possível estornar após conclusão do serviço'
        );
      WHEN 'concluida_com_assistencia' THEN
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
            'motivo', 'Estorno requer aprovação - mais de 24h desde o pagamento'
          );
        END IF;
      WHEN 'cancelada' THEN
        RETURN jsonb_build_object(
          'permitido', false, 
          'motivo', 'Ordem de serviço já foi cancelada'
        );
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
      'motivo', 'Estorno automático - Ordem de Serviço não criada'
    );
  END IF;
END;
$$;