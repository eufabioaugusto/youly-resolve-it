-- Corrigir registros travados após estorno bem-sucedido no MP
-- Job: cancelado
UPDATE jobs SET status = 'cancelado', updated_at = now() 
WHERE id = '28874559-73dd-44a4-9213-4d9a834523c6';

-- Ordem de Serviço: cancelada (ambas as OS)
UPDATE ordem_servico SET status = 'cancelada', updated_at = now() 
WHERE job_id = '28874559-73dd-44a4-9213-4d9a834523c6';

-- Pagamento: estornado
UPDATE pagamentos SET status = 'estornado', updated_at = now() 
WHERE job_id = '28874559-73dd-44a4-9213-4d9a834523c6';

-- Negociação: cancelado
UPDATE negociacoes SET status = 'cancelado', motivo_cancelamento = 'Estorno processado', data_cancelamento = now(), updated_at = now()
WHERE job_id = '28874559-73dd-44a4-9213-4d9a834523c6';