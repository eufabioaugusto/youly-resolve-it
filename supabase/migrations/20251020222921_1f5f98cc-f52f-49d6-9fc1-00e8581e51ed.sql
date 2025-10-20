-- Corrigir o job que não foi atualizado corretamente
UPDATE jobs 
SET 
  montador_id = 'dee04519-5225-4cea-933f-a77a6e2dc5c4',
  status = 'em_negociacao',
  updated_at = now()
WHERE id = '4ef5c17e-81f6-482b-98d0-f9bca515420d';

-- Manter apenas a negociação mais recente e deletar as duplicadas
DELETE FROM negociacoes 
WHERE job_id = '4ef5c17e-81f6-482b-98d0-f9bca515420d'
AND id NOT IN (
  SELECT id FROM negociacoes 
  WHERE job_id = '4ef5c17e-81f6-482b-98d0-f9bca515420d'
  ORDER BY created_at DESC 
  LIMIT 1
);