-- Migration: Add new TipoAlerta values for workflow push notifications
-- These types are used by the notification system to categorize handoff alerts

-- If the column uses a CHECK constraint or ENUM type, update it:
-- Option 1: If tipo_alerta is a TEXT column (no constraint), no migration needed
-- Option 2: If it's a CHECK constraint, alter it:

-- Check if there's an existing constraint and drop it
DO $$
BEGIN
    -- Try to drop existing check constraint if present
    ALTER TABLE alertas DROP CONSTRAINT IF EXISTS alertas_tipo_alerta_check;
    
    -- Add updated constraint with new values
    ALTER TABLE alertas ADD CONSTRAINT alertas_tipo_alerta_check
        CHECK (tipo_alerta IN (
            'OS_VENCIDA', 'GARANTIA_PENDENTE', 'PECAS_CHEGANDO', 
            'PREVISAO_ENTREGA', 'META_FATURAMENTO', 'OUTROS',
            'NOVA_OS', 'OS_ATRIBUIDA', 'PECAS_SOLICITADAS', 
            'COMPRA_NECESSARIA', 'STATUS_ALTERADO'
        ));
EXCEPTION WHEN OTHERS THEN
    -- If CHECK constraint doesn't exist or column is TEXT, just continue
    RAISE NOTICE 'No constraint to update, column likely TEXT type';
END $$;
