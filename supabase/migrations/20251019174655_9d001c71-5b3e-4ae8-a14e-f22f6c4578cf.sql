-- Remover a política problemática que causa recursão
DROP POLICY IF EXISTS "Montadores podem ver clientes de suas OS" ON clientes;

-- Criar função security definer para verificar se montador tem acesso ao cliente
CREATE OR REPLACE FUNCTION public.montador_pode_ver_cliente(
  p_cliente_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM ordem_servico os
    JOIN montadores m ON os.montador_id = m.id
    WHERE os.cliente_id = p_cliente_id
    AND m.user_id = p_user_id
  );
$$;

-- Criar nova política usando a função security definer
CREATE POLICY "Montadores podem ver clientes de suas OS"
ON clientes
FOR SELECT
USING (
  public.montador_pode_ver_cliente(id, auth.uid())
);