import { AlertCircle, FileText, DollarSign, Clock } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { AnalyticalDashboardContent } from '@/components/dashboard/AnalyticalDashboardContent';
import { StatsCard } from '@/components/ui/StatsCard';
import { PipelineOS } from '@/components/dashboard/PipelineOS';
import { useDashboard } from '@/hooks/useDashboard';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { motion } from 'framer-motion';

export function Dashboard() {
    const {
        activeTab,
        setActiveTab,
        stats,
        isLoading,
        error,
        refetch
    } = useDashboard();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <AppLayout>
            <div className="p-8" style={{ minHeight: '100vh' }}>
                <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

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
                        ) : (
                            <>
                                {/* Aviso de erro (se houver) */}
                                {error && (
                                    <div
                                        className="mb-4 p-3 rounded-lg flex items-center justify-between"
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-red-400" />
                                            <span className="text-sm text-red-400">
                                                Erro ao atualizar dados. Mostrando última versão disponível.
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => refetch()}
                                            className="text-xs px-3 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                )}

                                {/* KPI Cards Premium with Animation */}
                                <motion.div
                                    variants={container}
                                    initial="hidden"
                                    animate="show"
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                                >
                                    {/* Total OS Abertas */}
                                    <motion.div variants={item}>
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
                                    </motion.div>

                                    {/* OS Críticas */}
                                    <motion.div variants={item}>
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
                                    </motion.div>

                                    {/* Valor Total */}
                                    <motion.div variants={item}>
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
                                    </motion.div>

                                    {/* Tempo Médio */}
                                    <motion.div variants={item}>
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
                                    </motion.div>
                                </motion.div>

                                {/* Pipeline de Processos */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <PipelineOS />
                                </motion.div>
                            </>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
