-- Criar trigger para atualizar estatísticas do montador quando OS for finalizada
CREATE OR REPLACE TRIGGER trigger_atualizar_stats_os
  AFTER UPDATE ON ordem_servico
  FOR EACH ROW
  WHEN (
    NEW.status IN ('concluida', 'concluida_com_assistencia') 
    AND OLD.status IS DISTINCT FROM NEW.status
  )
  EXECUTE FUNCTION trigger_atualizar_stats_montador();

-- Criar trigger para atualizar estatísticas quando avaliação for criada
CREATE OR REPLACE TRIGGER trigger_atualizar_stats_avaliacao
  AFTER INSERT ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_stats_montador();

-- Atualizar estatísticas dos montadores existentes (corrigir histórico)
DO $$
DECLARE
  montador_record RECORD;
BEGIN
  FOR montador_record IN 
    SELECT DISTINCT montador_id 
    FROM ordem_servico 
    WHERE montador_id IS NOT NULL
  LOOP
    PERFORM atualizar_estatisticas_montador(montador_record.montador_id);
  END LOOP;
END $$;