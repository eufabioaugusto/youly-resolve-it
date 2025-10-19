-- Limpar pagamentos duplicados pendentes (deixar só 1 por job)
DELETE FROM pagamentos 
WHERE id IN (
  '29d3fa5b-0347-4ac0-90ec-620a21b40c4b',
  'a3d617a8-5c5f-411d-a165-9ffd2e327a02',
  '5efdd39a-2995-4e89-a616-053f4f05a533'
);

-- Garantir que jobs com status 'aguardando_pagamento' tenham negociação aceita
UPDATE negociacoes 
SET status = 'aceito'
WHERE status IN ('orcamento_enviado', 'pendente')
AND job_id IN (
  SELECT id FROM jobs WHERE status = 'aguardando_pagamento'
);