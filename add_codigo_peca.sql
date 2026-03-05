-- Script para adicionar a coluna codigo_peca na tabela itens_os
ALTER TABLE public.itens_os
ADD COLUMN IF NOT EXISTS codigo_peca VARCHAR(255);

-- Opcional: Adicionar comentário sobre a nova coluna
COMMENT ON COLUMN public.itens_os.codigo_peca IS 'Código de identificação ou part number da peça';
