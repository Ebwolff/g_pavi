-- Script para adicionar o módulo de Orçamentos no Visão 360

-- 1. Criar ENUM para Status de Orçamento
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_orcamento') THEN
        CREATE TYPE status_orcamento AS ENUM (
            'EM_ELABORACAO',
            'ENVIADO_CLIENTE',
            'APROVADO',
            'REPROVADO',
            'CONVERTIDO_OS'
        );
    END IF;
END$$;

-- 2. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.orcamentos_servico (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_orcamento VARCHAR NOT NULL UNIQUE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    nome_cliente_digitavel VARCHAR,
    maquina_id UUID, -- Referencia maquinas se houver, ou texto
    modelo_maquina VARCHAR,
    chassi VARCHAR,
    descricao_problema TEXT,
    valor_mao_de_obra NUMERIC(10,2) DEFAULT 0,
    valor_pecas NUMERIC(10,2) DEFAULT 0,
    valor_deslocamento NUMERIC(10,2) DEFAULT 0,
    valor_liquido_total NUMERIC(10,2) DEFAULT 0,
    tipo_diagnostico VARCHAR,
    status_orcamento status_orcamento DEFAULT 'EM_ELABORACAO',
    consultor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    observacoes TEXT
);

-- Função para atualizar a data modificada
CREATE OR REPLACE FUNCTION log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at no orcamento
DROP TRIGGER IF EXISTS trg_orcamentos_updated_at ON public.orcamentos_servico;
CREATE TRIGGER trg_orcamentos_updated_at
BEFORE UPDATE ON public.orcamentos_servico
FOR EACH ROW
EXECUTE FUNCTION log_updated_at();

-- 3. Sequence e Função para Número do Orçamento
CREATE SEQUENCE IF NOT EXISTS seq_orcamentos START 1;

CREATE OR REPLACE FUNCTION generate_orcamento_number()
RETURNS TRIGGER AS $$
DECLARE
    ano TEXT;
    seq_val INT;
BEGIN
    ano := to_char(CURRENT_DATE, 'YY');
    seq_val := nextval('seq_orcamentos');
    NEW.numero_orcamento := 'ORC-' || ano || '-' || lpad(seq_val::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_orcamento_number ON public.orcamentos_servico;
CREATE TRIGGER trg_generate_orcamento_number
BEFORE INSERT ON public.orcamentos_servico
FOR EACH ROW
WHEN (NEW.numero_orcamento IS NULL OR NEW.numero_orcamento = '')
EXECUTE FUNCTION generate_orcamento_number();

-- 4. Adicionar orcamento_id nas ordens_servico (Rastreabilidade)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ordens_servico' AND column_name='orcamento_id') THEN
        ALTER TABLE public.ordens_servico ADD COLUMN orcamento_id UUID REFERENCES public.orcamentos_servico(id) ON DELETE SET NULL;
    END IF;
END$$;

-- 5. Adicionar status_aprovacao nas solicitacoes de compras e itens_os (Fluxo Técnico -> Consultor)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='itens_os' AND column_name='status_aprovacao') THEN
        ALTER TABLE public.itens_os ADD COLUMN status_aprovacao VARCHAR DEFAULT 'APROVADO'; -- Para os itens criados na web manter o padrão original.
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_compra' AND column_name='status_aprovacao') THEN
        ALTER TABLE public.solicitacoes_compra ADD COLUMN status_aprovacao VARCHAR DEFAULT 'APROVADO';
    END IF;
END$$;

-- 6. Políticas de RLS
ALTER TABLE public.orcamentos_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total orçamentos" ON public.orcamentos_servico
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. Criar Trigger para manter valor_liquido_total sincronizado na tabela orçamentos_servico
CREATE OR REPLACE FUNCTION calc_total_orcamento()
RETURNS TRIGGER AS $$
BEGIN
    NEW.valor_liquido_total := COALESCE(NEW.valor_mao_de_obra, 0) + COALESCE(NEW.valor_pecas, 0) + COALESCE(NEW.valor_deslocamento, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calc_total_orcamento ON public.orcamentos_servico;
CREATE TRIGGER trg_calc_total_orcamento
BEFORE INSERT OR UPDATE OF valor_mao_de_obra, valor_pecas, valor_deslocamento ON public.orcamentos_servico
FOR EACH ROW
EXECUTE FUNCTION calc_total_orcamento();
