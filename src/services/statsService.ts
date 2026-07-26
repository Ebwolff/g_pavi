import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '../lib/supabase';
import type { Database } from '@/types/database.types';

type OSRow = Database['public']['Tables']['ordens_servico']['Row'];
type OSStatsRow = Pick<OSRow, 'status_atual' | 'tipo_os' | 'valor_liquido_total' | 'data_abertura' | 'data_fechamento' | 'nivel_urgencia'>;
type PendenciaRow = Pick<Database['public']['Tables']['pendencias_os']['Row'], 'status'>;
type AlertaRow = Pick<Database['public']['Tables']['alertas']['Row'], 'lido'>;
type ConsultorOSRow = Pick<OSRow, 'consultor_id' | 'status_atual' | 'valor_liquido_total' | 'tipo_os'> & {
    consultor: Pick<Database['public']['Tables']['profiles']['Row'], 'first_name' | 'last_name'> | Pick<Database['public']['Tables']['profiles']['Row'], 'first_name' | 'last_name'>[] | null;
};
type TendenciaRow = Pick<OSRow, 'data_abertura' | 'tipo_os' | 'valor_liquido_total'>;
type DistribuicaoRow = Pick<OSRow, 'status_atual' | 'tipo_os'>;
type TopClienteRow = Pick<OSRow, 'nome_cliente_digitavel' | 'valor_liquido_total' | 'tipo_os'>;
type ProfitabilityRow = Database['public']['Views']['vw_os_profitability']['Row'];

export interface DashboardStats {
    // Métricas principais
    totalOS: number;
    osAbertas: number;
    osConcluidas: number;
    osCanceladas: number;

    // Granularidade das Abertas
    osAguardandoAtribuicao: number;
    osEmExecucao: number;
    osAguardandoPecas: number;
    osAguardandoPagamento: number;
    osAguardandoOrcamento: number;

    // Por tipo
    osNormal: number;
    osGarantia: number;

    // Por urgência
    osCriticas: number;
    osAltas: number;
    osMedias: number;
    osNormais: number;

    // Valores
    valorTotal: number;
    valorNormal: number;
    valorGarantia: number;
    valorMedioOS: number;
    valorEmAberto: number;

    // Tempo
    tempoMedioResolucao: number;
    diasMedioEmAberto: number;

    // Pendências
    totalPendencias: number;
    pendenciasAbertas: number;

    // Alertas
    totalAlertas: number;
    alertasNaoLidos: number;
    taxaConversao: number;
    nps: number;
    retornoGarantia: number;
    taxaRetrabalho: number;
    produtividadeLiquida: number;
}

export interface ConsultorPerformance {
    consultor_id: string;
    consultor_nome: string;
    total_os: number;
    os_concluidas: number;
    os_em_andamento: number;
    valor_total: number;
    tempo_medio: number;
    taxa_conclusao: number;
}

export interface TendenciaOS {
    data: string;
    total: number;
    normal: number;
    garantia: number;
    valor: number;
}

