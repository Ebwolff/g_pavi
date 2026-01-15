import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type OrdemServico = Database['public']['Tables']['ordens_servico']['Row'];
type OrdemServicoInsert = Database['public']['Tables']['ordens_servico']['Insert'];
type OrdemServicoUpdate = Database['public']['Tables']['ordens_servico']['Update'];

export interface OSFilters {
    tipo?: 'NORMAL' | 'GARANTIA';
    status?: string;
    search?: string;
    dataInicio?: string;
    dataFim?: string;
    tecnicoId?: string;
    consultorId?: string;
}

export interface OSListResponse {
    data: any[];
    count: number;
}

class OrdemServicoService {
    /**
     * Lista ordens de serviço com filtros e paginação
     */
    async list(
        filters: OSFilters = {},
        page = 1,
        limit = 25
    ): Promise<OSListResponse> {
        let query = supabase
            .from('ordens_servico')
            .select(`
        *,
        tecnico:tecnicos(*),
        cliente:clientes(*),
        maquina:maquinas(*),
        consultor:profiles(*),
        itens:itens_os(*)
      `, { count: 'exact' });

        // Aplicar filtros
        if (filters.tipo) {
            query = query.eq('tipo_os', filters.tipo);
        }

        if (filters.status) {
            query = query.eq('status_atual', filters.status);
        }

        if (filters.tecnicoId) {
            query = query.eq('tecnico_id', filters.tecnicoId);
        }

        if (filters.consultorId) {
            query = query.eq('consultor_id', filters.consultorId);
        }

        if (filters.dataInicio) {
            query = query.gte('data_abertura', filters.dataInicio);
        }

        if (filters.dataFim) {
            query = query.lte('data_abertura', filters.dataFim);
        }

        // Busca textual
        if (filters.search) {
            query = query.or(
                `numero_os.ilike.%${filters.search}%,` +
                `nome_cliente_digitavel.ilike.%${filters.search}%,` +
                `chassi.ilike.%${filters.search}%`
            );
        }

        // Paginação
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query
            .order('data_abertura', { ascending: false })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            data: data || [],
            count: count || 0,
        };
    }

    /**
     * Busca uma OS por ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select(`
        *,
        tecnico:tecnicos(*),
        cliente:clientes(*),
        maquina:maquinas(*),
        consultor:profiles(*),
        itens:itens_os(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Cria nova OS
     */
    async create(os: Partial<OrdemServicoInsert>) {
        const { data: user } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('ordens_servico')
            .insert({
                ...os,
                consultor_id: user.user?.id,
            } as any)
            .select(`
        *,
        tecnico:tecnicos(*),
        cliente:clientes(*),
        maquina:maquinas(*),
        consultor:profiles(*)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Atualiza OS
     */
    async update(id: string, updates: Partial<OrdemServicoUpdate>) {
        // Auto-faturamento
        if (updates.status_atual === 'FATURADA' && !updates.data_faturamento) {
            updates.data_faturamento = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(updates as any)
            .eq('id', id)
            .select(`
        *,
        tecnico:tecnicos(*),
        cliente:clientes(*),
        maquina:maquinas(*),
        consultor:profiles(*)
      `)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Deleta OS (apenas Gerentes)
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('ordens_servico')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Subscreve a mudanças em tempo real
     */
    subscribeToChanges(callback: (payload: any) => void) {
        return supabase
            .channel('ordens_servico_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ordens_servico',
                },
                callback
            )
            .subscribe();
    }

    /**
     * Adiciona item à OS
     */
    async addItem(ordemServicoId: string, item: {
        descricao: string;
        quantidade: number;
        valorUnitario: number;
    }) {
        const { data, error } = await supabase
            .from('itens_os')
            .insert({
                ordem_servico_id: ordemServicoId,
                descricao: item.descricao,
                quantidade: item.quantidade,
                valor_unitario: item.valorUnitario,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Remove item da OS
     */
    async removeItem(itemId: string) {
        const { error } = await supabase
            .from('itens_os')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    }

    /**
     * Gera próximo número de OS
     */
    async getNextOSNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('numero_os')
            .ilike('numero_os', `${year}%`)
            .order('numero_os', { ascending: false })
            .limit(1);

        if (error) throw error;

        if (!data || data.length === 0) {
            return `${year}-0001`;
        }

        const lastNumber = data[0].numero_os;
        const match = lastNumber.match(/(\d+)$/);

        if (!match) {
            return `${year}-0001`;
        }

        const nextNum = parseInt(match[1]) + 1;
        return `${year}-${String(nextNum).padStart(4, '0')}`;
    }

    /**
     * Atualiza status da OS com campos específicos de motivo
     */
    async updateStatus(id: string, statusData: {
        novoStatus: string;
        numero_orcamento?: string;
        data_envio_orcamento?: string;
        numero_pedido?: string;
        previsao_chegada_pecas?: string;
        data_conclusao_servico?: string;
        valor_servico?: number;
        tipo_diagnostico?: string;
        previsao_retorno?: string;
        localizacao_atual?: string;
        roteiro?: string;
        motivo_pausa?: string;
    }) {
        const updates: any = {
            status_atual: statusData.novoStatus,
        };

        if (statusData.numero_orcamento) updates.numero_orcamento = statusData.numero_orcamento;
        if (statusData.data_envio_orcamento) updates.data_envio_orcamento = statusData.data_envio_orcamento;
        if (statusData.numero_pedido) updates.numero_pedido = statusData.numero_pedido;
        if (statusData.previsao_chegada_pecas) updates.previsao_chegada_pecas = statusData.previsao_chegada_pecas;
        if (statusData.data_conclusao_servico) updates.data_conclusao_servico = statusData.data_conclusao_servico;
        if (statusData.valor_servico) updates.valor_servico = statusData.valor_servico;
        if (statusData.tipo_diagnostico) updates.tipo_diagnostico = statusData.tipo_diagnostico;
        if (statusData.previsao_retorno) updates.previsao_retorno = statusData.previsao_retorno;
        if (statusData.localizacao_atual) updates.localizacao_atual = statusData.localizacao_atual;
        if (statusData.roteiro) updates.roteiro = statusData.roteiro;
        if (statusData.motivo_pausa) updates.motivo_pausa = statusData.motivo_pausa;

        if (statusData.novoStatus === 'FATURADA') {
            updates.data_faturamento = new Date().toISOString();
        }
        if (statusData.novoStatus === 'CONCLUIDA') {
            updates.data_fechamento = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('ordens_servico')
            .update(updates)
            .eq('id', id)
            .select(`*, tecnico:tecnicos(*), cliente:clientes(*), maquina:maquinas(*), consultor:profiles(*)`)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Lista OS com motivos de abertura (usando view)
     */
    async listWithMotivos(filters: OSFilters = {}) {
        let query = supabase.from('vw_os_motivos_abertura').select('*');
        if (filters.status) query = query.eq('status_atual', filters.status);
        if (filters.search) {
            query = query.or(`numero_os.ilike.%${filters.search}%,nome_cliente_digitavel.ilike.%${filters.search}%`);
        }
        query = query.order('dias_aberta', { ascending: false });
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    /**
     * Busca histórico de status de uma OS
     */
    async getHistoricoStatus(osId: string) {
        const { data, error } = await supabase
            .from('historico_status_os')
            .select('*')
            .eq('ordem_servico_id', osId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
}

export const ordemServicoService = new OrdemServicoService();

