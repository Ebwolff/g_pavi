-- SQL para implementar a visão de rentabilidade por O.S.

-- 1. ADICIONA O TIPO (EXECUTE ESTA LINHA SOZINHA PRIMEIRO SE O ERRO PERSISTIR)
ALTER TYPE public.tipo_despesa_os ADD VALUE IF NOT EXISTS 'MAO_DE_OBRA';

-- 2. Criar a View de Rentabilidade
-- Usamos 'tipo::text' para evitar o erro de transação do PostgreSQL com ENUMs novos.
CREATE OR REPLACE VIEW public.vw_os_profitability AS
WITH os_revenues AS (
    SELECT 
        id as os_id,
        COALESCE(valor_mao_de_obra, 0) as receita_mao_de_obra,
        COALESCE(valor_pecas, 0) as receita_pecas,
        COALESCE(valor_deslocamento, 0) as receita_deslocamento,
        COALESCE(valor_liquido_total, 0) as receita_total
    FROM ordens_servico
),
os_costs AS (
    SELECT 
        ordem_servico_id as os_id,
        SUM(CASE WHEN tipo::text = 'KM' THEN valor_total ELSE 0 END) as custo_deslocamento,
        SUM(CASE WHEN tipo::text = 'ABASTECIMENTO' THEN valor_total ELSE 0 END) as custo_combustivel,
        SUM(CASE WHEN tipo::text = 'ALIMENTACAO' THEN valor_total ELSE 0 END) as custo_alimentacao,
        SUM(CASE WHEN tipo::text = 'HOSPEDAGEM' THEN valor_total ELSE 0 END) as custo_hospedagem,
        SUM(CASE WHEN tipo::text = 'PEDAGIO' THEN valor_total ELSE 0 END) as custo_pedagio,
        SUM(CASE WHEN tipo::text = 'MAO_DE_OBRA' THEN valor_total ELSE 0 END) as custo_mao_de_obra,
        SUM(CASE WHEN tipo::text = 'OUTROS' THEN valor_total ELSE 0 END) as custo_outros,
        SUM(valor_total) as custo_total_despesas
    FROM despesas_os
    GROUP BY ordem_servico_id
),
os_parts_costs AS (
    -- Soma custos de peças vindos de solicitações de compra aprovadas/entregues
    SELECT 
        ordem_servico_id as os_id,
        SUM(COALESCE(valor_total, 0)) as custo_pecas
    FROM solicitacoes_compra
    WHERE status != 'CANCELADO'
    GROUP BY ordem_servico_id
)
SELECT 
    r.os_id,
    r.receita_mao_de_obra,
    r.receita_pecas,
    r.receita_deslocamento,
    r.receita_total,
    COALESCE(c.custo_deslocamento, 0) as custo_deslocamento,
    COALESCE(c.custo_combustivel, 0) as custo_combustivel,
    COALESCE(c.custo_alimentacao, 0) as custo_alimentacao,
    COALESCE(c.custo_hospedagem, 0) as custo_hospedagem,
    COALESCE(c.custo_pedagio, 0) as custo_pedagio,
    COALESCE(c.custo_mao_de_obra, 0) as custo_mao_de_obra,
    COALESCE(c.custo_outros, 0) as custo_outros,
    COALESCE(p.custo_pecas, 0) as custo_pecas,
    (COALESCE(c.custo_total_despesas, 0) + COALESCE(p.custo_pecas, 0)) as custo_total,
    r.receita_total - (COALESCE(c.custo_total_despesas, 0) + COALESCE(p.custo_pecas, 0)) as lucro_bruto,
    CASE 
        WHEN r.receita_total > 0 THEN 
            ((r.receita_total - (COALESCE(c.custo_total_despesas, 0) + COALESCE(p.custo_pecas, 0))) / r.receita_total) * 100
        ELSE 0 
    END as margem_percentual
FROM os_revenues r
LEFT JOIN os_costs c ON r.os_id = c.os_id
LEFT JOIN os_parts_costs p ON r.os_id = p.os_id;
