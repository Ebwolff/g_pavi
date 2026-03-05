-- Script para adicionar o valor AGUARDANDO_ATRIBUICAO ao ENUM status_os
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
        WHERE pg_type.typname = 'status_os' 
        AND pg_enum.enumlabel = 'AGUARDANDO_ATRIBUICAO'
    ) THEN
        ALTER TYPE status_os ADD VALUE 'AGUARDANDO_ATRIBUICAO';
    END IF;
END $$;
