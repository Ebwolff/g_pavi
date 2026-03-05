-- ===== FIX: Atualizar CHECK constraint de status_separacao em itens_os =====
-- O constraint antigo só permitia valores originais.
-- Novos valores: SOLICITADO_ESTOQUE, SOLICITADO_COMPRA, SEPARANDO, AGUARDANDO_RETIRADA, RETIRADO

-- 1. Remover constraint antigo
ALTER TABLE public.itens_os DROP CONSTRAINT IF EXISTS itens_os_status_separacao_check;

-- 2. Criar novo constraint com TODOS os valores
ALTER TABLE public.itens_os ADD CONSTRAINT itens_os_status_separacao_check 
CHECK (status_separacao IN (
    'PENDENTE',
    'SEPARADO',
    'AGUARDANDO_COMPRA',
    'COMPRADO',
    'SOLICITADO_ESTOQUE',
    'SOLICITADO_COMPRA',
    'SEPARANDO',
    'AGUARDANDO_RETIRADA',
    'RETIRADO'
));
