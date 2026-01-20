import { supabase } from '../lib/supabase';
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
        const dataFetch = async () => {
            console.log('📊 [statsService] Iniciando getDashboardStats...');

            // Verificar estado de autenticação
            const { data: { session }, error: authError } = await supabase.auth.getSession();
            console.log('🔐 [statsService] Sessão:', session ? 'ATIVA' : 'INATIVA', 'Erro:', authError);

            if (!session) {
                console.error('❌ [statsService] Usuário não autenticado! RLS bloqueará a leitura.');
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            // Buscar dados diretamente da tabela ordens_servico
            // Limitar a 2 anos para otimizar performance
            const twoYearsAgo = new Date();
            twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

            // Usar apenas colunas essenciais para reduzir carga
            const osData = await supabase
                .from('ordens_servico')
                .select('status_atual, tipo_os, valor_liquido_total, data_abertura, data_fechamento')
                .gte('data_abertura', twoYearsAgo.toISOString())
                .limit(5000); // Limitar para evitar sobrecarga

            console.log('📊 [statsService] osData:', osData.data?.length, 'registros, erro:', osData.error);

            if (osData.error) throw osData.error;

            // Buscar pendências (apenas contagem/status) - tabela pode não existir
            let pendencias: any[] = [];
            try {
                const pendenciasData = await supabase.from('pendencias_os').select('status');
                if (!pendenciasData.error) {
                    pendencias = pendenciasData.data || [];
                }
            } catch (e) {
                console.warn('Tabela pendencias_os não encontrada');
            }

            // Buscar alertas (apenas lido) - tabela pode não existir
            let alertas: any[] = [];
            try {
                const alertasData = await supabase.from('alertas').select('lido');
                if (!alertasData.error) {
                    alertas = alertasData.data || [];
                }
            } catch (e) {
                console.warn('Tabela alertas não encontrada');
            }

            const os = (osData.data || []) as any[];
            const osAbertas = os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const osConcluidas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
            const osCanceladas = os.filter(o => o.status_atual === 'CANCELADA');

            const osNormal = os.filter(o => o.tipo_os === 'NORMAL');
            const osGarantia = os.filter(o => o.tipo_os === 'GARANTIA');

            // Calcular valores com segurança (0 se undefined)
            const sumValor = (items: any[]) => items.reduce((sum, o) => sum + (parseFloat(o.valor_liquido_total) || 0), 0);

            // Calcular dias em aberto dinamicamente (sem coluna dias_em_aberto)
            const calcularDiasEmAberto = (dataAbertura: string, dataFechamento?: string) => {
                const abertura = new Date(dataAbertura);
                const fechamento = dataFechamento ? new Date(dataFechamento) : new Date();
                return Math.max(0, Math.floor((fechamento.getTime() - abertura.getTime()) / (1000 * 60 * 60 * 24)));
            };

            // Calcular tempo médio de resolução para OS concluídas
            let tempoMedioResolucao = 0;
            if (osConcluidas.length > 0) {
                const totalDias = osConcluidas.reduce((sum, o) => {
                    return sum + calcularDiasEmAberto(o.data_abertura, o.data_fechamento);
                }, 0);
                tempoMedioResolucao = totalDias / osConcluidas.length;
            }

            // Calcular dias médio em aberto para OS abertas
            let diasMedioEmAberto = 0;
            if (osAbertas.length > 0) {
                const totalDias = osAbertas.reduce((sum, o) => {
                    return sum + calcularDiasEmAberto(o.data_abertura);
                }, 0);
                diasMedioEmAberto = totalDias / osAbertas.length;
            }

            return {
                totalOS: os.length,
                osAbertas: osAbertas.length,
                osConcluidas: osConcluidas.length,
                osCanceladas: osCanceladas.length,

                osNormal: osNormal.length,
                osGarantia: osGarantia.length,

                // Sem coluna nivel_urgencia, retornar zeros
                osCriticas: 0,
                osAltas: 0,
                osMedias: 0,
                osNormais: 0,

                valorTotal: sumValor(os),
                valorNormal: sumValor(osNormal),
                valorGarantia: sumValor(osGarantia),
                valorMedioOS: os.length > 0 ? sumValor(os) / os.length : 0,

                tempoMedioResolucao: tempoMedioResolucao,
                diasMedioEmAberto: diasMedioEmAberto,

                totalPendencias: pendencias.length,
                pendenciasAbertas: pendencias.filter((p: any) => p.status !== 'RESOLVIDO').length,

                totalAlertas: alertas.length,
                alertasNaoLidos: alertas.filter((a: any) => !a.lido).length,
            };
        };

        try {
            // Timeout de 30s para dar mais tempo (conexões lentas)
            const timeoutPromise = new Promise<DashboardStats>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout ao buscar estatísticas. Verifique sua conexão ou se há dados cadastrados.')), 30000);
            });

            return await Promise.race([dataFetch(), timeoutPromise]);

        } catch (error) {
            console.error('Erro no statsService.getDashboardStats:', error);
            throw error;
        }
    },

    /**
     * Performance por consultor
     */
    async getConsultorPerformance(): Promise<ConsultorPerformance[]> {
        try {
            // Limitar a 1 ano para evitar timeout
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

            const { data: osData, error } = await supabase
                .from('ordens_servico')
                .select('consultor_id, status_atual, valor_liquido_total, consultor:consultor_id(first_name, last_name)')
                .gte('data_abertura', oneYearAgo.toISOString());

            if (error || !osData) {
                console.warn('Erro ao buscar OS para performance:', error);
                return [];
            }

            // Agrupar por consultor
            const grouped = osData.reduce((acc: any, os: any) => {
                const id = os.consultor_id || 'sem_consultor';

                // Tentar obter nome do join
                let nome = 'Sem Consultor';
                if (os.consultor) {
                    // Supabase retorna array se many-to-one ou objeto se one-to-one, 
                    // mas aqui assumimos que consultor_id aponta para um profile
                    const c = Array.isArray(os.consultor) ? os.consultor[0] : os.consultor;
                    if (c) nome = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Consultor';
                }

                if (!acc[id]) {
                    acc[id] = {
                        consultor_id: id,
                        consultor_nome: nome,
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
                    os_em_andamento: g.os_list.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
                    valor_total: g.os_list.reduce((s: number, o: any) => s + (o.valor_liquido_total || 0), 0),
                    tempo_medio: 0,
                    taxa_conclusao: g.os_list.length > 0 ? Math.round((concluidas.length / g.os_list.length) * 100) : 0
                };
            });
        } catch (error) {
            console.error('Erro em getConsultorPerformance:', error);
            return [];
        }
    },

    /**
     * Tendência de OS nos últimos 30 dias
     */
    async getTendenciaOS(dias: number = 30): Promise<TendenciaOS[]> {
        try {
            const dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - dias);

            const { data, error } = await supabase
                .from('ordens_servico')
                .select('data_abertura, tipo_os, valor_liquido_total')
                .gte('data_abertura', dataInicio.toISOString());

            if (error) throw error;

            // Agrupar por data
            const grouped = (data || []).reduce((acc: any, os: any) => {
                const dataStr = new Date(os.data_abertura).toISOString().split('T')[0];
                if (!acc[dataStr]) {
                    acc[dataStr] = { data: dataStr, total: 0, normal: 0, garantia: 0, valor: 0 };
                }
                acc[dataStr].total++;
                if (os.tipo_os === 'NORMAL') acc[dataStr].normal++;
                if (os.tipo_os === 'GARANTIA') acc[dataStr].garantia++;
                acc[dataStr].valor += os.valor_liquido_total || 0;
                return acc;
            }, {});

            return Object.values(grouped).sort((a: any, b: any) => a.data.localeCompare(b.data)) as TendenciaOS[];
        } catch (error) {
            console.error('Erro em getTendenciaOS:', error);
            return [];
        }
    },

    /**
     * Distribuição de OS por status
     */
    async getDistribuicaoStatus() {
        try {
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
        } catch (error) {
            console.error('Erro em getDistribuicaoStatus:', error);
            return [];
        }
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
