-- Remover fotos das OS duplicadas (se existirem)
DELETE FROM ordem_servico_fotos WHERE ordem_servico_id IN (
  'fd0303b3-27f0-4b00-a71d-54e364e7710c',
  '62d376ed-fafb-4e7c-a7d5-2f6d858b7720',
  '11316448-bf1e-4176-97ec-fc624738114d'
);

-- Remover as 3 OS duplicadas
DELETE FROM ordem_servico WHERE id IN (
  'fd0303b3-27f0-4b00-a71d-54e364e7710c',
  '62d376ed-fafb-4e7c-a7d5-2f6d858b7720',
  '11316448-bf1e-4176-97ec-fc624738114d'
);

-- Adicionar constraint UNIQUE para prevenir futuras duplicações
CREATE UNIQUE INDEX idx_ordem_servico_negociacao_unique ON ordem_servico (negociacao_id);