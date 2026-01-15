import { useState, useEffect } from 'react';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Clock,
    AlertTriangle,
    CheckCircle,
    Users,
    Wrench,
    RefreshCw,
    ChevronRight,
    Target,
    Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MetricCard } from '@/components/cognitive-bias';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/ui/StatusBadge';

// Helper para formatar valor
const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

interface KPIDiretoria {
    totalOS: number;
    osAbertas: number;
    osConcluidas: number;
    osGarantia: number;
    osNormal: number;
    valorTotalAberto: number;
    valorTotalFaturado: number;
    tempoMedioResolucao: number;
    osCriticas: number;
    taxaConclusao: number;
    gargalos: {
        status: string;
        quantidade: number;
        tempoMedio: number;
    }[];
    performanceConsultores: {
        nome: string;
        osConcluidas: number;
        valorFaturado: number;
    }[];
}

export default function PainelDiretoria() {
    const [kpis, setKpis] = useState<KPIDiretoria>({
        totalOS: 0,
        osAbertas: 0,
        osConcluidas: 0,
        osGarantia: 0,
        osNormal: 0,
        valorTotalAberto: 0,
        valorTotalFaturado: 0,
        tempoMedioResolucao: 0,
        osCriticas: 0,
        taxaConclusao: 0,
        gargalos: [],
        performanceConsultores: [],
    });
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | 'ano'>('30d');

    // Carregar KPIs
    const carregarDados = async () => {
        setLoading(true);
        try {
            // Definir data inicial baseada no período
            let dataInicio = new Date();
            switch (periodo) {
                case '7d': dataInicio.setDate(dataInicio.getDate() - 7); break;
                case '30d': dataInicio.setDate(dataInicio.getDate() - 30); break;
                case '90d': dataInicio.setDate(dataInicio.getDate() - 90); break;
                case 'ano': dataInicio.setFullYear(dataInicio.getFullYear() - 1); break;
            }

            // Buscar todas as OS
            const { data: todasOS, error } = await supabase
                .from('ordens_servico')
                .select(`
                    *,
                    consultor:consultor_id (first_name, last_name)
                `)
                .gte('data_abertura', dataInicio.toISOString());

            if (error) throw error;

            const os = todasOS || [];

            // Calcular KPIs
            const osAbertas = os.filter(o => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(o.status_atual));
            const osConcluidas = os.filter(o => ['CONCLUIDA', 'FATURADA'].includes(o.status_atual));
            const osGarantia = os.filter(o => o.tipo_os === 'GARANTIA');
            const osNormal = os.filter(o => o.tipo_os === 'NORMAL');

            // Valor total em aberto
            const valorAberto = osAbertas.reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0);

            // Valor faturado
            const valorFaturado = os
                .filter(o => o.status_atual === 'FATURADA')
                .reduce((sum, o) => sum + (o.valor_liquido_total || 0), 0);

            // OS Críticas (> 60 dias)
            const limite60Dias = new Date();
            limite60Dias.setDate(limite60Dias.getDate() - 60);
            const osCriticas = osAbertas.filter(o =>
                new Date(o.data_abertura) < limite60Dias
            ).length;

            // Tempo médio de resolução
            const temposResolucao = osConcluidas
                .filter(o => o.data_abertura && o.data_fechamento)
                .map(o => {
                    const abertura = new Date(o.data_abertura).getTime();
                    const fechamento = new Date(o.data_fechamento!).getTime();
                    return (fechamento - abertura) / (1000 * 60 * 60 * 24);
                });

            const tempoMedio = temposResolucao.length > 0
                ? Math.round(temposResolucao.reduce((a, b) => a + b, 0) / temposResolucao.length * 10) / 10
                : 0;

            // Taxa de conclusão
            const taxaConclusao = os.length > 0
                ? Math.round((osConcluidas.length / os.length) * 100)
                : 0;

            // Gargalos (tempo médio por status)
            const statusCount: Record<string, { count: number; tempoTotal: number }> = {};
            osAbertas.forEach(o => {
                if (!statusCount[o.status_atual]) {
                    statusCount[o.status_atual] = { count: 0, tempoTotal: 0 };
                }
                const dias = Math.floor((Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
                statusCount[o.status_atual].count++;
                statusCount[o.status_atual].tempoTotal += dias;
            });

            const gargalos = Object.entries(statusCount)
                .map(([status, data]) => ({
                    status,
                    quantidade: data.count,
                    tempoMedio: Math.round(data.tempoTotal / data.count),
                }))
                .sort((a, b) => b.tempoMedio - a.tempoMedio);

            // Performance por consultor
            const consultoresMap: Record<string, { nome: string; osConcluidas: number; valorFaturado: number }> = {};
            osConcluidas.forEach(o => {
                const consultorId = o.consultor_id || 'sem_consultor';
                const consultorNome = o.consultor
                    ? `${o.consultor.first_name || ''} ${o.consultor.last_name || ''}`.trim()
                    : 'Sem Consultor';

                if (!consultoresMap[consultorId]) {
                    consultoresMap[consultorId] = {
                        nome: consultorNome,
                        osConcluidas: 0,
                        valorFaturado: 0,
                    };
                }
                consultoresMap[consultorId].osConcluidas++;
                if (o.status_atual === 'FATURADA') {
                    consultoresMap[consultorId].valorFaturado += o.valor_liquido_total || 0;
                }
            });

            const performanceConsultores = Object.values(consultoresMap)
                .sort((a, b) => b.valorFaturado - a.valorFaturado)
                .slice(0, 5);

            setKpis({
                totalOS: os.length,
                osAbertas: osAbertas.length,
                osConcluidas: osConcluidas.length,
                osGarantia: osGarantia.length,
                osNormal: osNormal.length,
                valorTotalAberto: valorAberto,
                valorTotalFaturado: valorFaturado,
                tempoMedioResolucao: tempoMedio,
                osCriticas,
                taxaConclusao,
                gargalos,
                performanceConsultores,
            });

        } catch (error) {
            console.error('Erro ao carregar KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [periodo]);

    const statusLabels: Record<string, string> = {
        'EM_EXECUCAO': 'Em Execução',
        'AGUARDANDO_PECAS': 'Aguardando Peças',
        'PAUSADA': 'Pausada',
        'CONCLUIDA': 'Concluída',
        'FATURADA': 'Faturada',
        'CANCELADA': 'Cancelada',
    };

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl">
                                <BarChart3 className="w-8 h-8 text-indigo-500" />
                            </div>
                            Painel Executivo
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Visão macro estratégica e KPIs de performance corporativa</p>
                    </div>
                    <div className="flex items-center gap-3 bg-[var(--surface-light)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
                        <select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value as any)}
                            className="bg-transparent text-sm font-bold text-[var(--text-primary)] px-3 py-1.5 focus:outline-none border-none"
                        >
                            <option value="7d">Últimos 7 dias</option>
                            <option value="30d">Últimos 30 dias</option>
                            <option value="90d">Últimos 90 dias</option>
                            <option value="ano">Último ano</option>
                        </select>
                        <div className="w-[1px] h-6 bg-white/10 mx-1" />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={carregarDados}
                            className="bg-transparent border-none py-1 h-8"
                            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Sincronizar
                        </Button>
                    </div>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={160} className="rounded-2xl" />) : (
                        <>
                            <MetricCard
                                value={kpis.taxaConclusao}
                                label="Taxa de Entrega"
                                format="percentage"
                                trend={kpis.taxaConclusao >= 80 ? 'up' : kpis.taxaConclusao >= 60 ? 'stable' : 'down'}
                                comparison={{ value: 12, period: "mês anterior" }}
                                className="border-indigo-500/10"
                            />

                            <MetricCard
                                value={kpis.valorTotalFaturado}
                                label="Receita Bruta"
                                format="currency"
                                trend="up"
                                comparison={{ value: 15, period: "mês anterior" }}
                                className="border-emerald-500/10"
                            />

                            <MetricCard
                                value={kpis.osConcluidas}
                                label="Volume de Produção"
                                format="number"
                                trend="up"
                                className="border-blue-500/10"
                            />
                        </>
                    )}
                </div>

                {/* Sub-KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Registros', value: kpis.totalOS, icon: Wrench, color: 'text-slate-400', bg: 'bg-slate-500/10', sub: `${kpis.osNormal} Normais / ${kpis.osGarantia} Garantias` },
                        { label: 'Custos em Aberto', value: formatCurrency(kpis.valorTotalAberto), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10', sub: `${kpis.osAbertas} OS ativas no momento` },
                        { label: 'Eficiência de Ciclo', value: `${kpis.tempoMedioResolucao}d`, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', sub: 'Média de fechamento ponta-a-ponta' },
                        { label: 'Incidentes Críticos', value: kpis.osCriticas, icon: AlertTriangle, color: kpis.osCriticas > 0 ? 'text-rose-400' : 'text-slate-400', bg: kpis.osCriticas > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10', sub: '> 60 dias sem resolução' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card-enterprise p-5 rounded-2xl border-white/[0.03]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{stat.label}</span>
                                <div className={`p-2 rounded-lg ${stat.bg}`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-[var(--text-primary)] mb-1">{stat.value}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium italic opacity-70">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Performance & Analysis Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Bottleneck Analysis */}
                    <div className="glass-card-enterprise p-6 rounded-2xl shadow-xl border-white/[0.02]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Monitor de Gargalos
                            </h3>
                            <Activity className="w-4 h-4 text-[var(--text-muted)] opacity-30" />
                        </div>

                        <div className="space-y-3">
                            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} className="rounded-xl" />) : kpis.gargalos.length === 0 ? (
                                <EmptyState title="Cadeia de produção livre" description="Nenhum status excedendo o tempo médio operacional." />
                            ) : (
                                kpis.gargalos.map((gargalo, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-8 rounded-full ${gargalo.tempoMedio > 30 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : gargalo.tempoMedio > 14 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                            <div>
                                                <p className="text-xs font-black text-[var(--text-primary)] uppercase tracking-tight">
                                                    {statusLabels[gargalo.status] || gargalo.status}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{gargalo.quantidade} registros ativos</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-black ${gargalo.tempoMedio > 30 ? 'text-rose-400' : gargalo.tempoMedio > 14 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                ~{gargalo.tempoMedio}d
                                            </p>
                                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Tempo Médio</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Consultant Performance Ranking */}
                    <div className="glass-card-enterprise p-6 rounded-2xl shadow-xl border-white/[0.02]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Top 5 Performers
                            </h3>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] opacity-30" />
                        </div>

                        <div className="space-y-3">
                            {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} className="rounded-xl" />) : kpis.performanceConsultores.length === 0 ? (
                                <EmptyState title="Aguardando fechamentos" description="Nenhum dado de faturamento reconciliado para o período." />
                            ) : (
                                kpis.performanceConsultores.map((consultor, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl group hover:border-emerald-500/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' :
                                                    idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30 font-mono' :
                                                        idx === 2 ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' : 'bg-white/5 text-[var(--text-muted)] border border-white/5'
                                                }`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-[var(--text-primary)] uppercase group-hover:text-white transition-colors">
                                                    {consultor.nome || 'S/ Identificação'}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-muted)] font-bold">{consultor.osConcluidas} ordens concluídas</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-emerald-400">
                                                {formatCurrency(consultor.valorFaturado)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-tighter">Faturamento</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Volume Distribution Banner */}
                <div className="glass-card-enterprise p-8 rounded-3xl border-indigo-500/10 shadow-3xl bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03]">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-md">
                            <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Equilíbrio Operacional</h4>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">Sua carteira atual está composta por <span className="text-white font-bold">{Math.round((kpis.osNormal / kpis.totalOS) * 100)}% de serviços diretos</span> e <span className="text-rose-400 font-bold">{Math.round((kpis.osGarantia / kpis.totalOS) * 100)}% de garantias</span>. Mantenha o foco em reduzir o ciclo médio de conclusão para otimizar o fluxo de caixa.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center px-8">
                                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Normais</p>
                                <p className="text-3xl font-black text-white">{kpis.osNormal}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center px-8">
                                <p className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Garantia</p>
                                <p className="text-3xl font-black text-rose-500">{kpis.osGarantia}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
