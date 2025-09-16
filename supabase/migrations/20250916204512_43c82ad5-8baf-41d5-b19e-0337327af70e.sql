-- Corrigir políticas RLS para carteira_transacoes - adicionar policies para INSERT
CREATE POLICY "Sistema pode inserir transações de carteira" 
ON carteira_transacoes FOR INSERT 
WITH CHECK (true);

-- Política para UPDATE (caso necessário para processamento)
CREATE POLICY "Sistema pode atualizar transações" 
ON carteira_transacoes FOR UPDATE 
USING (true);

-- Atualizar política RLS da tabela pagamentos para permitir operações do sistema
CREATE POLICY "Sistema pode atualizar pagamentos" 
ON pagamentos FOR UPDATE 
USING (true);

CREATE POLICY "Sistema pode inserir pagamentos" 
ON pagamentos FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Clientes podem ver seus pagamentos" 
ON pagamentos FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clientes c 
    WHERE c.id = pagamentos.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores podem ver pagamentos relacionados" 
ON pagamentos FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM montadores m 
    WHERE m.id = pagamentos.montador_id AND m.user_id = auth.uid()
  )
);