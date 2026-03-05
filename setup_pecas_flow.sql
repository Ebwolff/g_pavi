-- ===== SCRIPT: Preparação do Banco para o Fluxo de Peças =====

-- 1. Verificar tipo da coluna status_separacao
-- Se for VARCHAR (text), apenas usamos os novos valores no frontend.
-- Se for ENUM, precisamos adicionar os novos valores.

-- Para VARCHAR: apenas garantir que a coluna existe (já existe)
-- Novos valores que serão utilizados:
-- PENDENTE, SOLICITADO_ESTOQUE, SOLICITADO_COMPRA, SEPARANDO, AGUARDANDO_RETIRADA, RETIRADO

-- 2. RLS para solicitacoes_compra (permitir INSERT para consultores)
DROP POLICY IF EXISTS "Permitir select solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir insert solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir update solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir delete solicitacoes_compra para autenticados" ON public.solicitacoes_compra;

ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir select solicitacoes_compra para autenticados"
ON public.solicitacoes_compra FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir insert solicitacoes_compra para autenticados"
ON public.solicitacoes_compra FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir update solicitacoes_compra para autenticados"
ON public.solicitacoes_compra FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir delete solicitacoes_compra para autenticados"
ON public.solicitacoes_compra FOR DELETE
TO authenticated
USING (true);

-- 3. RLS para itens_os (update - permitir consultores a atualizar status)
DROP POLICY IF EXISTS "Permitir update de itens_os para usuarios autenticados" ON public.itens_os;

CREATE POLICY "Permitir update de itens_os para usuarios autenticados"
ON public.itens_os FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
