-- Adicionar coluna pdf_nbs_url na tabela ordens_servico
-- Para armazenar a URL do PDF NBS anexado na criação da OS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='pdf_nbs_url') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN pdf_nbs_url TEXT;
        COMMENT ON COLUMN public.ordens_servico.pdf_nbs_url IS 'URL do PDF NBS original anexado à OS';
    END IF;
END$$;
