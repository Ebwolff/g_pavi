-- LIMPEZA DOS DADOS DE TESTE — OPERAÇÃO IRREVERSÍVEL
--
-- Substitui o antigo cleanup_database.sql, que referenciava a tabela
-- mensagens_os (inexistente no schema atual) e falhava na execução.
--
-- SÓ RODE DEPOIS DE:
--   1. Ter um ADMIN criado e com login confirmado;
--   2. Ter criado os usuários definitivos pela tela /usuarios.
--
-- O bloco de segurança abaixo aborta tudo se não houver ADMIN ativo, para
-- não deixar ninguém trancado fora do sistema.

BEGIN;

-- ============================================================
-- TRAVA DE SEGURANÇA
-- ============================================================
DO $$
DECLARE
    n_admin int;
BEGIN
    SELECT count(*) INTO n_admin
    FROM public.profiles WHERE role = 'ADMIN'::user_role AND is_active;

    IF n_admin < 1 THEN
        RAISE EXCEPTION
            'Nenhum ADMIN ativo encontrado. Abortando: rodar isto agora trancaria o acesso ao sistema.';
    END IF;

    RAISE NOTICE 'Trava liberada: % admin(s) ativo(s).', n_admin;
END $$;

-- ============================================================
-- DADOS TRANSACIONAIS
-- Um único TRUNCATE com todas as tabelas evita o CASCADE, que poderia
-- esvaziar tabelas fora desta lista sem aviso.
-- ============================================================
TRUNCATE TABLE
    public.alertas,
    public.anexos_os,
    public.auditoria_os,
    public.despesas_os,
    public.error_logs,
    public.historico_alocacao_veiculos,
    public.historico_status_os,
    public.importacoes_log,
    public.itens_os,
    public.movimentacoes_ferramentas,
    public.orcamentos_servico,
    public.ordens_servico,
    public.pendencias_os,
    public.solicitacoes_compra,
    public.vistorias_veiculos
RESTART IDENTITY;

-- ============================================================
-- CADASTROS BASE
-- Comente este bloco se quiser preservar clientes, máquinas ou frota.
-- ============================================================
TRUNCATE TABLE
    public.clientes,
    public.estoque_pecas,
    public.ferramentas,
    public.maquinas,
    public.metas,
    public.veiculos
RESTART IDENTITY;

-- ============================================================
-- USUÁRIOS DE TESTE
-- Apaga de auth.users; profiles e tecnicos saem junto por ON DELETE CASCADE.
-- Preserva todo ADMIN e qualquer usuário criado nos últimos 2 dias — margem
-- para os usuários definitivos que você acabou de cadastrar.
-- ============================================================
DELETE FROM auth.users u
WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = u.id AND p.role = 'ADMIN'::user_role
      )
  AND u.created_at < now() - interval '2 days';

-- Técnicos órfãos (sem usuário correspondente) não servem para nada:
-- OS são atribuídas via tecnicos.id, que precisa de um login por trás.
DELETE FROM public.tecnicos t
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = t.user_id);

-- ============================================================
-- CONFERÊNCIA
-- ============================================================
SELECT 'ordens_servico' AS tabela, count(*) FROM public.ordens_servico
UNION ALL SELECT 'itens_os',        count(*) FROM public.itens_os
UNION ALL SELECT 'alertas',         count(*) FROM public.alertas
UNION ALL SELECT 'auditoria_os',    count(*) FROM public.auditoria_os
UNION ALL SELECT 'clientes',        count(*) FROM public.clientes
UNION ALL SELECT 'tecnicos',        count(*) FROM public.tecnicos
UNION ALL SELECT 'profiles',        count(*) FROM public.profiles
ORDER BY 1;

-- Revise os números acima ANTES de confirmar.
-- Se algo estiver errado, rode ROLLBACK; em vez de COMMIT;
COMMIT;
