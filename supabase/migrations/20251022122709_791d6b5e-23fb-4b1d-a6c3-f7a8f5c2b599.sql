-- Simplificar trigger para apenas criar notificação, sem enviar email
CREATE OR REPLACE FUNCTION public.notificar_cadastro_montador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Apenas criar registro, email será enviado pelo admin quando aprovar
  -- Isso evita problemas com chamadas HTTP durante o signup
  RETURN NEW;
END;
$$;

-- Atualizar função para criar montador com status_cadastro correto
CREATE OR REPLACE FUNCTION public.handle_new_montador_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  montador_id_var uuid;
BEGIN
  -- Só processa se for um montador
  IF (NEW.raw_user_meta_data->>'role') = 'montador' THEN
    -- Insere o registro na tabela montadores com status pendente
    INSERT INTO public.montadores (
      user_id,
      preco_hora,
      bio,
      status,
      status_cadastro,
      nivel_gamificacao,
      is_premium,
      avaliacao_media,
      projetos_realizados,
      horas_trabalhadas,
      total_valor_movimentado,
      total_avaliacoes
    )
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'preco_hora')::numeric, NULL),
      COALESCE(NEW.raw_user_meta_data->>'bio', NULL),
      'ativo',
      'pendente', -- Status inicial sempre pendente
      'Bronze',
      false,
      0,
      0,
      0,
      0,
      0
    )
    RETURNING id INTO montador_id_var;
    
    -- Criar carteira para o montador
    INSERT INTO public.carteira (
      montador_id,
      saldo_disponivel,
      saldo_bloqueado,
      saldo_em_processamento,
      total_sacado
    )
    VALUES (
      montador_id_var,
      0,
      0,
      0,
      0
    );
  END IF;
  
  RETURN NEW;
END;
$$;