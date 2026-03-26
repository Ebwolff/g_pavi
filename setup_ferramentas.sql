-- ==============================================
-- SETUP: Tabelas para Gestão de Ferramentas
-- Execute no Supabase SQL Editor
-- ==============================================

-- Tabela de Ferramentas (estoque/inventário)
CREATE TABLE IF NOT EXISTS public.ferramentas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    codigo_patrimonio VARCHAR(50),
    numero_serie VARCHAR(100),
    categoria VARCHAR(50) DEFAULT 'GERAL' CHECK (categoria IN ('ELETRICA', 'MECANICA', 'HIDRAULICA', 'MEDICAO', 'GERAL')),
    estado VARCHAR(30) DEFAULT 'BOM' CHECK (estado IN ('NOVO', 'BOM', 'DESGASTADO', 'AVARIADO')),
    quantidade INTEGER DEFAULT 1,
    tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
    data_retirada TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Movimentações (histórico de retirada/devolução)
CREATE TABLE IF NOT EXISTS public.movimentacoes_ferramentas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ferramenta_id UUID NOT NULL REFERENCES public.ferramentas(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RETIRADA', 'DEVOLUCAO')),
    data_movimentacao TIMESTAMPTZ DEFAULT NOW(),
    observacoes TEXT,
    registrado_por UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ferramentas_tecnico ON public.ferramentas(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_ferramentas_categoria ON public.ferramentas(categoria);
CREATE INDEX IF NOT EXISTS idx_mov_ferramentas_ferramenta ON public.movimentacoes_ferramentas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_mov_ferramentas_tecnico ON public.movimentacoes_ferramentas(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_mov_ferramentas_data ON public.movimentacoes_ferramentas(data_movimentacao DESC);

-- RLS
ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes_ferramentas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ferramentas_select_all" ON public.ferramentas FOR SELECT USING (true);
CREATE POLICY "ferramentas_insert_all" ON public.ferramentas FOR INSERT WITH CHECK (true);
CREATE POLICY "ferramentas_update_all" ON public.ferramentas FOR UPDATE USING (true);
CREATE POLICY "ferramentas_delete_all" ON public.ferramentas FOR DELETE USING (true);

CREATE POLICY "mov_ferramentas_select_all" ON public.movimentacoes_ferramentas FOR SELECT USING (true);
CREATE POLICY "mov_ferramentas_insert_all" ON public.movimentacoes_ferramentas FOR INSERT WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_ferramentas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ferramentas_updated_at ON public.ferramentas;
CREATE TRIGGER trigger_ferramentas_updated_at
    BEFORE UPDATE ON public.ferramentas
    FOR EACH ROW EXECUTE FUNCTION update_ferramentas_updated_at();

SELECT 'Tabelas ferramentas e movimentacoes_ferramentas criadas com sucesso' AS resultado;
