import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type OSEstatisticas = Database['public']['Views']['vw_os_estatisticas']['Row'];

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
     * Buscar estatísticas gerais do dashboard
     */
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            // Buscar dados com tratamento de erro individual
            // OTIMIZAÇÃO: Filtrar apenas OS dos últimos 12 meses para evitar payload gigante/timeout
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const osData = await supabase
                .from('vw_os_estatisticas')
                .select('*')
                .gte('data_abertura', oneYearAgo.toISOString())
                .limit(50); // LIMIT PROVISÓRIO PARA EVITAR TIMEOUT

            if (osData.error) throw osData.error;

            // Buscar pendências (pode não existir ainda)
            let pendencias: any[] = [];
            try {
                const pendenciasData = await supabase.from('pendencias_os').select('*');
                if (!pendenciasData.error) {
                    pendencias = pendenciasData.data || [];
                }
            } catch (e) {
                console.warn('Tabela pendencias_os não encontrada');
            }

            // Buscar alertas (pode não existir ainda)
            let alertas: any[] = [];
            try {
                const alertasData = await supabase.from('alertas').select('*');
                if (!alertasData.error) {
                    alertas = alertasData.data || [];
                }
            } catch (e) {
                console.warn('Tabela alertas não encontrada');
            }

            const os = (osData.data || []) as any[];
            const osAbertas = os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const osConcluidas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));

            return {
                totalOS: os.length,
                osAbertas: osAbertas.length,
                osConcluidas: osConcluidas.length,
                osCanceladas: os.filter(o => o.status_atual === 'CANCELADA').length,

                osNormal: os.filter(o => o.tipo_os === 'NORMAL').length,
                osGarantia: os.filter(o => o.tipo_os === 'GARANTIA').length,

                osCriticas: os.filter(o => o.nivel_urgencia === 'CRITICO').length,
                osAltas: os.filter(o => o.nivel_urgencia === 'ALTO').length,
                osMedias: os.filter(o => o.nivel_urgencia === 'MEDIO').length,
                osNormais: os.filter(o => o.nivel_urgencia === 'NORMAL').length,

                valorTotal: os.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0),
                valorNormal: os.filter(o => o.tipo_os === 'NORMAL').reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0),
                valorGarantia: os.filter(o => o.tipo_os === 'GARANTIA').reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0),
                valorMedioOS: os.length > 0 ? os.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0) / os.length : 0,

                tempoMedioResolucao: osConcluidas.length > 0
                    ? osConcluidas.reduce((sum, o) => sum + (o.dias_em_aberto || 0), 0) / osConcluidas.length
                    : 0,
                diasMedioEmAberto: osAbertas.length > 0
                    ? osAbertas.reduce((sum, o) => sum + (o.dias_em_aberto || 0), 0) / osAbertas.length
                    : 0,

                totalPendencias: pendencias.length,
                pendenciasAbertas: pendencias.filter((p: any) => p.status !== 'RESOLVIDO').length,

                totalAlertas: alertas.length,
                alertasNaoLidos: alertas.filter((a: any) => !a.lido).length,
            };
        } catch (error) {
            console.error('Erro no statsService.getDashboardStats:', error);
            // FAILOVER: Retornar objetos zerados para não travar a UI
            return {
                totalOS: 0, osAbertas: 0, osConcluidas: 0, osCanceladas: 0,
                osNormal: 0, osGarantia: 0,
                osCriticas: 0, osAltas: 0, osMedias: 0, osNormais: 0,
                valorTotal: 0, valorNormal: 0, valorGarantia: 0, valorMedioOS: 0,
                tempoMedioResolucao: 0, diasMedioEmAberto: 0,
                totalPendencias: 0, pendenciasAbertas: 0,
                totalAlertas: 0, alertasNaoLidos: 0
            };
        }
    },

    /**
     * Performance por consultor
     */
    async getConsultorPerformance(): Promise<ConsultorPerformance[]> {
        const { data, error } = await supabase.rpc('get_consultor_performance');

        // Se a função não existir, fazer manualmente
        if (error) {
            const { data: osData } = await supabase
                .from('ordens_servico')
                .select(`
          *,
          profiles:consultor_id (username, first_name, last_name)
        `);

            if (!osData) return [];

            // Agrupar por consultor
            const grouped = osData.reduce((acc: any, os: any) => {
                const id = os.consultor_id || 'sem_consultor';
                if (!acc[id]) {
                    acc[id] = {
                        consultor_id: id,
                        consultor_nome: os.profiles?.first_name
                            ? `${os.profiles.first_name} ${os.profiles.last_name || ''}`.trim()
                            : os.profiles?.username || 'Sem Consultor',
                        os_list: []
                    };
                }
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
                    os_em_andamento: g.os_list.filter((o: any) => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual)).length,
                    valor_total: g.os_list.reduce((sum: number, o: any) => sum + (o.valor_liquido_total || 0), 0),
                    tempo_medio: 0, // Calcular depois
                    taxa_conclusao: g.os_list.length > 0 ? (concluidas.length / g.os_list.length) * 100 : 0,
                };
            });
        }

        return data || [];
    },

    /**
     * Tendência de OS nos últimos 30 dias
     */
    async getTendenciaOS(dias: number = 30): Promise<TendenciaOS[]> {
        const dataInicio = new Date();
        dataInicio.setDate(dataInicio.getDate() - dias);

        const { data, error } = await supabase
            .from('ordens_servico')
            .select('*')
            .gte('data_abertura', dataInicio.toISOString());

        if (error) throw error;

        // Agrupar por data
        const grouped = (data || []).reduce((acc: any, os: any) => {
            const data = new Date(os.data_abertura).toISOString().split('T')[0];
            if (!acc[data]) {
                acc[data] = { data, total: 0, normal: 0, garantia: 0, valor: 0 };
            }
            acc[data].total++;
            if (os.tipo_os === 'NORMAL') acc[data].normal++;
            if (os.tipo_os === 'GARANTIA') acc[data].garantia++;
            acc[data].valor += os.valor_liquido_total || 0;
            return acc;
        }, {});

        return Object.values(grouped).sort((a: any, b: any) => a.data.localeCompare(b.data));
    },

    /**
     * Distribuição de OS por status
     */
    async getDistribuicaoStatus() {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('status_atual');

        if (error) throw error;

        const distribuicao = (data || []).reduce((acc: any, os: any) => {
            acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(distribuicao).map(([status, count]) => ({
            status,
            count: count as number,
        }));
    },

    /**
     * Top 10 clientes por valor
     */
    async getTopClientes(limit: number = 10) {
        const { data, error } = await supabase
            .from('ordens_servico')
            .select('nome_cliente_digitavel, valor_liquido_total');

        if (error) throw error;

        const grouped = (data || []).reduce((acc: any, os: any) => {
            const cliente = os.nome_cliente_digitavel || 'Sem Nome';
            if (!acc[cliente]) {
                acc[cliente] = { cliente, valor: 0, quantidade: 0 };
            }
            acc[cliente].valor += os.valor_liquido_total || 0;
            acc[cliente].quantidade++;
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a: any, b: any) => b.valor - a.valor)
            .slice(0, limit);
    },
};
