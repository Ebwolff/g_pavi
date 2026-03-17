import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type OrcamentoServico = Database['public']['Tables']['orcamentos_servico']['Row'] & {
    cliente?: Database['public']['Tables']['clientes']['Row'] | null;
    consultor?: Database['public']['Tables']['profiles']['Row'] | null;
};

export interface OrcamentoFilters {
    status?: string;
    search?: string;
    dataInicio?: string;
    dataFim?: string;
    consultorId?: string;
}

export interface OrcamentoListResponse {
    data: OrcamentoServico[];
    count: number;
}

class OrcamentoService {
    /**
     * Lista orçamentos com filtros e paginação
     */
    async list(
        filters: OrcamentoFilters = {},
        page = 1,
        limit = 25
    ): Promise<OrcamentoListResponse> {
        let query = supabase
            .from('orcamentos_servico')
            .select(`
                *,
                cliente:clientes(*),
                consultor:profiles(id, first_name, last_name, role)
            `, { count: 'exact' });

        if (filters.status) {
            query = query.eq('status_orcamento', filters.status);
        }

        if (filters.consultorId) {
            query = query.eq('consultor_id', filters.consultorId);
        }

        if (filters.dataInicio) {
            query = query.gte('data_criacao', filters.dataInicio);
        }

        if (filters.dataFim) {
            query = query.lte('data_criacao', filters.dataFim);
        }

        if (filters.search) {
            query = query.or(`numero_orcamento.ilike.%${filters.search}%,nome_cliente_digitavel.ilike.%${filters.search}%,chassi.ilike.%${filters.search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, count, error } = await query
            .order('data_criacao', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Erro ao buscar orçamentos:', error);
            throw error;
        }

        return {
            data: data as OrcamentoServico[],
            count: count || 0
        };
    }

    /**
     * Busca um orçamento pelo ID
     */
    async getById(id: string): Promise<OrcamentoServico> {
        const { data, error } = await supabase
            .from('orcamentos_servico')
            .select(`
                *,
                cliente:clientes(*),
                consultor:profiles(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar orçamento por ID:', error);
            throw error;
        }

        return data as OrcamentoServico;
    }

    /**
     * Cria um novo orçamento
     */
    async create(orcamentoData: any): Promise<OrcamentoServico> {
        const { data, error } = await supabase
            .from('orcamentos_servico')
            .insert(orcamentoData as Database['public']['Tables']['orcamentos_servico']['Insert'])
            .select()
            .single();

        if (error) {
            console.error('Erro ao criar orçamento:', error);
            throw error;
        }

        return data as unknown as OrcamentoServico;
    }

    /**
     * Atualiza um orçamento
     */
    async update(id: string, orcamentoData: any): Promise<OrcamentoServico> {
        const updateData = {
            ...orcamentoData,
            updated_at: new Date().toISOString()
        } as Database['public']['Tables']['orcamentos_servico']['Update'];

        const { data, error } = await supabase
            .from('orcamentos_servico')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar orçamento:', error);
            throw error;
        }

        return data as unknown as OrcamentoServico;
    }

    /**
     * Atualiza o Status do Orçamento
     */
    async updateStatus(id: string, status: string): Promise<OrcamentoServico> {
        const updateData: Database['public']['Tables']['orcamentos_servico']['Update'] = { status_orcamento: status as any };
        
        if (status === 'APROVADO') {
            updateData.data_aprovacao = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('orcamentos_servico')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erro ao atualizar status do orçamento:', error);
            throw error;
        }

        return data as unknown as OrcamentoServico;
    }

    /**
     * Converte o Orçamento em uma OS
     * 1. Pega os dados do Orçamento
     * 2. Insere na tabela ordens_servico (vinculando orcamento_id)
     * 3. Atualiza o status do orçamento para "CONVERTIDO_OS"
     */
    async converterParaOS(orcamentoId: string, osDataPreenchida: any): Promise<any> {
        const orcamento = await this.getById(orcamentoId);
        if (!orcamento) throw new Error("Orçamento não encontrado");
        
        if (orcamento.status_orcamento !== 'APROVADO') {
            throw new Error("Apenas orçamentos APROVADOS podem ser convertidos em OS.");
        }

        // 1. Inserir a OS com os dados herdados do Orçamento + Adicionais
        const osPayload: Database['public']['Tables']['ordens_servico']['Insert'] = {
            ...osDataPreenchida,
            tipo_os: 'NORMAL', // Sempre Normal, pois fluxo Garantia não passa por aqui
            status_atual: 'AGUARDANDO_ATRIBUICAO',
            data_abertura: new Date().toISOString(),
            cliente_id: orcamento.cliente_id,
            nome_cliente_digitavel: orcamento.nome_cliente_digitavel,
            maquina_id: orcamento.maquina_id,
            modelo_maquina: orcamento.modelo_maquina,
            chassi: orcamento.chassi,
            descricao_problema: orcamento.descricao_problema,
            valor_mao_de_obra: orcamento.valor_mao_de_obra,
            valor_pecas: orcamento.valor_pecas,
            valor_deslocamento: orcamento.valor_deslocamento,
            valor_liquido_total: orcamento.valor_liquido_total,
            tipo_diagnostico: orcamento.tipo_diagnostico || 'MANUTENCAO',
            consultor_id: orcamento.consultor_id,
            orcamento_id: orcamento.id
        };

        const { data: novaOS, error: osError } = await supabase
            .from('ordens_servico')
            .insert(osPayload)
            .select()
            .single();

        if (osError) {
            console.error('Erro ao gerar OS a partir do Orçamento:', osError);
            throw osError;
        }

        // 2. Transição do Status do Orçamento
        await this.updateStatus(orcamentoId, 'CONVERTIDO_OS');

        // 3. Registrar Histórico na OS recém-criada
        const histPayload: Database['public']['Tables']['historico_status_os']['Insert'] = {
            ordem_servico_id: novaOS.id,
            status_novo: 'AGUARDANDO_ATRIBUICAO',
            motivo_mudanca: `OS Gerada automaticamente a partir do Orçamento #${orcamento.numero_orcamento}`,
            usuario_id: orcamento.consultor_id
        };
        await supabase.from('historico_status_os').insert(histPayload);

        return novaOS;
    }

    /**
     * Busca estatísticas de orçamentos para o consultor
     */
    async getEstatisticas(consultorId?: string) {
        let query = supabase.from('orcamentos_servico').select('status_orcamento, valor_liquido_total');
        
        if (consultorId) {
            query = query.eq('consultor_id', consultorId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
            emElaboracao: data.filter(o => o.status_orcamento === 'EM_ELABORACAO').length,
            enviados: data.filter(o => o.status_orcamento === 'ENVIADO_CLIENTE').length,
            aprovados: data.filter(o => o.status_orcamento === 'APROVADO').length,
            convertidos: data.filter(o => o.status_orcamento === 'CONVERTIDO_OS').length,
            valorTotalAprovado: data
                .filter(o => o.status_orcamento === 'APROVADO')
                .reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0)
        };
    }
    /**
     * Busca orçamento pelo número NBS (para auto-vincular à OS)
     */
    async findByNumeroNBS(numeroNBS: string): Promise<OrcamentoServico | null> {
        const { data, error } = await supabase
            .from('orcamentos_servico')
            .select(`*, cliente:clientes(*), consultor:profiles(*)`)
            .eq('numero_orcamento', numeroNBS)
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar orçamento por NBS:', error);
            return null;
        }

        return data as OrcamentoServico | null;
    }
}

export const orcamentoService = new OrcamentoService();
