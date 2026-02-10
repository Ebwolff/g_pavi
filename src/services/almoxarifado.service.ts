import { supabase } from '@/lib/supabase';

export interface PecaPendente {
    item_id: string;
    ordem_servico_id: string;
    numero_os: string;
    cliente: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    unidade: string;
    status_separacao: string;
    estoque_disponivel: number | null;
    disponibilidade: 'DISPONIVEL' | 'PARCIAL' | 'INDISPONIVEL';
    tecnico_responsavel: string;
    data_solicitacao: string;
}

export interface SolicitacaoCompraParams {
    ordem_servico_id: string;
    codigo_peca: string | null;
    descricao_peca: string;
    quantidade: number;
    unidade: string;
    item_id: string;
}

export const almoxarifadoService = {
    async getPecasPendentes(): Promise<PecaPendente[]> {
        const { data, error } = await supabase
            .from('vw_pecas_pendentes_separacao')
            .select('*');

        if (error) throw error;

        return (data || []).map((p: any) => ({
            item_id: p.item_id,
            ordem_servico_id: p.ordem_servico_id,
            numero_os: p.numero_os,
            cliente: p.cliente,
            codigo_peca: p.codigo_peca,
            descricao: p.descricao,
            quantidade: p.quantidade,
            unidade: p.unidade,
            status_separacao: p.status_separacao,
            estoque_disponivel: p.estoque_disponivel,
            disponibilidade: p.disponibilidade,
            tecnico_responsavel: p.tecnico_responsavel || 'N/A',
            data_solicitacao: p.data_solicitacao
        }));
    },

    async separarPeca(itemId: string, codigoPeca: string, quantidade: number): Promise<void> {
        // 1. Dar baixa no estoque via RPC
        const { error: baixaError } = await supabase.rpc('dar_baixa_estoque', {
            p_codigo_peca: codigoPeca,
            p_quantidade: quantidade
        });

        if (baixaError) throw baixaError;

        // 2. Atualizar status do item
        const { error: updateError } = await supabase
            .from('itens_os')
            .update({ status_separacao: 'SEPARADO' })
            .eq('id', itemId);

        if (updateError) throw updateError;
    },

    async solicitarCompra(params: SolicitacaoCompraParams): Promise<void> {
        // 1. Criar solicitação de compra
        const { data: solicitacao, error: solicitacaoError } = await supabase
            .from('solicitacoes_compra')
            .insert({
                ordem_servico_id: params.ordem_servico_id,
                codigo_peca: params.codigo_peca,
                descricao_peca: params.descricao_peca,
                quantidade: params.quantidade,
                unidade: params.unidade,
                urgencia: 'ALTA',
                status: 'PENDENTE'
            })
            .select()
            .single();

        if (solicitacaoError) throw solicitacaoError;

        // 2. Atualizar item da OS para aguardando compra
        const { error: updateError } = await supabase
            .from('itens_os')
            .update({
                status_separacao: 'AGUARDANDO_COMPRA',
                solicitacao_compra_id: solicitacao.id
            })
            .eq('id', params.item_id);

        if (updateError) throw updateError;
    }
};
