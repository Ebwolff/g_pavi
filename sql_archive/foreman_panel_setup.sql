-- SCRIPT DE IMPLEMENTAÇÃO: PAINEL DE CHEFIA E STATUS DE O.S.
-- MARDISA AGRO

BEGIN;

-- 1. Adicionar novo status para Ordem de Serviço
-- Nota: O PostgreSQL não permite DROP/CREATE de enums facilmente se estiverem em uso.
-- Usamos ALTER TYPE para adicionar o novo valor.
ALTER TYPE public.status_os ADD VALUE IF NOT EXISTS 'AGUARDANDO_ATRIBUICAO' BEFORE 'EM_DIAGNOSTICO';

-- 2. Criar ENUM para disponibilidade do técnico
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

-- 3. Adicionar coluna de disponibilidade na tabela de técnicos
ALTER TABLE public.tecnicos 
ADD COLUMN IF NOT EXISTS status_disponibilidade public.status_disponibilidade_tecnico DEFAULT 'DISPONIVEL';

-- 4. Comentários para documentação
COMMENT ON COLUMN public.tecnicos.status_disponibilidade IS 'Status real de trabalho do técnico definido pelo Chefe de Oficina';

COMMIT;
