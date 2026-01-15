import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService, DashboardStats } from '@/services/statsService';
import { relatoriosService } from '@/services/relatoriosService';
import {
    TendenciaChart,
    DistribuicaoStatusChart,
    ConsultorPerformanceChart,
    TopClientesChart,
    UrgenciaDistributionChart,
} from '@/components/ui/Charts';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/Button';
import { formatarValor } from '@/utils/osHelpers';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertCircle, FileText, Download, RefreshCw, Layers, Clock } from 'lucide-react';

export function AnalyticalDashboardContent() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tendencia, setTendencia] = useState<any[]>([]);
    const [distribuicao, setDistribuicao] = useState<any[]>([]);
    const [consultores, setConsultores] = useState<any[]>([]);
    const [topClientes, setTopClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const carregarDados = async () => {
        console.log('🔄 Iniciando carregamento de dados (Analítico)...');
        setErro(null);
        setAtualizando(true);

        const safetyTimeout = setTimeout(() => {
            console.warn('⚠️ Safety timeout atingido - forçando fim do loading');
            setLoading(false);
            setAtualizando(false);
        }, 15000);

        try {
            try {
                const statsData = await statsService.getDashboardStats();
                setStats(statsData);
            } catch (e: any) {
                console.error('❌ Erro em getDashboardStats:', e);
                setErro(e.message || 'Erro ao carregar estatísticas');
                setLoading(false);
                setAtualizando(false);
                return;
            }

            try {
                const tendenciaData = await statsService.getTendenciaOS(30);
                setTendencia(tendenciaData);
            } catch (e) {
                console.error('❌ Erro em getTendenciaOS:', e);
            }

            try {
                const distribuicaoData = await statsService.getDistribuicaoStatus();
                setDistribuicao(distribuicaoData);
            } catch (e) {
                console.error('❌ Erro em getDistribuicaoStatus:', e);
            }

            try {
                const consultoresData = await statsService.getConsultorPerformance();
                setConsultores(consultoresData);
            } catch (e) {
                console.error('❌ Erro em getConsultorPerformance:', e);
            }

            try {
                const clientesData = await statsService.getTopClientes(10);
                setTopClientes(clientesData);
            } catch (e) {
                console.error('❌ Erro em getTopClientes:', e);
            }

        } catch (error: any) {
            console.error('❌ Erro geral ao carregar dashboard:', error);
            setErro('generico');
        } finally {
            clearTimeout(safetyTimeout);
            setLoading(false);
            setAtualizando(false);
            setLastUpdate(new Date());
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
            <div className="enterprise-dark p-6 relative z-10 animate-fadeIn">
                <div className="max-w-[1800px] mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div className="glass-card-enterprise p-5 rounded-xl">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton width={200} height={28} />
                                <Skeleton width={300} height={16} />
                            </div>
                            <div className="flex gap-3">
                                <Skeleton width={100} height={40} />
                                <Skeleton width={120} height={40} />
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} height={140} className="rounded-xl" />
                        ))}
                    </div>

                    {/* Charts Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Skeleton height={350} className="rounded-xl" />
                        <Skeleton height={350} className="rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="enterprise-dark min-h-[60vh] flex items-center justify-center p-6">
                <EmptyState
                    icon={AlertCircle}
                    title="Ops! Algo deu errado"
                    description={erro === 'generico' ? 'Não conseguimos carregar os dados do painel analítico. Por favor, tente novamente.' : erro}
                    action={{
                        label: 'Tentar Novamente',
                        onClick: carregarDados,
                        icon: RefreshCw
                    }}
                    className="glass-card-enterprise p-12 rounded-2xl max-w-lg"
                />
            </div>
        );
    }

    return (
        <div className="enterprise-dark p-6 relative z-10">
            <div className="max-w-[1800px] mx-auto space-y-6">

                {/* Enterprise Header */}
                <div className="glass-card-enterprise p-5 rounded-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-white tracking-tight">
                                    Painel Analítico
                                </h1>
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                                    Live
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                Indicadores de performance em tempo real
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {lastUpdate && (
                                <span className="text-xs text-gray-500 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Atualizado às {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                            <Button
                                onClick={carregarDados}
                                isLoading={atualizando}
                                variant="secondary"
                                leftIcon={<RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />}
                            >
                                Atualizar
                            </Button>
                            <Button
                                onClick={() => navigate('/relatorios')}
                                variant="primary"
                                leftIcon={<FileText className="w-4 h-4" />}
                            >
                                Relatórios
                            </Button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards Grid - Premium Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* Total de OS */}
                    <StatsCard
                        title="Total de OS"
                        value={stats?.totalOS || 0}
                        icon={FileText}
                        color="blue"
                        onClick={() => navigate('/os/lista')}
                        trend={{
                            value: stats?.osAbertas || 0,
                            label: 'em aberto',
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
                        onClick={() => navigate('/os/lista?status=critica')}
                        trend={stats?.osCriticas && stats.osCriticas > 0 ? {
                            value: stats.osCriticas,
                            label: 'precisa atenção',
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
                        value={stats?.valorTotal ? formatarValor(stats.valorTotal) : 'R$ 0,00'}
                        icon={Layers}
                        color="green"
                        trend={{
                            value: 12,
                            label: 'vs mês anterior',
                            isPositive: true
                        }}
                    />

                    {/* Tempo Médio */}
                    <StatsCard
                        title="Tempo Médio"
                        value={`${(stats?.tempoMedioResolucao || 0).toFixed(0)}d`}
                        icon={Clock}
                        color="violet"
                        trend={(stats?.tempoMedioResolucao || 0) <= 5 ? {
                            value: -15,
                            label: 'dentro da meta',
                            isPositive: true
                        } : {
                            value: ((stats?.tempoMedioResolucao || 0) - 5),
                            label: 'dias acima da meta',
                            isPositive: false
                        }}
                    />
                </div>


                {/* Quick Stats Bar */}
                <div className="glass-card-enterprise p-4 rounded-xl">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-gray-400">Normal:</span>
                                <span className="text-lg font-bold text-white">{stats?.osNormal || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                                <span className="text-sm text-gray-400">Garantia:</span>
                                <span className="text-lg font-bold text-white">{stats?.osGarantia || 0}</span>
                            </div>
                        </div>

                        <div className="hidden lg:block w-px h-8 bg-gray-700"></div>

                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-400" />
                                <span className="text-sm text-gray-400">Pendências:</span>
                                <span className="text-lg font-bold text-amber-400">{stats?.pendenciasAbertas || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                                <span className="text-sm text-gray-400">Alertas:</span>
                                <span className="text-lg font-bold text-orange-400">{stats?.alertasNaoLidos || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Distribuição por Urgência */}
                    <div className="glass-card-enterprise p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Status</h3>
                        <UrgenciaDistributionChart
                            criticas={stats?.osCriticas || 0}
                            altas={stats?.osAltas || 0}
                            medias={stats?.osMedias || 0}
                            normais={stats?.osNormais || 0}
                        />
                    </div>

                    {/* Distribuição Status Geral */}
                    {distribuicao.length > 0 && (
                        <div className="glass-card-enterprise p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Status das OS</h3>
                            <DistribuicaoStatusChart data={distribuicao} />
                        </div>
                    )}
                </div>

                {/* Tendência */}
                {tendencia.length > 0 && (
                    <div className="glass-card-enterprise p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Tendência de OS (30 dias)</h3>
                        <TendenciaChart data={tendencia} />
                    </div>
                )}

                {/* Performance e Top Clientes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {consultores.length > 0 && (
                        <div className="glass-card-enterprise p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Performance Consultores</h3>
                            <ConsultorPerformanceChart data={consultores} />
                        </div>
                    )}
                    {topClientes.length > 0 && (
                        <div className="glass-card-enterprise p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Clientes</h3>
                            <TopClientesChart data={topClientes} />
                        </div>
                    )}
                </div>

                {/* Ações Rápidas */}
                <div className="glass-card-enterprise p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Download className="w-5 h-5 text-gray-400" />
                        Gerar Relatórios Rápidos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => handleGerarRelatorio('garantia')}
                            className="stat-card-premium stat-card-violet text-left"
                        >
                            <h4 className="font-medium text-white mb-1">Garantia</h4>
                            <p className="text-xs text-gray-400">Análise detalhada de garantias</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('performance')}
                            className="stat-card-premium stat-card-blue text-left"
                        >
                            <h4 className="font-medium text-white mb-1">Performance</h4>
                            <p className="text-xs text-gray-400">Ranking de consultores</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('aging')}
                            className="stat-card-premium stat-card-amber text-left"
                        >
                            <h4 className="font-medium text-white mb-1">Aging</h4>
                            <p className="text-xs text-gray-400">Envelhecimento de OS</p>
                        </button>

                        <button
                            onClick={() => handleGerarRelatorio('previsao')}
                            className="stat-card-premium stat-card-emerald text-left"
                        >
                            <h4 className="font-medium text-white mb-1">Previsão</h4>
                            <p className="text-xs text-gray-400">Análise de prazos</p>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
