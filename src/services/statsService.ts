import { supabase, getUserProfile } from '../lib/supabase';
export interface DashboardStats {
    // Métricas principais
    totalOS: number;
    osAbertas: number;
    osConcluidas: number;
    osCanceladas: number;

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

            const profile = await getUserProfile() as any;
            const role = profile?.role?.toUpperCase();

            if (role === 'CONSULTOR_GARANTIA') return 'GARANTIA';
            if (role === 'CONSULTOR_POS_VENDA') return 'NORMAL';

            return null; // Gerente, Chefe de Oficina, etc. veem tudo
        } catch (error) {
            console.error('Erro ao obter filtro de cargo:', error);
            return null;
        }
    },

    /**
     * Buscar estatísticas gerais do dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        const dataFetch = async () => {
            console.log('📊 [statsService] Iniciando getDashboardStats...');

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Sessão expirada. Faça login novamente.');

            const tipoOS = await this.getRoleFilter();
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            let query = supabase
                .from('ordens_servico')
                .select('status_atual, tipo_os, valor_liquido_total, data_abertura, data_fechamento')
                .gte('data_abertura', twoYearsAgo.toISOString());

            if (tipoOS) {
                query = query.eq('tipo_os', tipoOS);
            }

            const osData = await query.limit(5000);
            if (osData.error) throw osData.error;

            // Busca de pendências e alertas (lógica simplificada para brevidade)
            let pendencias: any[] = [];
            try {
                const pResp = await supabase.from('pendencias_os').select('status');
                if (!pResp.error) pendencias = pResp.data || [];
            } catch (e) { console.warn('pendencias_os não encontrada'); }

            let alertas: any[] = [];
            try {
                const aResp = await supabase.from('alertas').select('lido');
                if (!aResp.error) alertas = aResp.data || [];
            } catch (e) { console.warn('alertas não encontrada'); }

            const os = (osData.data || []) as any[];
            const osAbertas = os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const osConcluidas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
            const osCanceladas = os.filter(o => o.status_atual === 'CANCELADA');

            const osNormal = os.filter(o => o.tipo_os === 'NORMAL');
            const osGarantia = os.filter(o => o.tipo_os === 'GARANTIA');

            const sumValor = (items: any[]) => items.reduce((sum, o) => sum + (parseFloat(o.valor_liquido_total) || 0), 0);
            const calcularDiasAberto = (ab: string, fc?: string) => {
                const a = new Date(ab);
                const f = fc ? new Date(fc) : new Date();
                return Math.max(0, Math.floor((f.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
            };

            let tmed = 0;
            if (osConcluidas.length > 0) tmed = osConcluidas.reduce((s, o) => s + calcularDiasAberto(o.data_abertura, o.data_fechamento), 0) / osConcluidas.length;

            let dmed = 0;
            if (osAbertas.length > 0) dmed = osAbertas.reduce((s, o) => s + calcularDiasAberto(o.data_abertura), 0) / osAbertas.length;

            return {
                totalOS: os.length,
                osAbertas: osAbertas.length,
                osConcluidas: osConcluidas.length,
                osCanceladas: osCanceladas.length,
                osNormal: osNormal.length,
                osGarantia: osGarantia.length,
                osCriticas: 0, osAltas: 0, osMedias: 0, osNormais: 0,
                valorTotal: sumValor(os),
                valorNormal: sumValor(osNormal),
                valorGarantia: sumValor(osGarantia),
                valorMedioOS: os.length > 0 ? sumValor(os) / os.length : 0,
                tempoMedioResolucao: tmed,
                diasMedioEmAberto: dmed,
                totalPendencias: pendencias.length,
                pendenciasAbertas: pendencias.filter((p: any) => p.status !== 'RESOLVIDO').length,
                totalAlertas: alertas.length,
                alertasNaoLidos: alertas.filter((a: any) => !a.lido).length,
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

            const grouped = osData.reduce((acc: any, os: any) => {
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

            return Object.values(grouped).map((g: any) => {
                const concluidas = g.os_list.filter((o: any) => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
                return {
                    consultor_id: g.consultor_id,
                    consultor_nome: g.consultor_nome,
                    total_os: g.os_list.length,
                    os_concluidas: concluidas.length,
                    os_em_andamento: g.os_list.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
                    valor_total: g.os_list.reduce((s: number, o: any) => s + (o.valor_liquido_total || 0), 0),
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

            const grouped = (data || []).reduce((acc: any, os: any) => {
                const ds = new Date(os.data_abertura).toISOString().split('T')[0];
                if (!acc[ds]) acc[ds] = { data: ds, total: 0, normal: 0, garantia: 0, valor: 0 };
                acc[ds].total++;
                if (os.tipo_os === 'NORMAL') acc[ds].normal++;
                if (os.tipo_os === 'GARANTIA') acc[ds].garantia++;
                acc[ds].valor += os.valor_liquido_total || 0;
                return acc;
            }, {});

            return Object.values(grouped).sort((a: any, b: any) => a.data.localeCompare(b.data)) as TendenciaOS[];
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

            const dist = (data || []).reduce((acc: any, os: any) => {
                acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(dist).map(([status, count]) => ({ status, count: count as number }));
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

            const grouped = (data || []).reduce((acc: any, os: any) => {
                const c = os.nome_cliente_digitavel || 'Sem Nome';
                if (!acc[c]) acc[c] = { cliente: c, valor: 0, quantidade: 0 };
                acc[c].valor += os.valor_liquido_total || 0;
                acc[c].quantidade++;
                return acc;
            }, {});

            return Object.values(grouped).sort((a: any, b: any) => b.valor - a.valor).slice(0, limit);
        } catch (e) { return []; }
    },
};
