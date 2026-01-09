import { supabase } from '../lib/supabase';
import { exportService, RelatorioDados, formatarMoeda, formatarData, formatarPorcentagem } from './exportService';
import { calcularDiasEmAberto, determinarNivelUrgencia } from '../utils/osHelpers';

export const relatoriosService = {
    /**
     * Relatório de Garantia Detalhado
     */
    async relatorioGarantia(dataInicio?: string, dataFim?: string) {
        let query = supabase
            .from('ordens_servico')
            .select(`
        *,
        profiles:consultor_id (username, first_name, last_name)
      `)
            .eq('tipo_os', 'GARANTIA');

        if (dataInicio) query = query.gte('data_abertura', dataInicio);
        if (dataFim) query = query.lte('data_abertura', dataFim);

        const { data, error } = await query;
        if (error) throw error;

        const os = data || [];
        const totalValor = os.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0);
        const aprovadas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
        const rejeitadas = os.filter(o => o.status_atual === 'CANCELADA');

        return {
            os,
            estatisticas: {
                total: os.length,
                aprovadas: aprovadas.length,
                rejeitadas: rejeitadas.length,
                emAndamento: os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual)).length,
                valorTotal: totalValor,
                valorAprovado: aprovadas.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0),
                valorRejeitado: rejeitadas.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0),
                taxaAprovacao: os.length > 0 ? (aprovadas.length / os.length) * 100 : 0,
            },
        };
    },

    /**
     * Exportar Relatório de Garantia
     */
    async exportarRelatorioGarantia(formato: 'csv' | 'pdf', dataInicio?: string, dataFim?: string) {
        const resultado = await this.relatorioGarantia(dataInicio, dataFim);

        const dados: RelatorioDados = {
            titulo: 'Relatório de Garantia Detalhado',
            subtitulo: dataInicio && dataFim
                ? `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`
                : 'Todas as OS de Garantia',
            colunas: ['Nº OS', 'Cliente', 'Chassi', 'Data Abertura', 'Status', 'Dias', 'Valor'],
            linhas: resultado.os.map(os => [
                os.numero_os,
                os.nome_cliente_digitavel || '-',
                os.chassi || '-',
                formatarData(os.data_abertura),
                os.status_atual,
                calcularDiasEmAberto(os.data_abertura),
                formatarMoeda(os.valor_liquido_total || 0),
            ]),
            totalizadores: {
                'Total de OS': resultado.estatisticas.total,
                'Aprovadas': resultado.estatisticas.aprovadas,
                'Rejeitadas': resultado.estatisticas.rejeitadas,
                'Em Andamento': resultado.estatisticas.emAndamento,
                'Valor Total': formatarMoeda(resultado.estatisticas.valorTotal),
                'Taxa de Aprovação': formatarPorcentagem(resultado.estatisticas.taxaAprovacao),
            },
        };

        if (formato === 'csv') {
            exportService.exportarCSV(dados, 'relatorio-garantia');
        } else {
            exportService.salvarPDF(dados);
        }
    },

    /**
     * Relatório de Performance por Consultor
     */
    async relatorioPerformanceConsultor(dataInicio?: string, dataFim?: string) {
        let query = supabase
            .from('ordens_servico')
            .select(`
        *,
        profiles:consultor_id (id, username, first_name, last_name)
      `);

        if (dataInicio) query = query.gte('data_abertura', dataInicio);
        if (dataFim) query = query.lte('data_abertura', dataFim);

        const { data, error } = await query;
        if (error) throw error;

        // Agrupar por consultor
        const porConsultor = (data || []).reduce((acc: any, os: any) => {
            const id = os.consultor_id || 'sem_consultor';
            const nome = os.profiles?.first_name
                ? `${os.profiles.first_name} ${os.profiles.last_name || ''}`.trim()
                : os.profiles?.username || 'Sem Consultor';

            if (!acc[id]) {
                acc[id] = {
                    id,
                    nome,
                    total: 0,
                    concluidas: 0,
                    emAndamento: 0,
                    valorTotal: 0,
                    diasAcumulados: 0,
                };
            }

            acc[id].total++;
            acc[id].valorTotal += os.valor_liquido_total || 0;

            if (['CONCLUIDA', 'FATURADA'].includes(os.status_atual)) {
                acc[id].concluidas++;
                if (os.data_fechamento) {
                    const dias = calcularDiasEmAberto(os.data_abertura);
                    acc[id].diasAcumulados += dias;
                }
            } else if (!['CANCELADA'].includes(os.status_atual)) {
                acc[id].emAndamento++;
            }

            return acc;
        }, {});

        const consultores = Object.values(porConsultor).map((c: any) => ({
            ...c,
            tempoMedio: c.concluidas > 0 ? c.diasAcumulados / c.concluidas : 0,
            taxaConclusao: c.total > 0 ? (c.concluidas / c.total) * 100 : 0,
        })).sort((a: any, b: any) => b.total - a.total);

        return consultores;
    },

    /**
     * Exportar Relatório de Performance
     */
    async exportarRelatorioPerformance(formato: 'csv' | 'pdf', dataInicio?: string, dataFim?: string) {
        const consultores = await this.relatorioPerformanceConsultor(dataInicio, dataFim);

        const dados: RelatorioDados = {
            titulo: 'Relatório de Performance por Consultor',
            subtitulo: dataInicio && dataFim
                ? `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`
                : 'Todas as OS',
            colunas: ['Consultor', 'Total OS', 'Concluídas', 'Em Andamento', 'Valor Total', 'Tempo Médio (dias)', 'Taxa Conclusão'],
            linhas: consultores.map(c => [
                c.nome,
                c.total,
                c.concluidas,
                c.emAndamento,
                formatarMoeda(c.valorTotal),
                c.tempoMedio.toFixed(1),
                formatarPorcentagem(c.taxaConclusao),
            ]),
        };

        if (formato === 'csv') {
            exportService.exportarCSV(dados, 'relatorio-performance');
        } else {
            exportService.salvarPDF(dados);
        }
    },

    /**
     * Relatório de Aging (Envelhecimento)
     */
    async relatorioAging() {
        const { data, error } = await supabase
            .from('vw_os_estatisticas')
            .select('*')
            .not('status_atual', 'in', '("CONCLUIDA","FATURADA","CANCELADA")');

        if (error) throw error;

        const os = data || [];
        const porUrgencia = {
            NORMAL: os.filter(o => o.nivel_urgencia === 'NORMAL'),
            MEDIO: os.filter(o => o.nivel_urgencia === 'MEDIO'),
            ALTO: os.filter(o => o.nivel_urgencia === 'ALTO'),
            CRITICO: os.filter(o => o.nivel_urgencia === 'CRITICO'),
        };

        return {
            os,
            porUrgencia,
            estatisticas: {
                total: os.length,
                normal: porUrgencia.NORMAL.length,
                medio: porUrgencia.MEDIO.length,
                alto: porUrgencia.ALTO.length,
                critico: porUrgencia.CRITICO.length,
                valorTotal: os.reduce((sum, o) => sum + o.valor_liquido_total, 0),
                diasMedio: os.length > 0 ? os.reduce((sum, o) => sum + o.dias_em_aberto, 0) / os.length : 0,
            },
        };
    },

    /**
     * Exportar Relatório de Aging
     */
    async exportarRelatorioAging(formato: 'csv' | 'pdf') {
        const resultado = await this.relatorioAging();

        const dados: RelatorioDados = {
            titulo: 'Relatório de Aging (Envelhecimento de OS)',
            subtitulo: 'Análise de OS em aberto por tempo',
            colunas: ['Nº OS', 'Cliente', 'Tipo', 'Data Abertura', 'Dias em Aberto', 'Urgência', 'Valor'],
            linhas: resultado.os
                .sort((a, b) => b.dias_em_aberto - a.dias_em_aberto)
                .map(os => [
                    os.numero_os,
                    os.cliente_nome || '-',
                    os.tipo_os,
                    formatarData(os.data_abertura),
                    os.dias_em_aberto,
                    os.nivel_urgencia,
                    formatarMoeda(os.valor_liquido_total),
                ]),
            totalizadores: {
                'Total de OS': resultado.estatisticas.total,
                'Normal (<30d)': resultado.estatisticas.normal,
                'Médio (30-60d)': resultado.estatisticas.medio,
                'Alto (60-90d)': resultado.estatisticas.alto,
                'Crítico (>90d)': resultado.estatisticas.critico,
                'Dias Médio': resultado.estatisticas.diasMedio.toFixed(1),
                'Valor Total': formatarMoeda(resultado.estatisticas.valorTotal),
            },
        };

        if (formato === 'csv') {
            exportService.exportarCSV(dados, 'relatorio-aging');
        } else {
            exportService.salvarPDF(dados);
        }
    },

    /**
     * Relatório de Previsão x Realizado
     */
    async relatorioPrevisaoRealizado(dataInicio?: string, dataFim?: string) {
        let query = supabase
            .from('ordens_servico')
            .select('*')
            .in('status_atual', ['CONCLUIDA', 'FATURADA']);

        if (dataInicio) query = query.gte('data_abertura', dataInicio);
        if (dataFim) query = query.lte('data_abertura', dataFim);

        const { data, error } = await query;
        if (error) throw error;

        // Analisar previsões (campos que temos disponíveis)
        const os = (data || []).map(o => {
            const diasReais = o.data_fechamento
                ? calcularDiasEmAberto(o.data_abertura)
                : 0;

            return {
                ...o,
                diasReais,
                // Estimativa baseada em tipo (exemplo)
                diasPrevistos: o.tipo_os === 'GARANTIA' ? 15 : 10,
                atrasado: diasReais > (o.tipo_os === 'GARANTIA' ? 15 : 10),
            };
        });

        const atrasadas = os.filter(o => o.atrasado);
        const noPrazo = os.filter(o => !o.atrasado);

        return {
            os,
            estatisticas: {
                total: os.length,
                atrasadas: atrasadas.length,
                noPrazo: noPrazo.length,
                taxaAtraso: os.length > 0 ? (atrasadas.length / os.length) * 100 : 0,
                diasMedioReal: os.length > 0 ? os.reduce((sum, o) => sum + o.diasReais, 0) / os.length : 0,
            },
        };
    },

    /**
     * Exportar Previsão x Realizado
     */
    async exportarRelatorioPrevisaoRealizado(formato: 'csv' | 'pdf', dataInicio?: string, dataFim?: string) {
        const resultado = await this.relatorioPrevisaoRealizado(dataInicio, dataFim);

        const dados: RelatorioDados = {
            titulo: 'Relatório de Previsão x Realizado',
            subtitulo: dataInicio && dataFim
                ? `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`
                : 'Todas as OS Concluídas',
            colunas: ['Nº OS', 'Tipo', 'Data Abertura', 'Data Fechamento', 'Dias Reais', 'Dias Previstos', 'Status Prazo'],
            linhas: resultado.os.map(os => [
                os.numero_os,
                os.tipo_os,
                formatarData(os.data_abertura),
                os.data_fechamento ? formatarData(os.data_fechamento) : '-',
                os.diasReais,
                os.diasPrevistos,
                os.atrasado ? 'ATRASADO' : 'NO PRAZO',
            ]),
            totalizadores: {
                'Total OS': resultado.estatisticas.total,
                'Atrasadas': resultado.estatisticas.atrasadas,
                'No Prazo': resultado.estatisticas.noPrazo,
                'Taxa de Atraso': formatarPorcentagem(resultado.estatisticas.taxaAtraso),
                'Dias Médio Real': resultado.estatisticas.diasMedioReal.toFixed(1),
            },
        };

        if (formato === 'csv') {
            exportService.exportarCSV(dados, 'relatorio-previsao-realizado');
        } else {
            exportService.salvarPDF(dados);
        }
    },
};
