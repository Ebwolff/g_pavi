import { logger } from '@/lib/logger';
/**
 * Painel do Departamento Feramental
 * Dashboard com KPIs, gráficos, frota e vistorias
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Car,
    Plus,
    RefreshCw,
    UserPlus,
    UserMinus,
    Edit,
    Trash2,
    Wrench,
    CheckCircle,
    LayoutDashboard,
    Truck,
    ClipboardCheck,
    AlertTriangle,
    MapPin,
    Gauge,
    ArrowRightLeft,
    Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { ModalCadastrarVeiculo } from '@/components/ui/ModalCadastrarVeiculo';
import { ModalAlocarVeiculo } from '@/components/ui/ModalAlocarVeiculo';
import { BarChartSVG, BarDataItem } from '@/components/charts/BarChartSVG';
import { DonutChartSVG, DonutSegment } from '@/components/charts/DonutChartSVG';
import { frotaService, Veiculo, StatusVeiculo, EstatisticasDashboard } from '@/services/frotaService';

type TabKey = 'painel' | 'frota' | 'vistorias';

const statusConfig: Record<StatusVeiculo, { label: string; color: string; bg: string }> = {
    'DISPONIVEL': { label: 'Disponível', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'EM_USO': { label: 'Em Uso', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'MANUTENCAO': { label: 'Manutenção', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    'INATIVO': { label: 'Inativo', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
};

const statusColors: Record<StatusVeiculo, string> = {
    'DISPONIVEL': '#22c55e',
    'EM_USO': '#3b82f6',
    'MANUTENCAO': '#f59e0b',
    'INATIVO': '#64748b',
};

// Tipo para status de movimentação
type MovStatus = 'ativa' | 'concluida';
const movStatusConfig: Record<MovStatus, { label: string; color: string; bg: string }> = {
    'ativa': { label: 'Em Rota', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'concluida': { label: 'Concluída', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

// ============================================================
// CHECKLIST DE VISTORIA - Itens padrão
// ============================================================
const CHECKLIST_ITEMS = [
    { key: 'pneus', label: 'Pneus (calibragem e desgaste)', icon: '🛞' },
    { key: 'freios', label: 'Sistema de Freios', icon: '🔴' },
    { key: 'oleo', label: 'Nível de Óleo', icon: '🛢️' },
    { key: 'agua', label: 'Nível de Água/Radiador', icon: '💧' },
    { key: 'farois', label: 'Faróis e Lanternas', icon: '💡' },
    { key: 'limpadores', label: 'Limpadores de Parabrisa', icon: '🪟' },
    { key: 'cinto', label: 'Cintos de Segurança', icon: '🔒' },
    { key: 'estepe', label: 'Estepe e Macaco', icon: '🔧' },
    { key: 'documentos', label: 'Documentação (CRLV, Seguro)', icon: '📄' },
    { key: 'limpeza', label: 'Limpeza Interna/Externa', icon: '✨' },
    { key: 'combustivel', label: 'Nível de Combustível', icon: '⛽' },
    { key: 'bateria', label: 'Bateria e Parte Elétrica', icon: '🔋' },
];

export default function PainelFeramental() {
    const [activeTab, setActiveTab] = useState<TabKey>('painel');
    const [loading, setLoading] = useState(true);
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [dashData, setDashData] = useState<EstatisticasDashboard | null>(null);

    // Frota tab state
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
    const [modalAlocacaoOpen, setModalAlocacaoOpen] = useState(false);
    const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<StatusVeiculo | 'TODOS'>('TODOS');

    // Vistorias tab state
    const [vistoriaVeiculo, setVistoriaVeiculo] = useState<string>('');
    const [vistoriaChecks, setVistoriaChecks] = useState<Record<string, boolean>>({});
    const [vistoriaObs, setVistoriaObs] = useState('');

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [veiculosData, dashboard] = await Promise.all([
                frotaService.getVeiculos(),
                frotaService.getEstatisticasDashboard(),
            ]);
            setVeiculos(veiculosData);
            setDashData(dashboard);
        } catch (error) {
            logger.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

    // ============================================================
    // FROTA HANDLERS
    // ============================================================
    const handleCadastrar = () => {
        setVeiculoSelecionado(null);
        setModalCadastroOpen(true);
    };

    const handleEditar = (veiculo: Veiculo) => {
        setVeiculoSelecionado(veiculo);
        setModalCadastroOpen(true);
    };

    const handleAlocar = (veiculo: Veiculo) => {
        setVeiculoSelecionado(veiculo);
        setModalAlocacaoOpen(true);
    };

    const handleDesalocar = async (veiculo: Veiculo) => {
        if (!confirm(`Deseja desalocar o veículo ${veiculo.placa} do técnico ${veiculo.tecnico?.nome_completo}?`)) return;
        try {
            await frotaService.desalocarVeiculo(veiculo.id);
            await carregarDados();
        } catch (error) {
            logger.error('Erro ao desalocar:', error);
            alert('Erro ao desalocar veículo.');
        }
    };

    const handleExcluir = async (veiculo: Veiculo) => {
        if (!confirm(`Tem certeza que deseja excluir o veículo ${veiculo.placa}? Esta ação não pode ser desfeita.`)) return;
        try {
            await frotaService.excluirVeiculo(veiculo.id);
            await carregarDados();
        } catch (error) {
            logger.error('Erro ao excluir:', error);
            alert('Erro ao excluir veículo.');
        }
    };

    const handleAlterarStatus = async (veiculo: Veiculo, novoStatus: StatusVeiculo) => {
        try {
            await frotaService.atualizarVeiculo(veiculo.id, { status: novoStatus });
            await carregarDados();
        } catch (error) {
            logger.error('Erro ao alterar status:', error);
            alert('Erro ao alterar status.');
        }
    };

    const veiculosFiltrados = filtroStatus === 'TODOS'
        ? veiculos
        : veiculos.filter(v => v.status === filtroStatus);

    // ============================================================
    // DASHBOARD DATA
    // ============================================================
    const donutSegments: DonutSegment[] = useMemo(() => {
        if (!dashData) return [];
        const { porStatus } = dashData;
        return [
            { label: 'Disponível', value: porStatus.disponiveis, color: statusColors.DISPONIVEL },
            { label: 'Em Uso', value: porStatus.emUso, color: statusColors.EM_USO },
            { label: 'Manutenção', value: porStatus.manutencao, color: statusColors.MANUTENCAO },
            { label: 'Inativo', value: porStatus.inativos, color: statusColors.INATIVO },
        ].filter(s => s.value > 0);
    }, [dashData]);

    // Mock bar data (custo por período) — substitua por dados reais quando disponível
    const barData: BarDataItem[] = useMemo(() => {
        const dias = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21', '23', '25', '27', '29'];
        return dias.map(d => ({
            label: d,
            value: Math.floor(Math.random() * 350 + 80),
        }));
    }, []);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr; }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const initialsColors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

    // ============================================================
    // TABS CONFIG
    // ============================================================
    const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [
        { key: 'painel', label: 'Painel', icon: LayoutDashboard },
        { key: 'frota', label: 'Frota', icon: Truck },
        { key: 'vistorias', label: 'Vistorias', icon: ClipboardCheck },
    ];

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                <Car className="w-8 h-8 text-emerald-500" />
                            </div>
                            Ferramental & Frota
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-1 ml-1">
                            Painel de controle — Veículos, vistorias e alocações
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeTab === 'frota' && (
                            <Button
                                variant="primary"
                                onClick={handleCadastrar}
                                leftIcon={<Plus className="w-4 h-4" />}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                            >
                                Cadastrar Veículo
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            onClick={carregarDados}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                            className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                        >
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 bg-[var(--surface-light)] rounded-xl border border-white/5 w-fit">
                    {tabs.map(tab => {
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.key
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-[var(--text-muted)] hover:bg-white/5'
                                    }`}
                            >
                                <TabIcon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ========== TAB: PAINEL ========== */}
                {activeTab === 'painel' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card
                                title="Veículos em Rota"
                                value={dashData?.porStatus.emUso ?? 0}
                                icon={Truck}
                                color="blue"
                                priority={1}
                                subtitle={`${dashData?.porStatus.total ?? 0} na frota total`}
                            />
                            <Card
                                title="Disponíveis"
                                value={dashData?.porStatus.disponiveis ?? 0}
                                icon={CheckCircle}
                                color="emerald"
                                priority={2}
                                subtitle="Prontos para alocação"
                            />
                            <Card
                                title="Alertas de Manutenção"
                                value={dashData?.porStatus.manutencao ?? 0}
                                icon={AlertTriangle}
                                color={(dashData?.porStatus.manutencao ?? 0) > 0 ? 'rose' : 'blue'}
                                priority={3}
                                subtitle={(dashData?.porStatus.manutencao ?? 0) > 0 ? 'Ação necessária' : 'Tudo OK'}
                            />
                            <Card
                                title="Movimentações Hoje"
                                value={dashData?.movHoje ?? 0}
                                icon={ArrowRightLeft}
                                color="amber"
                                priority={4}
                                subtitle={`${dashData?.kmRodado.toLocaleString('pt-BR') ?? 0} km rodados`}
                            />
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Bar Chart */}
                            <div className="lg:col-span-2">
                                {loading ? (
                                    <Skeleton className="h-[300px] w-full rounded-3xl" />
                                ) : (
                                    <BarChartSVG
                                        data={barData}
                                        height={260}
                                        barColor="#22c55e"
                                        barColorEnd="#15803d"
                                        title="Custo Médio de Frota por O.S."
                                        subtitle="Últimos 30 dias"
                                        unit="R$"
                                    />
                                )}
                            </div>

                            {/* Donut Chart */}
                            {loading ? (
                                <Skeleton className="h-[300px] w-full rounded-3xl" />
                            ) : (
                                <DonutChartSVG
                                    segments={donutSegments}
                                    size={160}
                                    strokeWidth={18}
                                    centerValue={`${dashData?.porStatus.total ?? 0}`}
                                    centerLabel="Veículos"
                                    title="Distribuição da Frota"
                                    subtitle="Por status atual"
                                />
                            )}
                        </div>

                        {/* Movimentações Table */}
                        <div className="glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                                        Últimas Movimentações de Frota
                                    </h3>
                                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Registros recentes de entrada/saída</p>
                                </div>
                                <button
                                    onClick={() => setActiveTab('frota')}
                                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                                >
                                    Ver Frota
                                </button>
                            </div>

                            {loading ? (
                                <Skeleton className="h-[200px] w-full rounded-2xl" />
                            ) : !dashData?.movimentacoes?.length ? (
                                <EmptyState
                                    icon={ArrowRightLeft}
                                    title="Sem movimentações"
                                    description="Nenhuma movimentação de frota registrada ainda."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[var(--border-subtle)]">
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">Técnico</th>
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">Veículo (Placa)</th>
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">Data Saída</th>
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">KM Saída</th>
                                                <th className="text-left px-4 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashData.movimentacoes.map((mov, idx) => {
                                                const status: MovStatus = mov.data_fim ? 'concluida' : 'ativa';
                                                const sConf = movStatusConfig[status];
                                                const tecNome = mov.tecnico?.nome_completo || 'Sem técnico';
                                                const veicInfo = mov.veiculo;

                                                return (
                                                    <tr
                                                        key={mov.id}
                                                        className="border-b border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div
                                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                                                                    style={{ background: initialsColors[idx % initialsColors.length] }}
                                                                >
                                                                    {getInitials(tecNome)}
                                                                </div>
                                                                <span className="font-bold text-[var(--text-primary)] text-xs truncate">{tecNome}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                                                            {veicInfo ? (
                                                                <>
                                                                    {veicInfo.marca} {veicInfo.modelo}{' '}
                                                                    <span className="font-mono text-[var(--text-muted)] text-[10px]">({veicInfo.placa})</span>
                                                                </>
                                                            ) : '—'}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                                                            {formatDate(mov.data_inicio)}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                                                            {mov.km_inicio?.toLocaleString('pt-BR') ?? '—'} km
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sConf.bg} ${sConf.color}`}>
                                                                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                                {sConf.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== TAB: FROTA ========== */}
                {activeTab === 'frota' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* KPIs Frota */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <Card title="Total" value={dashData?.porStatus.total ?? 0} icon={Car} color="blue" priority={1} />
                            <Card title="Disponíveis" value={dashData?.porStatus.disponiveis ?? 0} icon={CheckCircle} color="emerald" priority={2} />
                            <Card title="Em Uso" value={dashData?.porStatus.emUso ?? 0} icon={Truck} color="blue" priority={3} />
                            <Card title="Manutenção" value={dashData?.porStatus.manutencao ?? 0} icon={Wrench} color="amber" priority={4} />
                            <Card title="Inativos" value={dashData?.porStatus.inativos ?? 0} icon={AlertTriangle} color="gray" priority={5} />
                        </div>

                        {/* Filtros */}
                        <div className="flex gap-2 flex-wrap">
                            {['TODOS', 'DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'INATIVO'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFiltroStatus(status as any)}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filtroStatus === status
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-[var(--surface-light)] text-[var(--text-muted)] hover:bg-white/10 border border-[var(--border-subtle)]'
                                        }`}
                                >
                                    {status === 'TODOS' ? 'Todos' : statusConfig[status as StatusVeiculo]?.label || status}
                                </button>
                            ))}
                        </div>

                        {/* Lista de Veículos */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-emerald-500" />
                                Veículos ({veiculosFiltrados.length})
                            </h3>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-[250px] w-full rounded-2xl" />
                                    ))}
                                </div>
                            ) : veiculosFiltrados.length === 0 ? (
                                <EmptyState
                                    icon={Car}
                                    title="Nenhum veículo encontrado"
                                    description={filtroStatus === 'TODOS' ? 'Cadastre o primeiro veículo da frota.' : 'Nenhum veículo com este status.'}
                                />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {veiculosFiltrados.map((veiculo) => {
                                        const statusInfo = statusConfig[veiculo.status];
                                        return (
                                            <div
                                                key={veiculo.id}
                                                className="glass-card-enterprise p-5 rounded-2xl border border-[var(--border-subtle)] hover:bg-white/[0.04] transition-all group"
                                            >
                                                {/* Header */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <span className="text-lg font-mono font-black text-[var(--text-primary)] bg-[var(--surface-light)] px-3 py-1 rounded border border-[var(--border-subtle)]">
                                                            {veiculo.placa}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${statusInfo.bg} ${statusInfo.color}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>

                                                {/* Info do Veículo */}
                                                <div className="space-y-2 mb-4">
                                                    <h4 className="text-base font-bold text-[var(--text-primary)]">
                                                        {veiculo.marca} {veiculo.modelo}
                                                    </h4>
                                                    <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                                                        {veiculo.ano && <span>Ano: {veiculo.ano}</span>}
                                                        {veiculo.cor && <span>Cor: {veiculo.cor}</span>}
                                                    </div>
                                                    <div className="text-sm flex items-center gap-1">
                                                        <Gauge className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                                        <span className="text-[var(--text-muted)]">Km: </span>
                                                        <span className="font-bold text-[var(--text-primary)]">
                                                            {veiculo.km_atual?.toLocaleString('pt-BR')} km
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Técnico Alocado */}
                                                {veiculo.tecnico ? (
                                                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-4">
                                                        <p className="text-xs text-blue-400 mb-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> Técnico Alocado
                                                        </p>
                                                        <p className="text-sm font-bold text-[var(--text-primary)]">
                                                            {veiculo.tecnico.nome_completo}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-[var(--surface-light)] rounded-xl border border-[var(--border-subtle)] mb-4">
                                                        <p className="text-xs text-[var(--text-muted)]">Sem técnico alocado</p>
                                                    </div>
                                                )}

                                                {/* Ações */}
                                                <div className="flex gap-2 flex-wrap">
                                                    {veiculo.status === 'DISPONIVEL' && (
                                                        <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => handleAlocar(veiculo)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            Alocar
                                                        </Button>
                                                    )}
                                                    {veiculo.status === 'EM_USO' && veiculo.tecnico && (
                                                        <Button variant="secondary" size="sm" leftIcon={<UserMinus className="w-3.5 h-3.5" />} onClick={() => handleDesalocar(veiculo)}>
                                                            Desalocar
                                                        </Button>
                                                    )}
                                                    {veiculo.status !== 'MANUTENCAO' && veiculo.status !== 'EM_USO' && (
                                                        <Button variant="secondary" size="sm" leftIcon={<Wrench className="w-3.5 h-3.5" />} onClick={() => handleAlterarStatus(veiculo, 'MANUTENCAO')}>
                                                            Manutenção
                                                        </Button>
                                                    )}
                                                    {veiculo.status === 'MANUTENCAO' && (
                                                        <Button variant="secondary" size="sm" leftIcon={<CheckCircle className="w-3.5 h-3.5" />} onClick={() => handleAlterarStatus(veiculo, 'DISPONIVEL')}>
                                                            Liberar
                                                        </Button>
                                                    )}
                                                    <Button variant="secondary" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />} onClick={() => handleEditar(veiculo)}>
                                                        Editar
                                                    </Button>
                                                    <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleExcluir(veiculo)} className="hover:bg-rose-500/10">
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== TAB: VISTORIAS ========== */}
                {activeTab === 'vistorias' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Nova Vistoria */}
                            <div className="glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                                    Nova Vistoria
                                </h3>

                                {/* Seletor de veículo */}
                                <div className="mb-5">
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                        Veículo
                                    </label>
                                    <select
                                        value={vistoriaVeiculo}
                                        onChange={(e) => setVistoriaVeiculo(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-sm font-medium outline-none focus:border-emerald-500/50 transition-colors"
                                    >
                                        <option value="">Selecione um veículo...</option>
                                        {veiculos.map(v => (
                                            <option key={v.id} value={v.id}>
                                                {v.placa} — {v.marca} {v.modelo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Checklist */}
                                <div className="space-y-2 mb-5 max-h-[350px] overflow-y-auto pr-2 scrollbar-visao360">
                                    {CHECKLIST_ITEMS.map(item => (
                                        <label
                                            key={item.key}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${vistoriaChecks[item.key]
                                                ? 'bg-emerald-500/10 border-emerald-500/20'
                                                : 'bg-[var(--surface-light)] border-[var(--border-subtle)] hover:bg-white/[0.04]'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={!!vistoriaChecks[item.key]}
                                                onChange={() => setVistoriaChecks(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${vistoriaChecks[item.key]
                                                ? 'bg-emerald-500 border-emerald-500'
                                                : 'border-[var(--border-subtle)]'
                                                }`}>
                                                {vistoriaChecks[item.key] && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <span className="text-base mr-1">{item.icon}</span>
                                            <span className={`text-sm font-medium ${vistoriaChecks[item.key] ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
                                                {item.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {/* Observações */}
                                <div className="mb-5">
                                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                        Observações
                                    </label>
                                    <textarea
                                        value={vistoriaObs}
                                        onChange={(e) => setVistoriaObs(e.target.value)}
                                        placeholder="Observações adicionais..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500/50 resize-none transition-colors"
                                    />
                                </div>

                                {/* Progresso */}
                                <div className="mb-5">
                                    <div className="flex justify-between text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">
                                        <span>Progresso do Checklist</span>
                                        <span className="text-emerald-400">
                                            {Object.values(vistoriaChecks).filter(Boolean).length}/{CHECKLIST_ITEMS.length}
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-[var(--surface-light)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-[1px]">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] transition-all duration-500"
                                            style={{
                                                width: `${(Object.values(vistoriaChecks).filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                                    leftIcon={<ClipboardCheck className="w-4 h-4" />}
                                    disabled={!vistoriaVeiculo || Object.values(vistoriaChecks).filter(Boolean).length === 0}
                                    onClick={() => {
                                        alert('Vistoria registrada com sucesso! (integração com banco será adicionada em breve)');
                                        setVistoriaChecks({});
                                        setVistoriaObs('');
                                        setVistoriaVeiculo('');
                                    }}
                                >
                                    Registrar Vistoria
                                </Button>
                            </div>

                            {/* Info / Resumo */}
                            <div className="space-y-6">
                                {/* Status card */}
                                <div className="glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Eye className="w-5 h-5 text-amber-500" />
                                        Resumo de Vistorias
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pendentes Hoje</span>
                                                <span className="text-2xl font-black text-amber-400">
                                                    {veiculos.filter(v => v.status === 'EM_USO').length}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)]">
                                                Veículos em uso que necessitam vistoria de retorno
                                            </p>
                                        </div>

                                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Concluídas (Mês)</span>
                                                <span className="text-2xl font-black text-emerald-400">0</span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)]">
                                                Vistorias realizadas neste mês
                                            </p>
                                        </div>

                                        <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Itens Reprovados</span>
                                                <span className="text-2xl font-black text-rose-400">0</span>
                                            </div>
                                            <p className="text-[10px] text-[var(--text-muted)]">
                                                Itens que precisam de atenção
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Itens do checklist info */}
                                <div className="glass-card-enterprise p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <ClipboardCheck className="w-4 h-4 text-blue-500" />
                                        Itens da Vistoria
                                    </h3>
                                    <p className="text-xs text-[var(--text-muted)] mb-4">
                                        O checklist de vistoria verifica {CHECKLIST_ITEMS.length} itens essenciais
                                        de segurança e funcionamento do veículo antes da saída.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CHECKLIST_ITEMS.map(item => (
                                            <div key={item.key} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] p-2 bg-[var(--surface-light)] rounded-lg border border-[var(--border-subtle)]">
                                                <span>{item.icon}</span>
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modais */}
            <ModalCadastrarVeiculo
                isOpen={modalCadastroOpen}
                onClose={() => {
                    setModalCadastroOpen(false);
                    setVeiculoSelecionado(null);
                }}
                veiculo={veiculoSelecionado}
                onSuccess={carregarDados}
            />

            <ModalAlocarVeiculo
                isOpen={modalAlocacaoOpen}
                onClose={() => {
                    setModalAlocacaoOpen(false);
                    setVeiculoSelecionado(null);
                }}
                veiculo={veiculoSelecionado}
                onSuccess={carregarDados}
            />
        </AppLayout>
    );
}
