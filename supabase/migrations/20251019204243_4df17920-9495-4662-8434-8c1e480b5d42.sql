-- Adicionar policy para montadores verem clientes durante negociação
CREATE OR REPLACE FUNCTION montador_pode_ver_cliente_negociacao(p_cliente_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM negociacoes n
    JOIN montadores m ON n.montador_id = m.id
    WHERE n.cliente_id = p_cliente_id
    AND m.user_id = p_user_id
    AND n.status != 'recusado'
  );
$$;

-- Adicionar nova policy para montadores verem clientes em negociação
CREATE POLICY "Montadores podem ver clientes em negociação" 
ON clientes 
FOR SELECT 
USING (montador_pode_ver_cliente_negociacao(id, auth.uid()));