import { supabase } from '@/lib/supabase';

export interface DashboardKPIs {
    totalOsAbertas: number;
    totalOsNormal: number;
    totalOsGarantia: number;
    valorTotalNormal: number;
    valorTotalGarantia: number;
    valorTotalAberto: number;
    tempoMedioExecucaoDias: number;
}

class DashboardService {
    async getKPIs(): Promise<{ kpis: DashboardKPIs; historico: any[] }> {
        // Envolver toda a lógica em um Promise.race para timeout
        const dataFetch = async () => {
            // 1. Total de OS abertas (não faturadas)
            const { count: totalOsAbertas } = await supabase
                .from('ordens_servico')
                .select('*', { count: 'exact', head: true })
                .is('data_faturamento', null);

            // 2. OS Normal (não faturadas)
            const { data: osNormal } = await supabase
                .from('ordens_servico')
                .select('valor_liquido_total')
                .eq('tipo_os', 'NORMAL')
                .is('data_faturamento', null);

            // 3. OS Garantia (não faturadas)
            const { data: osGarantia } = await supabase
                .from('ordens_servico')
                .select('valor_liquido_total')
                .eq('tipo_os', 'GARANTIA')
                .is('data_faturamento', null);

            // 4. Calcular valores
            const valorNormal = osNormal?.reduce(
                (sum, os) => sum + Number(os.valor_liquido_total),
                0
            ) || 0;

            const valorGarantia = osGarantia?.reduce(
                (sum, os) => sum + Number(os.valor_liquido_total),
                0
            ) || 0;

            // 5. Tempo médio de execução (OS fechadas)
            const { data: osFechadas } = await supabase
                .from('ordens_servico')
                .select('data_abertura, data_fechamento')
                .not('data_fechamento', 'is', null);

            let tmeMediaDias = 0;
            if (osFechadas && osFechadas.length > 0) {
                const totalDias = osFechadas.reduce((sum, os) => {
                    const abertura = new Date(os.data_abertura).getTime();
                    const fechamento = new Date(os.data_fechamento!).getTime();
                    const dias = (fechamento - abertura) / (1000 * 60 * 60 * 24);
                    return sum + dias;
                }, 0);
                tmeMediaDias = Math.round((totalDias / osFechadas.length) * 10) / 10;
            }

            // 6. Histórico mensal (últimos 6 meses)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const { data: historico } = await supabase.rpc('get_monthly_stats', {
                start_date: sixMonthsAgo.toISOString(),
            });

            return {
                kpis: {
                    totalOsAbertas: totalOsAbertas || 0,
                    totalOsNormal: osNormal?.length || 0,
                    totalOsGarantia: osGarantia?.length || 0,
                    valorTotalNormal: valorNormal,
                    valorTotalGarantia: valorGarantia,
                    valorTotalAberto: valorNormal + valorGarantia,
                    tempoMedioExecucaoDias: tmeMediaDias,
                },
                historico: historico || [],
            };
        };

        try {
            // Timeout de 10 segundos (para dar chance em conexões lentas, mas não infinitas)
            const timeoutPromise = new Promise<{ kpis: DashboardKPIs; historico: any[] }>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout ao buscar KPIs')), 10000);
            });

            return await Promise.race([dataFetch(), timeoutPromise]);

        } catch (error) {
            console.error('Erro no dashboardService.getKPIs (Erro ou Timeout):', error);
            // FAILOVER: Retornar zelos para não travar a UI (AdBlock protection)
            return {
                kpis: {
                    totalOsAbertas: 0,
                    totalOsNormal: 0,
                    totalOsGarantia: 0,
                    valorTotalNormal: 0,
                    valorTotalGarantia: 0,
                    valorTotalAberto: 0,
                    tempoMedioExecucaoDias: 0,
                },
                historico: [],
            };
        }
    }
} catch (error) {
    console.error('Erro no dashboardService.getKPIs:', error);
    // FAILOVER: Retornar zelos para não travar a UI (AdBlock protection)
    return {
        kpis: {
            totalOsAbertas: 0,
            totalOsNormal: 0,
            totalOsGarantia: 0,
            valorTotalNormal: 0,
            valorTotalGarantia: 0,
            valorTotalAberto: 0,
            tempoMedioExecucaoDias: 0,
        },
        historico: [],
    };
}
    }

    async getOSByStatus() {
    const { data, error } = await supabase
        .from('ordens_servico')
        .select('status_atual')
        .is('data_faturamento', null);

    if (error) throw error;

    const statusCount: Record<string, number> = {};
    data?.forEach((os) => {
        statusCount[os.status_atual] = (statusCount[os.status_atual] || 0) + 1;
    });

    return statusCount;
}

    async getTopTecnicos(limit = 5) {
    const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
        tecnico_id,
        tecnico:tecnicos(nome_completo)
      `)
        .not('tecnico_id', 'is', null)
        .is('data_faturamento', null);

    if (error) throw error;

    const tecnicoCount: Record<string, { nome: string; count: number }> = {};

    data?.forEach((os: any) => {
        const id = os.tecnico_id;
        if (!tecnicoCount[id]) {
            tecnicoCount[id] = {
                nome: os.tecnico?.nome_completo || 'Desconhecido',
                count: 0,
            };
        }
        tecnicoCount[id].count++;
    });

    return Object.values(tecnicoCount)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}
}

export const dashboardService = new DashboardService();
