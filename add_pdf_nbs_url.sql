-- Adicionar campos para PDF NBS e itens do orçamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamentos_servico' AND column_name='pdf_nbs_url') THEN
        ALTER TABLE public.orcamentos_servico ADD COLUMN pdf_nbs_url TEXT;
        COMMENT ON COLUMN public.orcamentos_servico.pdf_nbs_url IS 'URL do PDF NBS original anexado ao orçamento';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orcamentos_servico' AND column_name='itens_orcamento') THEN
        ALTER TABLE public.orcamentos_servico ADD COLUMN itens_orcamento JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN public.orcamentos_servico.itens_orcamento IS 'Lista de peças/itens do orçamento [{codigo, descricao, qtde, valor_unitario, valor_total}]';
    END IF;
END$$;