export const statsService = {
    /**
     * Helper para obter o filtro de tipo de OS baseado no cargo do usuário
     */
    async getRoleFilter() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            const profile = await getUserProfile();
            const role = profile?.role?.toUpperCase();

            if (role === 'CONSULTOR_GARANTIA') return 'GARANTIA';
            if (role === 'CONSULTOR_POS_VENDA') return 'NORMAL';

            return null; // Gerente, Chefe de Oficina, etc. veem tudo
        } catch (error) {
            logger.error('Erro ao obter filtro de cargo:', error);
            return null;
        }
    },

    /**
     * Buscar estatísticas gerais do dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const dataFetch = async () => {
            logger.log('📊 [statsService] Iniciando getDashboardStats...');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada. Faça login novamente.');

            const tipoOS = await this.getRoleFilter();
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            let query = supabase
                .from('ordens_servico')
                .select('status_atual, tipo_os, valor_liquido_total, data_abertura, data_fechamento, nivel_urgencia')
                .gte('data_abertura', twoYearsAgo.toISOString());

            if (tipoOS) {
                query = query.eq('tipo_os', tipoOS);
            }

            const osData = await query.limit(5000);
            if (osData.error) throw osData.error;

            // Busca de pendências e alertas (lógica simplificada para brevidade)
            let pendencias: PendenciaRow[] = [];
            try {
                const pResp = await supabase.from('pendencias_os').select('status');
                if (!pResp.error) pendencias = pResp.data || [];
            } catch (e) { logger.warn('pendencias_os não encontrada'); }

            let alertas: AlertaRow[] = [];
            try {
                const aResp = await supabase.from('alertas').select('lido');
                if (!aResp.error) alertas = aResp.data || [];
            } catch (e) { logger.warn('alertas não encontrada'); }

            const os: OSStatsRow[] = osData.data || [];
            const osAbertas = os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const osConcluidas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
            const osCanceladas = os.filter(o => o.status_atual === 'CANCELADA');

            const osNormal = os.filter(o => o.tipo_os === 'NORMAL');
            const osGarantia = os.filter(o => o.tipo_os === 'GARANTIA');

            const sumValor = (items: Pick<OSStatsRow, 'valor_liquido_total'>[]) => items.reduce((sum, o) => sum + (parseFloat(String(o.valor_liquido_total)) || 0), 0);
            const calcularDiasAberto = (ab: string, fc?: string | null) => {
                const a = new Date(ab);
                const f = fc ? new Date(fc) : new Date();
                return Math.max(0, Math.floor((f.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
            };

            let tmed = 0;
            if (osConcluidas.length > 0) tmed = osConcluidas.reduce((s, o) => s + calcularDiasAberto(o.data_abertura, o.data_fechamento), 0) / osConcluidas.length;

            let dmed = 0;
            if (osAbertas.length > 0) dmed = osAbertas.reduce((s, o) => s + calcularDiasAberto(o.data_abertura), 0) / osAbertas.length;

            const countStatus = (status: string) => os.filter(o => o.status_atual === status).length;

            return {
                totalOS: os.length,
                osAbertas: osAbertas.length,
                osConcluidas: osConcluidas.length,
                osCanceladas: osCanceladas.length,

                // Status granulares
                osAguardandoAtribuicao: countStatus('AGUARDANDO_ATRIBUICAO'),
                osEmExecucao: countStatus('EM_EXECUCAO'),
                osAguardandoPecas: countStatus('AGUARDANDO_PECAS'),
                osAguardandoPagamento: countStatus('AGUARDANDO_PAGAMENTO'),
                osAguardandoOrcamento: countStatus('AGUARDANDO_APROVACAO_ORCAMENTO'),

                osNormal: osNormal.length,
                osGarantia: osGarantia.length,
                osCriticas: osAbertas.filter((o) => o.nivel_urgencia === 'CRITICO').length,
                osAltas: osAbertas.filter((o) => o.nivel_urgencia === 'ALTO').length,
                osMedias: osAbertas.filter((o) => o.nivel_urgencia === 'MEDIO').length,
                osNormais: osAbertas.filter((o) => !o.nivel_urgencia || o.nivel_urgencia === 'NORMAL').length,
                valorTotal: sumValor(os),
                valorNormal: sumValor(osNormal),
                valorGarantia: sumValor(osGarantia),
                valorMedioOS: os.length > 0 ? sumValor(os) / os.length : 0,
                valorEmAberto: sumValor(osAbertas),
                tempoMedioResolucao: tmed,
                diasMedioEmAberto: dmed,
                totalPendencias: pendencias.length,
                pendenciasAbertas: pendencias.filter((p) => p.status !== 'RESOLVIDO').length,
                totalAlertas: alertas.length,
                alertasNaoLidos: alertas.filter((a) => !a.lido).length,
                taxaConversao: os.length > 0 ? (osConcluidas.length / os.length) * 100 : 0,
                nps: 0,
                retornoGarantia: (osGarantia.length / Math.max(1, os.length)) * 100,
                taxaRetrabalho: 0,
                produtividadeLiquida: 0,
            };
        };

        const timeoutPromise = new Promise<DashboardStats>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout ao buscar estatísticas.')), 30000);
        });

        return await Promise.race([dataFetch(), timeoutPromise]);
    },

    /**
     * Performance por consultor
     */
    async getConsultorPerformance(): Promise<ConsultorPerformance[]> {
        try {
            const tipoOS = await this.getRoleFilter();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            let query = supabase
                .from('ordens_servico')
                .select('consultor_id, status_atual, valor_liquido_total, tipo_os, consultor:consultor_id(first_name, last_name)')
                .gte('data_abertura', oneYearAgo.toISOString());

            if (tipoOS) query = query.eq('tipo_os', tipoOS);

            const { data: osData, error } = await query;
            if (error || !osData) return [];

            type ConsultorGroup = { consultor_id: string; consultor_nome: string; os_list: ConsultorOSRow[] };
            const grouped = (osData as ConsultorOSRow[]).reduce<Record<string, ConsultorGroup>>((acc, os) => {
                const id = os.consultor_id || 'sem_consultor';
                let nome = 'Sem Consultor';
                if (os.consultor) {
                    const c = Array.isArray(os.consultor) ? os.consultor[0] : os.consultor;
                    if (c) nome = `${c.first_name || ''} ${c.last_name || ''}`.trim();
                }
                if (!acc[id]) acc[id] = { consultor_id: id, consultor_nome: nome, os_list: [] };
                acc[id].os_list.push(os);
                return acc;
            }, {});

            return Object.values(grouped).map((g) => {
                const concluidas = g.os_list.filter((o) => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
                return {
                    consultor_id: g.consultor_id,
                    consultor_nome: g.consultor_nome,
                    total_os: g.os_list.length,
                    os_concluidas: concluidas.length,
                    os_em_andamento: g.os_list.filter((o) => o.status_atual === 'EM_EXECUCAO').length,
                    valor_total: g.os_list.reduce((s, o) => s + (o.valor_liquido_total || 0), 0),
                    tempo_medio: 0,
                    taxa_conclusao: g.os_list.length > 0 ? Math.round((concluidas.length / g.os_list.length) * 100) : 0
                };
            });
        } catch (e) { return []; }
    },

    /**
     * Tendência de OS nos últimos 30 dias
     */
    async getTendenciaOS(dias: number = 30): Promise<TendenciaOS[]> {
        try {
            const tipoOS = await this.getRoleFilter();
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);

            let query = supabase
                .from('ordens_servico')
                .select('data_abertura, tipo_os, valor_liquido_total')
                .gte('data_abertura', dataInicio.toISOString());

            if (tipoOS) query = query.eq('tipo_os', tipoOS);

            const { data, error } = await query;
            if (error) throw error;

            const grouped = ((data || []) as TendenciaRow[]).reduce<Record<string, TendenciaOS>>((acc, os) => {
                const ds = new Date(os.data_abertura).toISOString().split('T')[0];
                if (!acc[ds]) acc[ds] = { data: ds, total: 0, normal: 0, garantia: 0, valor: 0 };
                acc[ds].total++;
                if (os.tipo_os === 'NORMAL') acc[ds].normal++;
                if (os.tipo_os === 'GARANTIA') acc[ds].garantia++;
                acc[ds].valor += os.valor_liquido_total || 0;
                return acc;
            }, {});

            return Object.values(grouped).sort((a, b) => a.data.localeCompare(b.data));
        } catch (e) { return []; }
    },

    /**
     * Distribuição de OS por status
     */
    async getDistribuicaoStatus() {
        try {
            const tipoOS = await this.getRoleFilter();
            let query = supabase.from('ordens_servico').select('status_atual, tipo_os');
            if (tipoOS) query = query.eq('tipo_os', tipoOS);

            const { data, error } = await query;
            if (error) throw error;

            const dist = ((data || []) as DistribuicaoRow[]).reduce<Record<string, number>>((acc, os) => {
                acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(dist).map(([status, count]) => ({ status, count }));
        } catch (e) { return []; }
    },

    /**
     * Top 10 clientes por valor
     */
    async getTopClientes(limit: number = 10) {
        try {
            const tipoOS = await this.getRoleFilter();
            let query = supabase.from('ordens_servico').select('nome_cliente_digitavel, valor_liquido_total, tipo_os');
            if (tipoOS) query = query.eq('tipo_os', tipoOS);

            const { data, error } = await query;
            if (error) throw error;

            type ClienteGroup = { cliente: string; valor: number; quantidade: number };
            const grouped = ((data || []) as TopClienteRow[]).reduce<Record<string, ClienteGroup>>((acc, os) => {
                const c = os.nome_cliente_digitavel || 'Sem Nome';
                if (!acc[c]) acc[c] = { cliente: c, valor: 0, quantidade: 0 };
                acc[c].valor += os.valor_liquido_total || 0;
                acc[c].quantidade++;
                return acc;
            }, {});

            return Object.values(grouped).sort((a, b) => b.valor - a.valor).slice(0, limit);
        } catch (e) { return []; }
    },

    async getOSProfitability(osId: string): Promise<ProfitabilityRow | null> {
        try {
            const { data, error } = await supabase
                .from('vw_os_profitability')
                .select('*')
                .eq('os_id', osId)
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            logger.error('Erro ao buscar rentabilidade da OS:', error);
            return null;
        }
    },

    async getGlobalProfitabilityStats(dataInicio: string) {
        try {
            const { data, error } = await supabase
                .from('vw_os_profitability')
                .select('*')
                .gte('data_abertura', dataInicio);

            if (error) throw error;

            const stats = (data || []).reduce((acc, row) => ({
                receitaTotal: acc.receitaTotal + (row.receita_total || 0),
                custoTotal: acc.custoTotal + (row.custo_total || 0),
                lucroBruto: acc.lucroBruto + (row.lucro_bruto || 0),
            }), { receitaTotal: 0, custoTotal: 0, lucroBruto: 0 });

            return {
                ...stats,
                margemMedia: stats.receitaTotal > 0 ? (stats.lucroBruto / stats.receitaTotal) * 100 : 0
            };
        } catch (error) {
            logger.error('Erro ao buscar rentabilidade global:', error);
            return null;
        }
    },
};
