-- Restaura o isolamento por perfil em ordens_servico e itens_os.
--
-- Problema 1: políticas com USING (true) tornavam todas as regras por perfil
-- decorativas — políticas permissivas se combinam com OR, então qualquer
-- usuário autenticado lia e alterava qualquer OS pela API REST.
--
-- Problema 2: as políticas de TECNICO comparavam ordens_servico.tecnico_id
-- com auth.uid(). Mas tecnico_id é FK para tecnicos(id), enquanto auth.uid()
-- corresponde a tecnicos.user_id — valores diferentes, então a condição nunca
-- era verdadeira. Eram políticas mortas.
--
-- ALMOXARIFADO, COMPRAS e FERAMENTAL precisam de SELECT em ordens_servico
-- mesmo não sendo donos de OS: os painéis deles fazem embed da tabela
-- (ex.: PainelAlmoxarifado.tsx:74) e descartam linhas cujo embed volta vazio,
-- o que deixaria a tela em branco sem gerar erro.

-- Resolve o id do técnico a partir do usuário autenticado.
-- SECURITY DEFINER para não esbarrar no RLS de tecnicos ao ser usado dentro
-- das políticas abaixo.
CREATE OR REPLACE FUNCTION public.get_tecnico_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
    SELECT id FROM public.tecnicos WHERE user_id = auth.uid() LIMIT 1;
$function$;

-- ============================================================
-- ordens_servico
-- ============================================================

-- Políticas abertas que anulavam todo o resto
DROP POLICY IF EXISTS "Authenticated users can view ordens_servico" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem ver OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Authenticated users can insert ordens_servico" ON public.ordens_servico;
DROP POLICY IF EXISTS "Authenticated users can update ordens_servico" ON public.ordens_servico;

-- Redundantes: já cobertas por gerente_full_access_os / consultores_*
DROP POLICY IF EXISTS "Gerentes e Consultores podem atualizar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Gerentes e Consultores podem criar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Apenas Gerentes podem deletar OS" ON public.ordens_servico;

-- FOR ALL dava DELETE aos consultores, contrariando a regra de que só gerente
-- apaga OS. Substituída abaixo por SELECT/INSERT/UPDATE explícitos.
DROP POLICY IF EXISTS "consultores_manage_os" ON public.ordens_servico;

DROP POLICY IF EXISTS "tecnico_select_own_os" ON public.ordens_servico;
DROP POLICY IF EXISTS "tecnico_update_own_os" ON public.ordens_servico;
DROP POLICY IF EXISTS "consultores_select_os" ON public.ordens_servico;
DROP POLICY IF EXISTS "consultores_insert_os" ON public.ordens_servico;
DROP POLICY IF EXISTS "consultores_update_os" ON public.ordens_servico;
DROP POLICY IF EXISTS "operacional_select_os" ON public.ordens_servico;

-- Consultores: criam, leem e editam OS — mas não apagam.
CREATE POLICY "consultores_select_os" ON public.ordens_servico
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']));

CREATE POLICY "consultores_insert_os" ON public.ordens_servico
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']));

CREATE POLICY "consultores_update_os" ON public.ordens_servico
  FOR UPDATE TO authenticated
  USING (get_user_role() = ANY (ARRAY['CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']))
  WITH CHECK (get_user_role() = ANY (ARRAY['CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']));

-- Técnico: apenas as OS atribuídas a ele.
CREATE POLICY "tecnico_select_own_os" ON public.ordens_servico
  FOR SELECT TO authenticated
  USING (get_user_role() = 'TECNICO' AND tecnico_id = get_tecnico_id());

CREATE POLICY "tecnico_update_own_os" ON public.ordens_servico
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'TECNICO' AND tecnico_id = get_tecnico_id())
  WITH CHECK (get_user_role() = 'TECNICO' AND tecnico_id = get_tecnico_id());

-- Perfis operacionais: leitura para viabilizar os embeds dos painéis.
CREATE POLICY "operacional_select_os" ON public.ordens_servico
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['ALMOXARIFADO', 'COMPRAS', 'FERAMENTAL']));

-- Mantidas como estavam: gerente_full_access_os (FOR ALL),
-- chefe_oficina_select_all_os, chefe_oficina_update_all_os.

-- ============================================================
-- itens_os
-- ============================================================

DROP POLICY IF EXISTS "Permitir select de itens_os para usuarios autenticados" ON public.itens_os;
DROP POLICY IF EXISTS "Permitir insert de itens_os para usuarios autenticados" ON public.itens_os;
DROP POLICY IF EXISTS "Permitir update de itens_os para usuarios autenticados" ON public.itens_os;
DROP POLICY IF EXISTS "Permitir delete de itens_os para usuarios autenticados" ON public.itens_os;
DROP POLICY IF EXISTS "Authenticated users can view itens_os" ON public.itens_os;
DROP POLICY IF EXISTS "Usuários autenticados podem ver itens" ON public.itens_os;

-- Redundante com managers_full_access_items
DROP POLICY IF EXISTS "Gerentes e Consultores podem gerenciar itens" ON public.itens_os;

DROP POLICY IF EXISTS "tecnico_select_own_os_items" ON public.itens_os;
DROP POLICY IF EXISTS "tecnico_insert_items_own_os" ON public.itens_os;
DROP POLICY IF EXISTS "tecnico_update_items_own_os" ON public.itens_os;
DROP POLICY IF EXISTS "operacional_select_itens" ON public.itens_os;
DROP POLICY IF EXISTS "operacional_update_itens" ON public.itens_os;

-- Técnico: itens das OS atribuídas a ele (lê, lança peça e atualiza).
CREATE POLICY "tecnico_select_own_os_items" ON public.itens_os
  FOR SELECT TO authenticated
  USING (get_user_role() = 'TECNICO' AND EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = itens_os.ordem_servico_id AND os.tecnico_id = get_tecnico_id()));

CREATE POLICY "tecnico_insert_items_own_os" ON public.itens_os
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'TECNICO' AND EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = itens_os.ordem_servico_id AND os.tecnico_id = get_tecnico_id()));

CREATE POLICY "tecnico_update_items_own_os" ON public.itens_os
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'TECNICO' AND EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = itens_os.ordem_servico_id AND os.tecnico_id = get_tecnico_id()))
  WITH CHECK (get_user_role() = 'TECNICO' AND EXISTS (
    SELECT 1 FROM public.ordens_servico os
    WHERE os.id = itens_os.ordem_servico_id AND os.tecnico_id = get_tecnico_id()));

-- Almoxarifado, compras e ferramental: separação e compra de peças.
CREATE POLICY "operacional_select_itens" ON public.itens_os
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['ALMOXARIFADO', 'COMPRAS', 'FERAMENTAL']));

CREATE POLICY "operacional_update_itens" ON public.itens_os
  FOR UPDATE TO authenticated
  USING (get_user_role() = ANY (ARRAY['ALMOXARIFADO', 'COMPRAS', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['ALMOXARIFADO', 'COMPRAS', 'FERAMENTAL']));

-- Mantida como estava: managers_full_access_items (FOR ALL) cobre
-- GERENTE, CHEFE_OFICINA e os dois perfis de CONSULTOR.
