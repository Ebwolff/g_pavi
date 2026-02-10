import { supabase } from '@/lib/supabase';
import { StatusSolicitacaoCompra, UrgenciaCompra } from '@/types/database.types';

// Interface para solicitação de compra
export interface SolicitacaoCompra {
    id: string;
    ordem_servico_id: string | null;
    codigo_peca: string | null;
    descricao_peca: string;
    quantidade: number;
    unidade: string;
    urgencia: UrgenciaCompra;
    status: StatusSolicitacaoCompra;
    data_solicitacao: string;
    data_previsao_entrega: string | null;
    data_entrega_real: string | null;
    fornecedor: string | null;
    valor_unitario: number | null;
    valor_total: number | null;
    numero_pedido_fornecedor: string | null;
    solicitante_id: string | null;
    comprador_id: string | null;
    observacoes: string | null;
    motivo_cancelamento: string | null;
    created_at: string;
    updated_at: string;
    // Campos de relacionamento (quando JOIN)
    numero_os?: string;
    cliente?: string;
    modelo_maquina?: string;
    solicitante_nome?: string;
    dias_aguardando?: number;
}

export interface CreateSolicitacaoInput {
    ordem_servico_id?: string;
    codigo_peca?: string;
    descricao_peca: string;
    quantidade?: number;
    unidade?: string;
    urgencia?: UrgenciaCompra;
    observacoes?: string;
    solicitante_id?: string;
}

export interface UpdateSolicitacaoInput {
    status?: StatusSolicitacaoCompra;
    data_previsao_entrega?: string;
    fornecedor?: string;
    valor_unitario?: number;
    numero_pedido_fornecedor?: string;
    comprador_id?: string;
    observacoes?: string;
    motivo_cancelamento?: string;
}

