-- Primeiro: corrigir dados existentes - criar perfil montador para usuário existente
INSERT INTO montadores (user_id, status, avaliacao_media, projetos_realizados, horas_trabalhadas, especialidades)
SELECT user_id, 'ativo', 0, 0, 0, ARRAY['guarda-roupa', 'mesa', 'cama']::text[]
FROM profiles 
WHERE role = 'montador' AND user_id NOT IN (SELECT user_id FROM montadores);

-- Criar carteira para montadores que não têm
INSERT INTO carteira (montador_id, saldo_disponivel, saldo_bloqueado, total_sacado)
SELECT m.id, 0, 0, 0
FROM montadores m
WHERE m.id NOT IN (SELECT montador_id FROM carteira);

-- Criar trigger para automaticamente criar perfil montador quando usuário se registra como montador
CREATE OR REPLACE FUNCTION create_montador_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Se é um montador, criar o perfil automaticamente
  IF NEW.role = 'montador' AND OLD.role IS DISTINCT FROM 'montador' THEN
    INSERT INTO montadores (user_id, status, avaliacao_media, projetos_realizados, horas_trabalhadas, especialidades)
    VALUES (NEW.user_id, 'ativo', 0, 0, 0, ARRAY['guarda-roupa', 'mesa', 'cama']::text[])
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar carteira também
    INSERT INTO carteira (montador_id, saldo_disponivel, saldo_bloqueado, total_sacado)
    SELECT m.id, 0, 0, 0
    FROM montadores m
    WHERE m.user_id = NEW.user_id
    ON CONFLICT (montador_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para executar a função após update na tabela profiles
CREATE TRIGGER ensure_montador_profile_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION create_montador_profile();