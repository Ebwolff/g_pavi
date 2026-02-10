import { useState, useEffect } from 'react';
import {
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    DollarSign,
    TrendingUp,
    RefreshCw,
    Plus,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { StatusOS, TipoOS } from '@/types/database.types';
import { Badge } from '@/components/cognitive-bias';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

// Helper para formatar valor
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface OSDoConsultor {
    id: string;
    numero_os: string;
    tipo_os: TipoOS;
    status_atual: StatusOS;
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    data_abertura: string;
    valor_liquido_total: number;
    dias_em_aberto: number;
}

const statusLabels: Record<StatusOS, string> = {
    'EM_EXECUCAO': 'Em Execução',
    'AGUARDANDO_PECAS': 'Aguardando Peças',
    'AGUARDANDO_APROVACAO_ORCAMENTO': 'Aguardando Orçamento',
    'AGUARDANDO_PAGAMENTO': 'Aguardando Pagamento',
    'EM_DIAGNOSTICO': 'Em Diagnóstico',
    'EM_TRANSITO': 'Em Trânsito',
    'PAUSADA': 'Pausada',
    'CONCLUIDA': 'Concluída',
    'FATURADA': 'Faturada',
    'CANCELADA': 'Cancelada',
};

export default function PainelConsultor() {
    const navigate = useNavigate();
    const [osList, setOsList] = useState<OSDoConsultor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<StatusOS | 'ABERTAS' | ''>('ABERTAS');
    const [estatisticas, setEstatisticas] = useState({
        totalOS: 0,
        osAbertas: 0,
        osConcluidas: 0,
        valorAberto: 0,
        valorFaturado: 0,
        osCriticas: 0,
    });

    // Carregar OS do consultor
    const carregarDados = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('ordens_servico')
                .select('*')
                .order('data_abertura', { ascending: false });

            if (filtroStatus === 'ABERTAS') {
                query = query.not('status_atual', 'in', '("CONCLUIDA","FATURADA","CANCELADA")');
            } else if (filtroStatus) {
                query = query.eq('status_atual', filtroStatus);
            }

            const { data, error } = await query;
            if (error) throw error;

            const osComDias = (data || []).map((os: any) => ({
                ...os,
                dias_em_aberto: Math.floor(
                    (Date.now() - new Date(os.data_abertura).getTime()) / (1000 * 60 * 60 * 24)
                ),
            })) as OSDoConsultor[];

            setOsList(osComDias);

            const todasOS = data || [];
            const abertas = todasOS.filter((o: any) => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const concluidas = todasOS.filter((o: any) => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));

            const limite60Dias = new Date();
            limite60Dias.setDate(limite60Dias.getDate() - 60);
            const criticas = abertas.filter((o: any) => new Date(o.data_abertura) < limite60Dias);

            setEstatisticas({
                totalOS: todasOS.length,
                osAbertas: abertas.length,
                osConcluidas: concluidas.length,
                valorAberto: abertas.reduce((sum: number, o: any) => sum + (o.valor_liquido_total || 0), 0),
                valorFaturado: todasOS
                    .filter((o: any) => o.status_atual === 'FATURADA')
                    .reduce((sum: number, o: any) => sum + (o.valor_liquido_total || 0), 0),
                osCriticas: criticas.length,
            });

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [filtroStatus]);

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Users className="w-8 h-8 text-blue-500" />
                            </div>
                            Painel do Consultor
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Gestão de carteira e fluxo de ordens de serviço</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            onClick={() => navigate('/os/nova')}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            Nova OS
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={carregarDados}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Achivement Badges */}
                {estatisticas.totalOS > 0 && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Top Performer - 95%+ no prazo */}
                        {estatisticas.osConcluidas > 0 &&
                            (estatisticas.osConcluidas / estatisticas.totalOS) >= 0.95 && (
                                <Badge
                                    type="gold"
                                    title="Top Performer"
                                    description="95%+ OS concluídas no prazo"
                                    icon="trophy"
                                />
                            )}

                        {/* Alto Faturamento */}
                        {estatisticas.valorFaturado >= 50000 && (
                            <Badge
                                type="platinum"
                                title="Estrela do Mês"
                                description={`${formatCurrency(estatisticas.valorFaturado)} em faturamento`}
                                icon="star"
                            />
                        )}

                        {/* Produtividade */}
                        {estatisticas.osConcluidas >= 20 && (
                            <Badge
                                type="silver"
                                title="Alta Produtividade"
                                description={`${estatisticas.osConcluidas} OS concluídas no mês`}
                                icon="zap"
                            />
                        )}

                        {/* Sem OS Críticas */}
                        {estatisticas.osCriticas === 0 && estatisticas.totalOS > 5 && (
                            <Badge
                                type="bronze"
                                title="Precisão Total"
                                description="Nenhuma OS em atraso crítico"
                                icon="target"
                            />
                        )}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Total OS', value: estatisticas.totalOS, icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/10' },
                        { label: 'Em Aberto', value: estatisticas.osAbertas, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Concluídas', value: estatisticas.osConcluidas, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Críticas', value: estatisticas.osCriticas, icon: AlertTriangle, color: estatisticas.osCriticas > 0 ? 'text-rose-400' : 'text-slate-400', bg: estatisticas.osCriticas > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10' },
                        { label: 'Vlr. Aberto', value: formatCurrency(estatisticas.valorAberto), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', highlight: true },
                        { label: 'Faturado', value: formatCurrency(estatisticas.valorFaturado), icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', highlight: true },
                    ].map((stat, i) => (
                        <div key={i} className={`glass-card-enterprise p-5 rounded-2xl flex flex-col justify-between min-h-[110px] ${stat.highlight ? 'border-indigo-500/20' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">{stat.label}</span>
                                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className={`text-xl font-bold text-[var(--text-primary)] ${stat.highlight ? 'text-indigo-100' : ''}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                            <button
                                onClick={() => setFiltroStatus('')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filtroStatus === ''
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                                    : 'bg-[var(--surface-light)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFiltroStatus('ABERTAS')}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filtroStatus === 'ABERTAS'
                                    ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                                    : 'bg-[var(--surface-light)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                    }`}
                            >
                                Em Aberto
                            </button>
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => setFiltroStatus(value as StatusOS)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border whitespace-nowrap ${filtroStatus === value
                                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/10'
                                        : 'bg-[var(--surface-light)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="glass-card-enterprise rounded-2xl overflow-hidden shadow-2xl border-white/[0.03]">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/[0.05] bg-white/[0.01]">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Registro</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Modalidade</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Proprietário</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Equipamento</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">SLA</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Faturamento</th>
                                        <th className="px-6 py-4 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton width={80} height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width={60} height={24} className="rounded-full" /></td>
                                                <td className="px-6 py-4"><Skeleton width={150} height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width={120} height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width={100} height={24} className="rounded-full" /></td>
                                                <td className="px-6 py-4"><Skeleton width={40} height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width={100} height={20} /></td>
                                                <td className="px-6 py-4"><Skeleton width={40} height={40} className="rounded-xl mx-auto" /></td>
                                            </tr>
                                        ))
                                    ) : osList.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-20">
                                                <EmptyState
                                                    icon={FileText}
                                                    title="Nenhuma Ordem de Serviço"
                                                    description="Não encontramos registros para os filtros selecionados no momento."
                                                    action={{
                                                        label: "Limpar Filtros",
                                                        onClick: () => setFiltroStatus('')
                                                    }}
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        osList.map((os) => (
                                            <tr key={os.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate(`/os/editar/${os.id}`)}>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">#{os.numero_os}</span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)]">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest ${os.tipo_os === 'GARANTIA' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                        }`}>
                                                        {os.tipo_os}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-[var(--text-primary)]">{os.nome_cliente_digitavel || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-[var(--text-muted)] italic">{os.modelo_maquina || '-'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <StatusBadge status={os.status_atual as any} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-sm font-bold ${os.dias_em_aberto > 60 ? 'text-rose-400' :
                                                        os.dias_em_aberto > 30 ? 'text-amber-400' :
                                                            'text-slate-400'
                                                        }`}>
                                                        {os.dias_em_aberto}d
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-emerald-400/90">
                                                        {formatCurrency(os.valor_liquido_total)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg">
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
