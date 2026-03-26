-- ==============================================
-- SETUP: Tabelas para Ferramental (Vistorias)
-- Execute no Supabase SQL Editor
-- ==============================================

-- Tabela de Vistorias de Veículos
CREATE TABLE IF NOT EXISTS public.vistorias_veiculos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    veiculo_id UUID REFERENCES public.veiculos(id) ON DELETE CASCADE,
    tecnico_id UUID REFERENCES public.tecnicos(id) ON DELETE SET NULL,
    data_vistoria TIMESTAMPTZ DEFAULT NOW(),
    km_vistoria INTEGER,
    itens JSONB DEFAULT '{}',
    observacoes TEXT,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADA', 'REPROVADA')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vistorias_veiculo ON public.vistorias_veiculos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_tecnico ON public.vistorias_veiculos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_vistorias_data ON public.vistorias_veiculos(data_vistoria DESC);

-- RLS
ALTER TABLE public.vistorias_veiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vistorias_select_all" ON public.vistorias_veiculos
    FOR SELECT USING (true);

CREATE POLICY "vistorias_insert_all" ON public.vistorias_veiculos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "vistorias_update_all" ON public.vistorias_veiculos
    FOR UPDATE USING (true);

CREATE POLICY "vistorias_delete_all" ON public.vistorias_veiculos
    FOR DELETE USING (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_vistorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vistorias_updated_at ON public.vistorias_veiculos;
CREATE TRIGGER trigger_vistorias_updated_at
    BEFORE UPDATE ON public.vistorias_veiculos
    FOR EACH ROW EXECUTE FUNCTION update_vistorias_updated_at();

-- Verificação
SELECT 'vistorias_veiculos criada com sucesso' AS resultado;
