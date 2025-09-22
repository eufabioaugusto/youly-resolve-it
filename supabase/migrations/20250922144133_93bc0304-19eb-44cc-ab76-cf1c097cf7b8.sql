-- Ativar realtime para a tabela negociacoes
ALTER TABLE public.negociacoes REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.negociacoes;

-- Ativar realtime para a tabela notificacoes
ALTER TABLE public.notificacoes REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;