-- Fecha as políticas abertas nas tabelas restantes.
--
-- Auditoria encontrou o mesmo padrão de ordens_servico espalhado pelo schema:
-- políticas com nome sugerindo restrição e predicado `true` por baixo. O caso
-- mais enganoso é "Gerentes e Compras podem editar solicitações", que liberava
-- edição para qualquer autenticado. Na prática, um técnico podia apagar
-- veículos, ferramentas e orçamentos pela API REST.
--
-- ADMIN não aparece em nenhuma política abaixo: a admin_full_access, criada na
-- migration anterior, já lhe dá acesso irrestrito a todas as tabelas.
--
-- Os papéis de cada tabela seguem as telas que realmente as consomem:
--   orcamentos_servico ....... /orcamentos
--   despesas_os, anexos_os ... EditarOS e PainelTecnico
--   frota e ferramentas ...... PainelFeramental (+ leitura do técnico)
--   solicitacoes_compra ...... PainelCompras, PainelAlmoxarifado, PainelConsultor

-- ============================================================
-- Trigger de histórico: passa a rodar como SECURITY DEFINER.
-- Ela escreve em historico_status_os quando uma OS muda de status. Rodando com
-- as permissões de quem chama, exigiria dar INSERT nessa tabela a todo mundo
-- que altera OS. Como é registro de sistema, e não ação do usuário, segue o
-- mesmo modelo de audit_ordens_servico, que já era SECURITY DEFINER.
-- ============================================================
-- Corpo idêntico ao original: muda apenas SECURITY DEFINER e search_path.
CREATE OR REPLACE FUNCTION public.registrar_mudanca_status_os()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    -- Só registra se o status realmente mudou
    IF OLD.status_atual IS DISTINCT FROM NEW.status_atual THEN
        INSERT INTO public.historico_status_os (
            ordem_servico_id,
            status_anterior,
            status_novo,
            numero_orcamento,
            numero_pedido,
            tipo_diagnostico,
            localizacao_atual,
            motivo_pausa
        ) VALUES (
            NEW.id,
            OLD.status_atual::TEXT,
            NEW.status_atual::TEXT,
            NEW.numero_orcamento,
            NEW.numero_pedido,
            NEW.tipo_diagnostico,
            NEW.localizacao_atual,
            NEW.motivo_pausa
        );
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================
-- orcamentos_servico
-- ============================================================
DROP POLICY IF EXISTS "Acesso total orçamentos" ON public.orcamentos_servico;
DROP POLICY IF EXISTS "orcamentos_gestao_comercial" ON public.orcamentos_servico;

CREATE POLICY "orcamentos_gestao_comercial" ON public.orcamentos_servico
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA']));

-- ============================================================
-- despesas_os — lançadas em EditarOS e no PainelTecnico
-- ============================================================
DROP POLICY IF EXISTS "Usuários autenticados podem ver despesas" ON public.despesas_os;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir despesas" ON public.despesas_os;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar despesas" ON public.despesas_os;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar despesas" ON public.despesas_os;
DROP POLICY IF EXISTS "despesas_equipe_os" ON public.despesas_os;

CREATE POLICY "despesas_equipe_os" ON public.despesas_os
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO']));

-- ============================================================
-- anexos_os — fotos e PDFs anexados à OS
-- ============================================================
DROP POLICY IF EXISTS "anexos_os_select_policy" ON public.anexos_os;
DROP POLICY IF EXISTS "anexos_os_insert_policy" ON public.anexos_os;
DROP POLICY IF EXISTS "anexos_os_delete_policy" ON public.anexos_os;
DROP POLICY IF EXISTS "anexos_equipe_os" ON public.anexos_os;

CREATE POLICY "anexos_equipe_os" ON public.anexos_os
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO']));

-- ============================================================
-- historico_status_os
-- Leitura ampla é intencional: os painéis exibem a linha do tempo da OS, e
-- status de OS não é informação sensível. A escrita pela API fica restrita a
-- quem altera OS — a trigger acima não depende mais disso.
-- ============================================================
DROP POLICY IF EXISTS "historico_status_os_select" ON public.historico_status_os;
DROP POLICY IF EXISTS "historico_status_os_insert" ON public.historico_status_os;
DROP POLICY IF EXISTS "historico_status_leitura" ON public.historico_status_os;
DROP POLICY IF EXISTS "historico_status_escrita_equipe" ON public.historico_status_os;

CREATE POLICY "historico_status_leitura" ON public.historico_status_os
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "historico_status_escrita_equipe" ON public.historico_status_os
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO']));

-- ============================================================
-- Frota: veiculos, vistorias_veiculos, historico_alocacao_veiculos
-- Gestão pelo Ferramental; o técnico só lê, para ver o veículo alocado a ele.
-- ============================================================
DROP POLICY IF EXISTS "Usuários autenticados podem ver veículos" ON public.veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir veículos" ON public.veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON public.veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar veículos" ON public.veiculos;
DROP POLICY IF EXISTS "veiculos_gestao_frota" ON public.veiculos;
DROP POLICY IF EXISTS "veiculos_leitura_tecnico" ON public.veiculos;

