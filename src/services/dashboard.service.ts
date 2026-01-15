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
        const dataFetch = async () => {
            console.log('📊 [dashboardService] Iniciando getKPIs...');

            // Verificar estado de autenticação
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            console.log('🔐 [dashboardService] Sessão:', session ? 'ATIVA' : 'INATIVA', 'User ID:', session?.user?.id || 'N/A', 'Erro:', authError);

            if (!session) {
                console.error('❌ [dashboardService] Usuário não autenticado! RLS bloqueará a leitura.');
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            // Otimização: Limitar aos últimos 5 anos para garantir visão de dados antigos
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

            // 1. Total de OS abertas (não faturadas)
            // count é eficiente, não precisa mudar
            const { count: totalOsAbertas, error: err1 } = await supabase
                .from('ordens_servico')
                .select('*', { count: 'exact', head: true })
                .is('data_faturamento', null);

            console.log('📊 [dashboardService] totalOsAbertas:', totalOsAbertas, 'erro:', err1);

            if (err1) throw err1;

            // 2. OS Normal (não faturadas)
            // Buscar apenas valor_liquido_total
            const { data: osNormal, error: err2 } = await supabase
                .from('ordens_servico')
                .select('valor_liquido_total')
                .eq('tipo_os', 'NORMAL')
                .is('data_faturamento', null);

            console.log('📊 [dashboardService] osNormal:', osNormal?.length, 'erro:', err2);
            if (err2) throw err2;

            // 3. OS Garantia (não faturadas)
            const { data: osGarantia, error: err3 } = await supabase
                .from('ordens_servico')
                .select('valor_liquido_total')
                .eq('tipo_os', 'GARANTIA')
                .is('data_faturamento', null);

            if (err3) throw err3;

            // 4. Calcular valores
            const valorNormal = osNormal?.reduce(
                (sum, os) => sum + Number(os.valor_liquido_total || 0),
                0
            ) || 0;

            const valorGarantia = osGarantia?.reduce(
                (sum, os) => sum + Number(os.valor_liquido_total || 0),
                0
            ) || 0;

            // 5. Tempo médio de execução (OS fechadas nos últimos 12 meses)
            // Otimização: Filtrar por data para não pegar histórico todo
            const { data: osFechadas, error: err4 } = await supabase
                .from('ordens_servico')
                .select('data_abertura, data_fechamento')
                .not('data_fechamento', 'is', null)
                .gte('data_abertura', fiveYearsAgo.toISOString());

            if (err4) throw err4;

            let tmeMediaDias = 0;
            if (osFechadas && osFechadas.length > 0) {
                const totalDias = osFechadas.reduce((sum, os) => {
                    if (!os.data_abertura || !os.data_fechamento) return sum;
                    const abertura = new Date(os.data_abertura).getTime();
                    const fechamento = new Date(os.data_fechamento).getTime();
                    const dias = (fechamento - abertura) / (1000 * 60 * 60 * 24);
                    return sum + dias;
                }, 0);
                tmeMediaDias = Math.round((totalDias / osFechadas.length) * 10) / 10;
            }

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
                historico: [],
            };
        };

        try {
            // Timeout de 15 segundos para feedback rápido
            const timeoutPromise = new Promise<{ kpis: DashboardKPIs; historico: any[] }>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout ao buscar KPIs. Verifique sua conexão.')), 15000);
            });

            return await Promise.race([dataFetch(), timeoutPromise]);

        } catch (error) {
            console.error('Erro no dashboardService.getKPIs:', error);
            throw error; // Propagar erro para a UI tratar
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
