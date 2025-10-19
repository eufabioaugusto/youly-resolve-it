-- Adicionar campo metadata para armazenar informações específicas das notificações
ALTER TABLE notificacoes 
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN notificacoes.metadata IS 'Armazena dados adicionais como job_id, negociacao_id, ordem_servico_id, etc.';