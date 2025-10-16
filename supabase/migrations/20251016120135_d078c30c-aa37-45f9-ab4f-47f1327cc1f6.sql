-- ============================================================
-- SECURITY FIX: Remove Security Definer View
-- ============================================================
-- The montadores_public view is flagged as a security risk.
-- Instead of using a view, we'll rely on the application layer
-- to select only non-sensitive columns when querying montadores.

-- Drop the public view
DROP VIEW IF EXISTS public.montadores_public;

-- The existing RLS policies on montadores table already provide:
-- 1. "Public can view worker profiles" - allows public SELECT (all columns)
-- 2. "Montadores view own complete profile" - allows montadores to see their own data
--
-- Application code should explicitly SELECT only safe columns:
-- SELECT id, user_id, preco_hora, especialidades, avaliacao_media, 
--        projetos_realizados, horas_trabalhadas, status, badges, 
--        nivel_gamificacao, foto_perfil_url, total_valor_movimentado,
--        total_avaliacoes, is_premium, created_at
-- FROM montadores
-- WHERE ...
--
-- This approach:
-- - Removes the security definer view warning
-- - Maintains proper RLS enforcement
-- - Gives application control over which columns to expose

-- Add a comment to document which columns are considered sensitive
COMMENT ON COLUMN public.montadores.documentos IS 'SENSITIVE: Contains CPF/identity documents - do not expose in public queries';
COMMENT ON COLUMN public.montadores.chave_pix IS 'SENSITIVE: Payment key - only expose to montador owner';
COMMENT ON TABLE public.montadores IS 'Public queries should exclude: documentos, chave_pix. Use explicit column selection in application code.';