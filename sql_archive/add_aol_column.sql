-- Adiciona a coluna aol à tabela ordens_servico
ALTER TABLE public.ordens_servico
ADD COLUMN IF NOT EXISTS aol VARCHAR(255);

-- Opcional: Adiciona um comentário sobre a coluna
COMMENT ON COLUMN public.ordens_servico.aol IS 'Identificação AOL da ordem de serviço';