class ComprasService {
    /**
     * Busca todas as solicitações de compra
     */
    async getSolicitacoes(filtros?: {
        status?: StatusSolicitacaoCompra;
        urgencia?: UrgenciaCompra;
        apenasMinhas?: boolean;
        compradorId?: string;
    }): Promise<SolicitacaoCompra[]> {
        let query = supabase
            .from('solicitacoes_compra')
            .select(`
                *,
                ordens_servico:ordem_servico_id (numero_os, nome_cliente_digitavel, modelo_maquina),
                solicitante:solicitante_id (first_name, last_name)
            `)
            .order('data_solicitacao', { ascending: false });

        if (filtros?.status) {
            query = query.eq('status', filtros.status);
        }

        if (filtros?.urgencia) {
            query = query.eq('urgencia', filtros.urgencia);
        }

        if (filtros?.compradorId) {
            query = query.eq('comprador_id', filtros.compradorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
            throw error;
        }

        // Mapear dados para formato mais amigável
        return (data || []).map((item: any) => ({
            ...item,
            numero_os: item.ordens_servico?.numero_os,
            cliente: item.ordens_servico?.nome_cliente_digitavel,
            modelo_maquina: item.ordens_servico?.modelo_maquina,
            solicitante_nome: item.solicitante
                ? `${item.solicitante.first_name || ''} ${item.solicitante.last_name || ''}`.trim()
                : null,
            dias_aguardando: Math.floor(
                (Date.now() - new Date(item.data_solicitacao).getTime()) / (1000 * 60 * 60 * 24)
            ),
        }));
    }

    /**
     * Busca apenas solicitações pendentes (para badge de notificação)
     */
    async getSolicitacoesPendentes(): Promise<SolicitacaoCompra[]> {
        return this.getSolicitacoes({ status: 'PENDENTE' });
    }

    /**
     * Conta solicitações pendentes
     */
    async countPendentes(): Promise<number> {
        const { count, error } = await supabase
            .from('solicitacoes_compra')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE');

        if (error) {
            console.error('Erro ao contar pendentes:', error);
            return 0;
        }

        return count || 0;
    }

    /**
     * Cria nova solicitação de compra
     */
    async criarSolicitacao(dados: CreateSolicitacaoInput): Promise<SolicitacaoCompra> {
        const { data, error } = await supabase
            .from('solicitacoes_compra')
            .insert({
                ordem_servico_id: dados.ordem_servico_id || null,
                codigo_peca: dados.codigo_peca || null,
                descricao_peca: dados.descricao_peca,
                quantidade: dados.quantidade || 1,
                unidade: dados.unidade || 'UN',
                urgencia: dados.urgencia || 'MEDIA',
                status: 'PENDENTE',
                solicitante_id: dados.solicitante_id || null,
                observacoes: dados.observacoes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar solicitação:', error);
            throw error;
        }

        return data;
    }

    /**
     * Atualiza solicitação de compra
     */
    async atualizarSolicitacao(id: string, dados: UpdateSolicitacaoInput): Promise<SolicitacaoCompra> {
        const updateData: any = { ...dados };

        // Se marcando como entregue, registra a data
        if (dados.status === 'ENTREGUE') {
            updateData.data_entrega_real = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('solicitacoes_compra')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar solicitação:', error);
            throw error;
        }

        return data;
    }

    /**
     * Atualiza status de uma solicitação
     */
    async atualizarStatus(id: string, novoStatus: StatusSolicitacaoCompra, observacao?: string): Promise<void> {
        await this.atualizarSolicitacao(id, {
            status: novoStatus,
            observacoes: observacao,
        });
    }

    /**
     * Define previsão de entrega
     */
    async definirPrevisaoEntrega(id: string, dataPrevisao: string): Promise<void> {
        await this.atualizarSolicitacao(id, {
            data_previsao_entrega: dataPrevisao,
            status: 'AGUARDANDO_ENTREGA',
        });
    }

    /**
     * Marca como comprado
     */
    async marcarComoComprado(id: string, fornecedor: string, valorUnitario: number, numeroPedido?: string): Promise<void> {
        await this.atualizarSolicitacao(id, {
            status: 'COMPRADO',
            fornecedor,
            valor_unitario: valorUnitario,
            numero_pedido_fornecedor: numeroPedido,
        });
    }

    /**
     * Marca como entregue e dá entrada no estoque
     */
    async marcarComoEntregue(id: string): Promise<void> {
        // Buscar dados da solicitação
        const { data: solicitacao, error: fetchError } = await supabase
            .from('solicitacoes_compra')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !solicitacao) {
            throw new Error('Solicitação não encontrada');
        }

        // Dar entrada no estoque usando a função SQL
        if (solicitacao.codigo_peca) {
            const { error: estoqueError } = await supabase.rpc('dar_entrada_estoque', {
                p_codigo_peca: solicitacao.codigo_peca,
                p_descricao: solicitacao.descricao_peca,
                p_quantidade: solicitacao.quantidade,
                p_valor_unitario: solicitacao.valor_unitario || 0
            });

            if (estoqueError) {
                console.error('Erro ao dar entrada no estoque:', estoqueError);
                throw estoqueError;
            }
        }

        // Atualizar status da solicitação
        await this.atualizarSolicitacao(id, {
            status: 'ENTREGUE',
        });

        // Se houver item_os vinculado, atualizar para COMPRADO
        if (solicitacao.item_os_id) {
            await supabase
                .from('itens_os')
                .update({ status_separacao: 'COMPRADO' })
                .eq('id', solicitacao.item_os_id);
        }
    }

    /**
     * Cancela solicitação
     */
    async cancelarSolicitacao(id: string, motivo: string): Promise<void> {
        await this.atualizarSolicitacao(id, {
            status: 'CANCELADO',
            motivo_cancelamento: motivo,
        });
    }

    /**
     * Busca estatísticas de compras
     */
    async getEstatisticas(): Promise<{
        pendentes: number;
        emCotacao: number;
        aguardandoEntrega: number;
        entreguesHoje: number;
        valorTotalPendente: number;
    }> {
        const { data, error } = await supabase
            .from('solicitacoes_compra')
            .select('status, valor_total, data_entrega_real');

        if (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                pendentes: 0,
                emCotacao: 0,
                aguardandoEntrega: 0,
                entreguesHoje: 0,
                valorTotalPendente: 0,
            };
        }

        const hoje = new Date().toISOString().split('T')[0];

        return {
            pendentes: data.filter(s => s.status === 'PENDENTE').length,
            emCotacao: data.filter(s => s.status === 'EM_COTACAO').length,
            aguardandoEntrega: data.filter(s => s.status === 'AGUARDANDO_ENTREGA' || s.status === 'COMPRADO').length,
            entreguesHoje: data.filter(s =>
                s.status === 'ENTREGUE' &&
                s.data_entrega_real?.startsWith(hoje)
            ).length,
            valorTotalPendente: data
                .filter(s => !['ENTREGUE', 'CANCELADO'].includes(s.status))
                .reduce((sum, s) => sum + (s.valor_total || 0), 0),
        };
    }
}

export const comprasService = new ComprasService();
