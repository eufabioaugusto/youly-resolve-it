-- Corrigir função com search_path
CREATE OR REPLACE FUNCTION public.update_montador_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar valores baseados em projetos realizados, avaliações e valor movimentado
  -- Calcular nível baseado nos critérios
  IF NEW.projetos_realizados >= 100 AND NEW.total_avaliacoes >= 50 AND NEW.total_valor_movimentado >= 50000 THEN
    NEW.nivel_gamificacao = 'Hero';
  ELSIF NEW.projetos_realizados >= 50 AND NEW.total_avaliacoes >= 25 AND NEW.total_valor_movimentado >= 25000 THEN
    NEW.nivel_gamificacao = 'Platinum';
  ELSIF NEW.projetos_realizados >= 25 AND NEW.total_avaliacoes >= 15 AND NEW.total_valor_movimentado >= 10000 THEN
    NEW.nivel_gamificacao = 'Gold';
  ELSIF NEW.projetos_realizados >= 10 AND NEW.total_avaliacoes >= 5 AND NEW.total_valor_movimentado >= 5000 THEN
    NEW.nivel_gamificacao = 'Silver';
  ELSE
    NEW.nivel_gamificacao = 'Bronze';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;