CREATE POLICY "veiculos_gestao_frota" ON public.veiculos
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']));

CREATE POLICY "veiculos_leitura_tecnico" ON public.veiculos
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['TECNICO', 'CHEFE_OFICINA']));

DROP POLICY IF EXISTS "vistorias_select_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_insert_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_update_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_delete_all" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_gestao_frota" ON public.vistorias_veiculos;
DROP POLICY IF EXISTS "vistorias_tecnico" ON public.vistorias_veiculos;

CREATE POLICY "vistorias_gestao_frota" ON public.vistorias_veiculos
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']));

-- Técnico registra a vistoria do próprio veículo.
CREATE POLICY "vistorias_tecnico" ON public.vistorias_veiculos
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'TECNICO');

DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON public.historico_alocacao_veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir histórico" ON public.historico_alocacao_veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar histórico" ON public.historico_alocacao_veiculos;
DROP POLICY IF EXISTS "alocacao_gestao_frota" ON public.historico_alocacao_veiculos;
DROP POLICY IF EXISTS "alocacao_leitura" ON public.historico_alocacao_veiculos;

CREATE POLICY "alocacao_gestao_frota" ON public.historico_alocacao_veiculos
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']));

CREATE POLICY "alocacao_leitura" ON public.historico_alocacao_veiculos
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['TECNICO', 'CHEFE_OFICINA']));

-- ============================================================
-- Ferramentas: gestão exclusiva do Ferramental
-- ============================================================
DROP POLICY IF EXISTS "ferramentas_select_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_insert_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_update_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_delete_all" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_gestao" ON public.ferramentas;
DROP POLICY IF EXISTS "ferramentas_leitura_tecnico" ON public.ferramentas;

CREATE POLICY "ferramentas_gestao" ON public.ferramentas
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']));

CREATE POLICY "ferramentas_leitura_tecnico" ON public.ferramentas
  FOR SELECT TO authenticated
  USING (get_user_role() = ANY (ARRAY['TECNICO', 'CHEFE_OFICINA']));

DROP POLICY IF EXISTS "mov_ferramentas_select_all" ON public.movimentacoes_ferramentas;
DROP POLICY IF EXISTS "mov_ferramentas_insert_all" ON public.movimentacoes_ferramentas;
DROP POLICY IF EXISTS "mov_ferramentas_gestao" ON public.movimentacoes_ferramentas;

CREATE POLICY "mov_ferramentas_gestao" ON public.movimentacoes_ferramentas
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'FERAMENTAL']));

-- ============================================================
-- solicitacoes_compra
-- Sete políticas abertas, incluindo duas cujo nome prometia restrição.
-- Consultores abrem o pedido, almoxarifado e compras tocam o fluxo.
-- ============================================================
DROP POLICY IF EXISTS "Permitir select solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir insert solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir update solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Permitir delete solicitacoes_compra para autenticados" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Usuários autenticados podem ver solicitações" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Gerentes e Compras podem criar solicitações" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "Gerentes e Compras podem editar solicitações" ON public.solicitacoes_compra;
DROP POLICY IF EXISTS "solicitacoes_fluxo_compras" ON public.solicitacoes_compra;

CREATE POLICY "solicitacoes_fluxo_compras" ON public.solicitacoes_compra
  FOR ALL TO authenticated
  USING (get_user_role() = ANY (ARRAY['GERENTE', 'COMPRAS', 'ALMOXARIFADO', 'FERAMENTAL', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA']))
  WITH CHECK (get_user_role() = ANY (ARRAY['GERENTE', 'COMPRAS', 'ALMOXARIFADO', 'FERAMENTAL', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA']));

-- ============================================================
-- Leituras amplas que permanecem — por necessidade, não por descuido.
-- Consolida duplicatas para que a intenção fique explícita.
--
-- tecnicos, clientes e maquinas aparecem em praticamente toda tela: nome do
-- técnico responsável, cliente da OS, modelo da máquina. Restringir a leitura
-- esvaziaria painéis. A escrita continua restrita às políticas já existentes.
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view tecnicos" ON public.tecnicos;
DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.tecnicos;
DROP POLICY IF EXISTS "Usuários autenticados podem ver técnicos" ON public.tecnicos;
DROP POLICY IF EXISTS "authenticated_select_tecnicos" ON public.tecnicos;

CREATE POLICY "authenticated_select_tecnicos" ON public.tecnicos
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem ver clientes" ON public.clientes;
DROP POLICY IF EXISTS "authenticated_select_clientes" ON public.clientes;

CREATE POLICY "authenticated_select_clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view maquinas" ON public.maquinas;
DROP POLICY IF EXISTS "Usuários autenticados podem ver máquinas" ON public.maquinas;
DROP POLICY IF EXISTS "authenticated_select_maquinas" ON public.maquinas;

CREATE POLICY "authenticated_select_maquinas" ON public.maquinas
  FOR SELECT TO authenticated
  USING (true);
