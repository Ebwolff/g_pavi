-- SCRIPT DE SINCRONIZAÇÃO E CORREÇÃO DE VISIBILIDADE
-- MARDISA AGRO

BEGIN;

-- 1. Garantir que a estrutura da tabela 'tecnicos' está completa
-- Criar ENUM para disponibilidade do técnico se não existir
DO $$ BEGIN
    CREATE TYPE public.status_disponibilidade_tecnico AS ENUM (
        'DISPONIVEL', 
        'EM_TREINAMENTO', 
        'AUSENTE', 
        'FERIAS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas faltantes na tabela de técnicos
ALTER TABLE public.tecnicos 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS status_disponibilidade public.status_disponibilidade_tecnico DEFAULT 'DISPONIVEL';

-- 2. Sincronizar perfis de técnicos existentes com a tabela 'tecnicos'
-- Isso garante que técnicos já cadastrados apareçam na aba de 'Gestão'
INSERT INTO public.tecnicos (user_id, nome_completo, is_active, status_disponibilidade)
SELECT 
    id as user_id, 
    COALESCE(first_name || ' ' || last_name, username) as nome_completo,
    COALESCE(is_active, TRUE) as is_active,
    'DISPONIVEL'::public.status_disponibilidade_tecnico
FROM public.profiles
WHERE role = 'TECNICO'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Garantir que as políticas de RLS permitam a leitura para todos os usuários autenticados
-- Se a tabela não tiver RLS habilitado, habilitar agora
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura para usuários autenticados" ON public.tecnicos;
CREATE POLICY "Permitir leitura para usuários autenticados" 
ON public.tecnicos FOR SELECT 
TO authenticated 
USING (true);

-- 3. Caso o seu usuário (Roberto Santos) precise de permissões de escrita/update
DROP POLICY IF EXISTS "Permitir update para Gerentes e Chefe de Oficina" ON public.tecnicos;
CREATE POLICY "Permitir update para Gerentes e Chefe de Oficina" 
ON public.tecnicos FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('GERENTE', 'CONSULTOR_POS_VENDA')
    )
);

COMMIT;
