-- Função para criar perfil de montador quando o usuário é criado
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
    -- Insere o registro na tabela montadores
    INSERT INTO public.montadores (
      user_id,
      preco_hora,
      especialidades,
      status,
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
      COALESCE((NEW.raw_user_meta_data->>'especialidades')::text[], ARRAY[]::text[]),
      'ativo',
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

-- Garante que o trigger existe e está correto
DROP TRIGGER IF EXISTS on_auth_montador_user_created ON auth.users;
CREATE TRIGGER on_auth_montador_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_montador_user();