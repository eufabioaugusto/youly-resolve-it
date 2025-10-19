-- Criar função para atualizar estatísticas do cliente
CREATE OR REPLACE FUNCTION atualizar_estatisticas_cliente(p_cliente_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_jobs INTEGER;
  v_total_avaliacoes INTEGER;
  v_soma_notas NUMERIC;
  v_media NUMERIC;
BEGIN
  -- Contar jobs criados pelo cliente
  SELECT COUNT(*) INTO v_total_jobs
  FROM jobs
  WHERE cliente_id = p_cliente_id;
  
  -- Calcular média de avaliações recebidas pelo cliente
  SELECT COUNT(*), COALESCE(SUM(nota), 0) INTO v_total_avaliacoes, v_soma_notas
  FROM avaliacoes
  WHERE cliente_id = p_cliente_id;
  
  IF v_total_avaliacoes > 0 THEN
    v_media := v_soma_notas / v_total_avaliacoes;
  ELSE
    v_media := 0;
  END IF;
  
  -- Atualizar cliente
  UPDATE clientes SET
    pedidos_total = v_total_jobs,
    avaliacao_media = v_media,
    updated_at = now()
  WHERE id = p_cliente_id;
  
  RETURN true;
END;
$$;

-- Criar trigger para atualizar stats do cliente quando job for criado
CREATE OR REPLACE FUNCTION trigger_atualizar_stats_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM atualizar_estatisticas_cliente(NEW.cliente_id);
  RETURN NEW;
END;
$$;

-- Trigger ao criar job
CREATE OR REPLACE TRIGGER trigger_atualizar_stats_cliente_job
  AFTER INSERT ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_stats_cliente();

-- Atualizar estatísticas dos clientes existentes (corrigir histórico)
DO $$
DECLARE
  cliente_record RECORD;
BEGIN
  FOR cliente_record IN 
    SELECT DISTINCT cliente_id 
    FROM jobs 
    WHERE cliente_id IS NOT NULL
  LOOP
    PERFORM atualizar_estatisticas_cliente(cliente_record.cliente_id);
  END LOOP;
END $$;