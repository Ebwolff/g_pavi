import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';
import { AppLayout } from '@/components/AppLayout';
import { TrendingUp, AlertCircle, BarChart2, PieChart, FileText, DollarSign, Activity, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AnalyticalDashboardContent } from '@/components/dashboard/AnalyticalDashboardContent';
import { StatsCard } from '@/components/ui/StatsCard';

export function Dashboard() {
    const { profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'performance' | 'analitico'>('performance');

    const { data: stats, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard-stats-main'],
        queryFn: () => statsService.getDashboardStats(),
        refetchInterval: 30000,
        retry: 1,
        enabled: activeTab === 'performance',
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <AppLayout>
            <div className="p-8" style={{ minHeight: '100vh' }}>
                {/* Header & Tabs */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1
                                className="text-2xl font-bold mb-2"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Painel de Controle
                            </h1>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                Visão consolidada da operação e indicadores
                            </p>
                        </div>

                        {/* Tab Switcher - Dark Theme */}
                        <div
                            className="p-1 rounded-xl inline-flex"
                            style={{ background: 'var(--surface)' }}
                        >
                            <button
                                onClick={() => setActiveTab('performance')}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                style={{
                                    background: activeTab === 'performance' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'performance' ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                <BarChart2 className="w-4 h-4" />
                                Performance
                            </button>
                            <button
                                onClick={() => setActiveTab('analitico')}
                                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                                style={{
                                    background: activeTab === 'analitico' ? 'var(--primary)' : 'transparent',
                                    color: activeTab === 'analitico' ? 'white' : 'var(--text-secondary)',
                                }}
                            >
                                <PieChart className="w-4 h-4" />
                                Analítico
                            </button>
                        </div>
                    </div>
                </div>

                {activeTab === 'analitico' ? (
                    <AnalyticalDashboardContent />
                ) : (
                    /* Conteúdo da Aba Performance */
                    <>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="flex flex-col items-center space-y-4">
                                    <div
                                        className="animate-spin rounded-full h-12 w-12 border-b-2"
                                        style={{ borderColor: 'var(--primary)' }}
                                    ></div>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Carregando indicadores...
                                    </p>
                                </div>
                            </div>
                        ) : error ? (
                            <div
                                className="flex items-center justify-center py-20 rounded-xl p-8"
                                style={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border-subtle)'
                                }}
                            >
                                <div className="text-center">
                                    <div
                                        className="p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4"
                                        style={{ background: 'var(--danger-glow)' }}
                                    >
                                        <AlertCircle className="w-8 h-8" style={{ color: 'var(--danger)' }} />
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2"
                                        style={{ color: 'var(--text-primary)' }}
                                    >
                                        Erro ao carregar dashboard
                                    </h3>
                                    <p
                                        className="mb-6 max-w-md mx-auto"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        {(error as Error).message === 'Timeout ao buscar KPIs (45s)'
                                            ? 'A conexão demorou muito para responder.'
                                            : (error as Error).message || 'Não foi possível buscar os dados.'}
                                    </p>
                                    <button
                                        onClick={() => refetch()}
                                        className="px-6 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-all"
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'white'
                                        }}
                                    >
                                        <TrendingUp className="w-4 h-4" />
                                        Tentar Novamente
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* KPI Cards Premium */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    {/* Total OS Abertas */}
                                    <StatsCard
                                        title="Total de OS em Aberto"
                                        value={stats?.osAbertas || 0}
                                        icon={FileText}
                                        color="blue"
                                        trend={{
                                            value: 5,
                                            label: 'novas hoje',
                                            isPositive: true,
                                            isNeutral: true
                                        }}
                                    />

                                    {/* OS Críticas */}
                                    <StatsCard
                                        title="OS Críticas"
                                        value={stats?.osCriticas || 0}
                                        icon={AlertCircle}
                                        color="red"
                                        trend={stats?.osCriticas && stats.osCriticas > 0 ? {
                                            value: stats.osCriticas,
                                            label: 'em risco',
                                            isPositive: false
                                        } : {
                                            value: 0,
                                            label: 'sob controle',
                                            isPositive: true
                                        }}
                                    />

                                    {/* Valor Total */}
                                    <StatsCard
                                        title="Valor Total"
                                        value={formatCurrency(stats?.valorTotal || 0)}
                                        icon={DollarSign}
                                        color="green"
                                        trend={{
                                            value: 8.5,
                                            label: 'vs mês anterior',
                                            isPositive: true
                                        }}
                                    />

                                    {/* Tempo Médio (Substituindo Eficiência por enquanto) */}
                                    <StatsCard
                                        title="Tempo Médio"
                                        value={`${(stats?.tempoMedioResolucao || 0).toFixed(0)}d`}
                                        icon={Clock}
                                        color="violet"
                                        trend={{
                                            value: 2.1,
                                            label: 'dias',
                                            isPositive: true,
                                            isNeutral: true
                                        }}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
