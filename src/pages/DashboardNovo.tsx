import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { statsService, DashboardStats } from '../services/statsService';
import { relatoriosService } from '../services/relatoriosService';
import { KPICard, MiniKPICard, ProgressKPICard } from '../components/ui/KPICard';
import {
    TendenciaChart,
    DistribuicaoStatusChart,
    ConsultorPerformanceChart,
    TopClientesChart,
    UrgenciaDistributionChart,
} from '../components/ui/Charts';
import {
    TrendingUp,
    DollarSign,
    Clock,
    AlertCircle,
    FileText,
    Users,
    Calendar,
    Download,
    RefreshCw,
} from 'lucide-react';
import { formatarValor } from '../utils/osHelpers';

export function DashboardNovo() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tendencia, setTendencia] = useState<any[]>([]);
    const [distribuicao, setDistribuicao] = useState<any[]>([]);
    const [consultores, setConsultores] = useState<any[]>([]);
    const [topClientes, setTopClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const carregarDados = async () => {
        try {
            setErro(null);
            setAtualizando(true);
            const [statsData, tendenciaData, distribuicaoData, consultoresData, clientesData] = await Promise.all([
                statsService.getDashboardStats(),
                statsService.getTendenciaOS(30),
                statsService.getDistribuicaoStatus(),
                statsService.getConsultorPerformance(),
                statsService.getTopClientes(10),
            ]);

            setStats(statsData);
            setTendencia(tendenciaData);
            setDistribuicao(distribuicaoData);
            setConsultores(consultoresData);
            setTopClientes(clientesData);
        } catch (error: any) {
            console.error('Erro ao carregar dashboard:', error);

            // Detectar se é erro de tabela/view inexistente
            if (error?.message?.includes('relation') || error?.message?.includes('does not exist') || error?.code === '42P01') {
                setErro('migration');
            } else {
                setErro('generico');
            }
        } finally {
            setLoading(false);
            setAtualizando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const handleGerarRelatorio = async (tipo: string) => {
        try {
            switch (tipo) {
                case 'garantia':
                    await relatoriosService.exportarRelatorioGarantia('pdf');
                    break;
                case 'performance':
                    await relatoriosService.exportarRelatorioPerformance('pdf');
                    break;
                case 'aging':
                    await relatoriosService.exportarRelatorioAging('pdf');
                    break;
                case 'previsao':
                    await relatoriosService.exportarRelatorioPrevisaoRealizado('pdf');
                    break;
            }
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            alert('Erro ao gerar relatório. Verifique o console.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    // Mostrar erro de migration não executada
    if (erro === 'migration') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg border-2 border-orange-200 p-8">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Migration Pendente</h2>
                        <p className="text-gray-600">As novas tabelas ainda não foram criadas no Supabase</p>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-orange-900 mb-2">📋 Para corrigir:</h3>
                        <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
                            <li>Acesse o Supabase SQL Editor</li>
                            <li>Execute a migration: <code className="bg-orange-100 px-2 py-1 rounded">03_novas_tabelas_melhorias.sql</code></li>
                            <li>Aguarde a execução completar</li>
                            <li>Volte aqui e clique em "Tentar Novamente"</li>
                        </ol>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <button
                            onClick={carregarDados}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Erro genérico
    if (erro) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar Dados</h2>
                    <p className="text-gray-600 mb-6">Ocorreu um erro ao buscar os dados do dashboard</p>
                    <button
                        onClick={carregarDados}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
                            <p className="text-sm text-gray-600">Visão completa do desempenho</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={carregarDados}
                                disabled={atualizando}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
                                Atualizar
                            </button>
                            <button
                                onClick={() => navigate('/relatorios')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                            >
                                <FileText className="w-4 h-4" />
                                Relatórios
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* KPIs Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard
                        title="Total de OS"
                        value={stats?.totalOS || 0}
                        subtitle={`${stats?.osAbertas || 0} abertas • ${stats?.osConcluidas || 0} concluídas`}
                        icon={FileText}
                        color="blue"
                        onClick={() => navigate('/os/lista')}
                    />

                    <KPICard
                        title="Valor Total"
                        value={formatarValor(stats?.valorTotal || 0)}
                        subtitle="Todas as OS"
                        icon={DollarSign}
                        color="green"
                    />

                    <KPICard
                        title="OS Críticas"
                        value={stats?.osCriticas || 0}
                        subtitle="Mais de 90 dias"
                        icon={AlertCircle}
                        color="red"
                        onClick={() => navigate('/os/lista')}
                    />

                    <KPICard
                        title="Tempo Médio"
                        value={`${(stats?.tempoMedioResolucao || 0).toFixed(0)}d`}
                        subtitle="Resolução de OS"
                        icon={Clock}
                        color="purple"
                    />
                </div>

                {/* Mini Cards - Detalhes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <MiniKPICard label="Normal" value={stats?.osNormal || 0} color="green" icon={TrendingUp} />
                    <MiniKPICard label="Garantia" value={stats?.osGarantia || 0} color="red" icon={AlertCircle} />
                    <MiniKPICard label="Pendências Abertas" value={stats?.pendenciasAbertas || 0} color="yellow" icon={Clock} />
                    <MiniKPICard label="Alertas Não Lidos" value={stats?.alertasNaoLidos || 0} color="orange" icon={AlertCircle} />
                </div>

                {/* Distribuição por Urgência */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UrgenciaDistributionChart
                            criticas={stats?.osCriticas || 0}
                            altas={stats?.osAltas || 0}
                            medias={stats?.osMedias || 0}
                            normais={stats?.osNormais || 0}
                        />

                        {distribuicao.length > 0 && <DistribuicaoStatusChart data={distribuicao} />}
                    </div>
                </div>

                {/* Gráfico de Tendência */}
                {tendencia.length > 0 && (
                    <div className="mb-8">
                        <TendenciaChart data={tendencia} />
                    </div>
                )}

                {/* Performance e Top Clientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {consultores.length > 0 && <ConsultorPerformanceChart data={consultores} />}
                    {topClientes.length > 0 && <TopClientesChart data={topClientes} />}
                </div>

                {/* Ações Rápidas */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Gerar Relatórios
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => handleGerarRelatorio('garantia')}
                            className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-left"
                        >
                            <h4 className="font-medium text-gray-900 mb-1">Garantia</h4>
                            <p className="text-sm text-gray-600">Análise detalhada de garantias</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('performance')}
                            className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-left"
                        >
                            <h4 className="font-medium text-gray-900 mb-1">Performance</h4>
                            <p className="text-sm text-gray-600">Ranking de consultores</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('aging')}
                            className="p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition text-left"
                        >
                            <h4 className="font-medium text-gray-900 mb-1">Aging</h4>
                            <p className="text-sm text-gray-600">Envelhecimento de OS</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('previsao')}
                            className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-left"
                        >
                            <h4 className="font-medium text-gray-900 mb-1">Previsão x Real</h4>
                            <p className="text-sm text-gray-600">Análise de prazos</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
