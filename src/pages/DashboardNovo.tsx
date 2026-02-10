
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { statsService, DashboardStats } from '../services/statsService';
// relatoriosService import removed (no longer used after handleGerarRelatorio cleanup)
import { Card, MiniCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    TendenciaChart,
    DistribuicaoStatusChart,
    ConsultorPerformanceChart,
    UrgenciaDistributionChart,
} from '../components/ui/Charts';
import {
    TrendingUp,
    DollarSign,
    Clock,
    AlertCircle,
    FileText,
    Download,
    RefreshCw,
    Search,
    Users,
    Wrench,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { formatarValor } from '../utils/osHelpers';

export function DashboardNovo() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [tendencia, setTendencia] = useState<any[]>([]);
    const [distribuicao, setDistribuicao] = useState<any[]>([]);
    const [consultores, setConsultores] = useState<any[]>([]);
    const [_topClientes, setTopClientes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [_atualizando, setAtualizando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('mes');

    const carregarDados = async () => {
        console.log('🔄 Iniciando carregamento de dados...');
        setErro(null);
        setAtualizando(true);

        // Safety timeout: Se demorar mais de 15s, mostrar dados vazios
        const safetyTimeout = setTimeout(() => {
            console.warn('⚠️ Safety timeout atingido - forçando fim do loading');
            setLoading(false);
            setAtualizando(false);
        }, 15000);

        try {
            // Carregar cada serviço individualmente para não travar tudo
            try {
                console.log('📊 Buscando dashboard stats...');
                const statsData = await statsService.getDashboardStats();
                console.log('✅ Stats recebidos:', statsData);
                setStats(statsData);
            } catch (e: any) {
                console.error('❌ Erro em getDashboardStats:', e);
                setErro(e.message || 'Erro ao carregar estatísticas');
                setLoading(false);
                setAtualizando(false);
                return; // Parar execução se o principal falhar
            }

            try {
                console.log('📈 Buscando tendência...');
                const tendenciaData = await statsService.getTendenciaOS(30);
                console.log('✅ Tendência recebida');
                setTendencia(tendenciaData);
            } catch (e) {
                console.error('❌ Erro em getTendenciaOS:', e);
            }

            try {
                console.log('📊 Buscando distribuição...');
                const distribuicaoData = await statsService.getDistribuicaoStatus();
                console.log('✅ Distribuição recebida');
                setDistribuicao(distribuicaoData);
            } catch (e) {
                console.error('❌ Erro em getDistribuicaoStatus:', e);
            }

            try {
                console.log('👥 Buscando consultores...');
                const consultoresData = await statsService.getConsultorPerformance();
                console.log('✅ Consultores recebidos');
                setConsultores(consultoresData);
            } catch (e) {
                console.error('❌ Erro em getConsultorPerformance:', e);
            }

            try {
                console.log('🏆 Buscando top clientes...');
                const clientesData = await statsService.getTopClientes(10);
                console.log('✅ Clientes recebidos');
                setTopClientes(clientesData);
            } catch (e) {
                console.error('❌ Erro em getTopClientes:', e);
            }

            console.log('✅ Todos os dados processados!');
        } catch (error: any) {
            console.error('❌ Erro geral ao carregar dashboard:', error);
            setErro('generico');
        } finally {
            clearTimeout(safetyTimeout);
            setLoading(false);
            setAtualizando(false);
            console.log('🏁 Carregamento finalizado');
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    // const handleGerarRelatorio = ... (removed unused function)

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

    if (erro) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
                    <p className="text-gray-600 mb-6">
                        {erro === 'generico'
                            ? 'Ocorreu um erro ao conectar com o servidor. Por favor, tente novamente.'
                            : erro}
                    </p>
                    <button
                        onClick={carregarDados}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar Novamente
                    </button>
                    {!erro.includes('Timeout') && (
                        <p className="mt-4 text-xs text-gray-400">
                            Dica: Se o erro persistir, tente sair e entrar novamente no sistema.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text">
                                Visão Geral
                            </span>
                        </h1>
                        <p className="text-gray-400 mt-1">Monitoramento em tempo real da performance da oficina</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="glass-card-enterprise px-1 p-1 rounded-lg flex items-center gap-1">
                            {['hoje', 'semana', 'mes'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${dateRange === range
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {range.charAt(0).toUpperCase() + range.slice(1)}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="primary"
                            onClick={carregarDados}
                            leftIcon={<Search className="w-4 h-4" />}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => { }}
                            leftIcon={<Download className="w-4 h-4" />}
                        >
                            Exportar
                        </Button>
                    </div>
                </div>

                {/* KPI Grid - Top Tier */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Faturamento Total"
                        value={formatarValor(stats?.valorTotal || 0)}
                        icon={DollarSign}
                        color="green"
                        trend={{ value: 12.5, isPositive: true, label: "vs. mês anterior" }}
                        priority={1}
                        anchor={{ label: "Meta Mensal", value: formatarValor(200000) }}
                    />
                    <Card
                        title="Ticket Médio"
                        value={formatarValor(stats?.valorMedioOS || 0)}
                        icon={TrendingUp}
                        color="blue"
                        trend={{ value: 5.2, isPositive: true, label: "vs. mês anterior" }}
                        priority={2}
                    />
                    <Card
                        title="OS em Aberto"
                        value={stats?.osAbertas || 0}
                        icon={FileText}
                        color="amber"
                        subtitle={`${stats?.totalPendencias || 0} pendências`}
                        priority={3}
                        onClick={() => navigate('/os/lista')}
                    />
                    <Card
                        title="Tempo Médio (TMA)"
                        value={`${stats?.tempoMedioResolucao ? Math.round(stats.tempoMedioResolucao) : 0} dias`}
                        icon={Clock}
                        color="violet"
                        trend={{ value: -10, isPositive: true, label: "Melhora de 10%" }}
                        priority={4}
                    />
                </div>

                {/* Second Row: Charts & Detailed Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-card-enterprise p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                    Tendência de Faturamento
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <TendenciaChart data={tendencia || []} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-500" />
                                    Top Consultores
                                </h3>
                                <div className="h-[250px]">
                                    <ConsultorPerformanceChart data={consultores || []} />
                                </div>
                            </div>
                            <div className="glass-card-enterprise p-6 rounded-2xl">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                    Distribuição de Urgência
                                </h3>
                                <div className="h-[250px]">
                                    <UrgenciaDistributionChart
                                        criticas={stats?.osCriticas || 0}
                                        altas={stats?.osAltas || 0}
                                        medias={stats?.osMedias || 0}
                                        normais={stats?.osNormais || 0}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Status & Mini KPIs */}
                    <div className="space-y-6">
                        {/* OS Status Distribution */}
                        <div className="glass-card-enterprise p-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-white mb-6">Status das OS</h3>
                            <div className="h-[250px] mb-4">
                                <DistribuicaoStatusChart data={distribuicao || []} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <MiniCard
                                    label="Em Execução"
                                    value={stats?.osAbertas || 0}
                                    color="blue"
                                    icon={Wrench}
                                />
                                <MiniCard
                                    label="Pendências"
                                    value={stats?.pendenciasAbertas || 0}
                                    color="orange"
                                    icon={AlertCircle}
                                />
                                <MiniCard
                                    label="Concluídas"
                                    value={stats?.osConcluidas || 0}
                                    color="green"
                                    icon={CheckCircle}
                                />
                                <MiniCard
                                    label="Canceladas"
                                    value={stats?.osCanceladas || 0}
                                    color="red"
                                    icon={AlertCircle}
                                />
                            </div>
                        </div>

                        {/* Recent Activity / Pipeline summary */}
                        <div className="glass-card-enterprise p-6 rounded-2xl">
                            <h3 className="text-lg font-semibold text-white mb-4">Eficiência Operacional</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-gray-400">Taxa de Conversão</span>
                                    <span className="text-lg font-bold text-green-400">85%</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-gray-400">Satisfação (NPS)</span>
                                    <span className="text-lg font-bold text-blue-400">92</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                                    <span className="text-sm text-gray-400">Retorno em Garantia</span>
                                    <span className="text-lg font-bold text-green-400">1.2%</span>
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <Button variant="ghost" className="w-full text-sm text-blue-400 hover:text-blue-300">
                                    Ver Relatório Completo <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
