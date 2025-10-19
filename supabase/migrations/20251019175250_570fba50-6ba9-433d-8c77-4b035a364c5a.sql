-- Deletar a OS duplicada (a mais recente)
DELETE FROM ordem_servico 
WHERE id = '72477346-f259-425a-b28c-806b1a135c9b';

-- Garantir que o job aponta para a OS correta
UPDATE jobs 
SET ordem_servico_id = '64846b36-b25f-4bd8-a660-2c2de63d5ecc'
WHERE id = 'b290bf6a-c3d1-4b39-865a-7ba92f224f79';