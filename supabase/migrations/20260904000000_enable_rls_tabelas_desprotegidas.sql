-- Habilita RLS nas 5 tabelas que estavam sem nenhuma proteção.
--
-- Sem RLS, a chave anon (publicada no bundle do frontend) dá acesso irrestrito
-- de leitura e escrita a estas tabelas para qualquer pessoa na internet.
--
-- Triggers que escrevem nestas tabelas continuam funcionando: audit_ordens_servico
-- é SECURITY DEFINER e portanto ignora RLS.

-- ============ alertas ============
-- Escopo natural pela coluna usuario_id, que é como o app já consulta a tabela.
-- INSERT fica aberto a autenticados porque notificações são criadas para OUTROS
-- usuários (ver src/lib/notificationHelper.ts) e pela RPC gerar_alertas_os_vencidas,
-- que não é SECURITY DEFINER e roda com as permissões de quem chama.
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alertas_select_own" ON public.alertas;
DROP POLICY IF EXISTS "alertas_insert_authenticated" ON public.alertas;
DROP POLICY IF EXISTS "alertas_update_own" ON public.alertas;
DROP POLICY IF EXISTS "alertas_delete_own" ON public.alertas;

CREATE POLICY "alertas_select_own" ON public.alertas
  FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "alertas_insert_authenticated" ON public.alertas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "alertas_update_own" ON public.alertas
  FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "alertas_delete_own" ON public.alertas
  FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

-- ============ pendencias_os ============
-- Sem coluna de dono; é dado operacional de OS. Leitura para autenticados,
-- escrita para os perfis de gestão.
ALTER TABLE public.pendencias_os ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pendencias_select_authenticated" ON public.pendencias_os;
DROP POLICY IF EXISTS "pendencias_manage_gestao" ON public.pendencias_os;

CREATE POLICY "pendencias_select_authenticated" ON public.pendencias_os
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pendencias_manage_gestao" ON public.pendencias_os
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA']));

-- ============ auditoria_os ============
-- Trilha de auditoria: ninguém escreve pela API (só a trigger SECURITY DEFINER),
-- e só gerente lê. Ausência de política de INSERT/UPDATE/DELETE nega essas
-- operações para os perfis normais, que é exatamente o desejado.
ALTER TABLE public.auditoria_os ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditoria_select_gerente" ON public.auditoria_os;

CREATE POLICY "auditoria_select_gerente" ON public.auditoria_os
  FOR SELECT TO authenticated
  USING (get_user_role() = 'GERENTE');

-- ============ importacoes_log ============
-- Não é consumida pelo app hoje. Restrita a gerente.
ALTER TABLE public.importacoes_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "importacoes_manage_gerente" ON public.importacoes_log;

CREATE POLICY "importacoes_manage_gerente" ON public.importacoes_log
  FOR ALL TO authenticated
  USING (get_user_role() = 'GERENTE')
  WITH CHECK (get_user_role() = 'GERENTE');

-- ============ metas ============
-- Não é consumida pelo app hoje. Leitura para autenticados, escrita para gerente.
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_select_authenticated" ON public.metas;
DROP POLICY IF EXISTS "metas_manage_gerente" ON public.metas;

CREATE POLICY "metas_select_authenticated" ON public.metas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "metas_manage_gerente" ON public.metas
  FOR ALL TO authenticated
  USING (get_user_role() = 'GERENTE')
  WITH CHECK (get_user_role() = 'GERENTE');
