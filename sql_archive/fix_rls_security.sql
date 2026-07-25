-- ==============================================================
-- FIX DE SEGURANÇA: Políticas de RLS abertas para o role "public"
-- Execute manualmente no SQL Editor do Supabase (não é aplicado automaticamente)
-- ==============================================================
--
-- Contexto: as políticas abaixo foram criadas com "USING (true)" e sem a
-- cláusula "TO authenticated". Em Postgres/Supabase, uma policy sem "TO"
-- vale para o role PUBLIC, o que inclui o role "anon" — ou seja, a
-- própria anon key exposta no bundle do frontend (VITE_SUPABASE_ANON_KEY)
-- consegue ler/gravar essas tabelas via API REST direta, sem login algum.
--
-- Este script recria as políticas restringindo a "authenticated",
-- mantendo o mesmo comportamento para usuários logados.

-- 1. orcamentos_servico (dados comerciais sensíveis: valores, clientes)
DROP POLICY IF EXISTS "Acesso total orçamentos" ON public.orcamentos_servico;
CREATE POLICY "Acesso total orçamentos" ON public.orcamentos_servico
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. ferramentas
DROP POLICY IF EXISTS "ferramentas_select_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_insert_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_update_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_delete_all" ON public.ferramentas;
CREATE POLICY "ferramentas_select_all" ON public.ferramentas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ferramentas_insert_all" ON public.ferramentas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ferramentas_update_all" ON public.ferramentas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "ferramentas_delete_all" ON public.ferramentas FOR DELETE TO authenticated USING (true);

-- 3. movimentacoes_ferramentas
DROP POLICY IF EXISTS "mov_ferramentas_select_all" ON public.movimentacoes_ferramentas;
DROP POLICY IF EXISTS "mov_ferramentas_insert_all" ON public.movimentacoes_ferramentas;
CREATE POLICY "mov_ferramentas_select_all" ON public.movimentacoes_ferramentas FOR SELECT TO authenticated USING (true);
CREATE POLICY "mov_ferramentas_insert_all" ON public.movimentacoes_ferramentas FOR INSERT TO authenticated WITH CHECK (true);

-- 4. vistorias_veiculos
DROP POLICY IF EXISTS "vistorias_select_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_insert_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_update_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_delete_all" ON public.vistorias_veiculos;
CREATE POLICY "vistorias_select_all" ON public.vistorias_veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "vistorias_insert_all" ON public.vistorias_veiculos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vistorias_update_all" ON public.vistorias_veiculos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vistorias_delete_all" ON public.vistorias_veiculos FOR DELETE TO authenticated USING (true);

-- 5. anexos_os (metadados de anexos: URL, descrição, OS vinculada)
DROP POLICY IF EXISTS "anexos_os_select_policy" ON public.anexos_os;
CREATE POLICY "anexos_os_select_policy" ON public.anexos_os
    FOR SELECT
    TO authenticated
    USING (true);

-- ==============================================================
-- NÃO alterado de propósito (decisão de produto, não bug técnico):
--
-- O bucket de Storage "anexos_os" e sua policy de SELECT em
-- storage.objects continuam públicos (sem "TO authenticated"). Isso
-- permite que um link de anexo (PDF/imagem) seja aberto por qualquer
-- pessoa que o receba, mesmo sem estar logada no sistema — útil para
-- enviar um anexo a um cliente por WhatsApp/e-mail, por exemplo.
-- Se esse NÃO for o comportamento desejado, troque manualmente a
-- policy "Permitir leitura para todos no bucket" em storage.objects
-- para "TO authenticated".
-- ==============================================================

SELECT 'Políticas de RLS corrigidas com sucesso' AS resultado;
