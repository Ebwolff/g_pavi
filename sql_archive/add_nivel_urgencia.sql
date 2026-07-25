-- SCRIPT DE CORREÇÃO: NÍVEL DE URGÊNCIA
-- Execute este script no SQL Editor do Supabase (app.supabase.com)
-- para resolver o erro "Could not find the 'nivel_urgencia' column"

BEGIN;

-- 1. Cria a coluna nivel_urgencia se ela não existir
-- Usando TEXT para compatibilidade simples, mas garantindo o valor default
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='nivel_urgencia') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN nivel_urgencia TEXT DEFAULT 'NORMAL';
        
        -- Opcional: Adicionar uma constraint para garantir apenas os valores permitidos
        ALTER TABLE public.ordens_servico ADD CONSTRAINT check_nivel_urgencia 
        CHECK (nivel_urgencia IN ('NORMAL', 'MEDIO', 'ALTO', 'CRITICO'));
    END IF;
END $$;

-- 2. Garantir que todas as OS existentes tenham o nível NORMAL (caso a coluna tenha sido criada sem default em algum momento)
UPDATE public.ordens_servico SET nivel_urgencia = 'NORMAL' WHERE nivel_urgencia IS NULL;

-- 3. Recarregar o cache do PostgREST (Supabase API)
-- Isso força o Supabase a "enxergar" a nova coluna imediatamente
NOTIFY pgrst, 'reload schema';

COMMIT;

-- VERIFICAÇÃO:
-- Select para confirmar se a coluna está lá agora
-- SELECT numero_os, nivel_urgencia FROM ordens_servico LIMIT 5;
