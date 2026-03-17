-- Adicionar campo para URL do PDF NBS no orçamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamentos_servico' AND column_name='pdf_nbs_url') THEN
        ALTER TABLE public.orcamentos_servico ADD COLUMN pdf_nbs_url TEXT;
        COMMENT ON COLUMN public.orcamentos_servico.pdf_nbs_url IS 'URL do PDF NBS original anexado ao orçamento';
    END IF;
END$$;
