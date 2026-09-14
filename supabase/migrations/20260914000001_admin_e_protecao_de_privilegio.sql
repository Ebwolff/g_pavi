-- 1) Fecha o escalonamento de privilégio em profiles.
-- 2) Dá ao papel ADMIN acesso total a todas as tabelas.
--
-- RODE DEPOIS da migration 20260914000000 (que cria o valor 'ADMIN' no enum).
--
-- O problema: RLS no Postgres é por linha, não por coluna. As políticas
-- "own profile" permitem que cada usuário altere a própria linha inteira,
-- incluindo a coluna role. Sem trigger nem GRANT por coluna, qualquer usuário
-- autenticado conseguia se promover a GERENTE por uma chamada direta à API,
-- contornando o RoleGuard do frontend.

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'::user_role
    );
$function$;

-- ============================================================
-- Trigger: só ADMIN (ou acesso direto ao banco) mexe em role/is_active
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    -- auth.uid() nulo = conexão direta ao banco (SQL editor, psql, migrations).
    -- É por aqui que o primeiro ADMIN é promovido, antes de existir qualquer um.
    -- service_role = Edge Functions, que já validam permissão por conta própria.
    IF auth.uid() IS NULL
       OR auth.role() = 'service_role'
       OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        -- Impede que alguém crie o próprio perfil já com papel elevado.
        NEW.role := 'TECNICO'::user_role;
        RETURN NEW;
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Apenas administradores podem alterar o papel de um usuário';
    END IF;

    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
        RAISE EXCEPTION 'Apenas administradores podem ativar ou desativar um usuário';
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_profile_privileges_trigger ON public.profiles;
CREATE TRIGGER protect_profile_privileges_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- ============================================================
-- profiles: 4 políticas de UPDATE byte-a-byte idênticas conviviam aqui.
-- Mantém uma só, para que a fronteira de segurança seja auditável.
-- ============================================================
DROP POLICY IF EXISTS "Permitir update próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "users_update_own_profile_only" ON public.profiles;
-- Sobrevive: "Users can update own profile" (USING/CHECK auth.uid() = id),
-- agora com a trigger acima protegendo role e is_active.

-- Idem para SELECT: 3 políticas liberavam leitura de todos os perfis.
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfis autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- Sobrevive: "authenticated_users_read_all_profiles". A leitura ampla é
-- necessária: vários painéis exibem nome de consultor, técnico e responsável.

-- ============================================================
-- ADMIN: acesso total a tudo.
-- Políticas permissivas se combinam com OR, então uma política por tabela
-- concede acesso ao ADMIN sem precisar reescrever nenhuma política existente.
-- ============================================================
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'admin_full_access', t);
        EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
            'admin_full_access', t
        );
    END LOOP;
END $$;
