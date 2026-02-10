import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { alertasService } from '../services/alertasService';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { formatarDataHora } from '../utils/osHelpers';
import { CustomBadge } from '../components/ui/StatusBadge';
import {
    Bell,
    CheckCheck,
    Trash2,
    Filter,
    AlertCircle,
    Info,
    AlertTriangle,
    Clock,
    CheckCircle,
    RefreshCw
} from 'lucide-react';
import { AlertCard, MetricCard } from '../components/cognitive-bias';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

type Alerta = Database['public']['Tables']['alertas']['Row'];

export function Alertas() {
    const navigate = useNavigate();
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroTipo, setFiltroTipo] = useState<string>('TODOS');
    const [filtroPrioridade, setFiltroPrioridade] = useState<string>('TODOS');
    const [filtroLido, setFiltroLido] = useState<string>('TODOS');

    useEffect(() => {
        carregarAlertas();
    }, []);

    const carregarAlertas = async () => {
        try {
            setLoading(true);
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const data = await alertasService.getAlertas(user.id);
            setAlertas(data);
        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarcarComoLido = async (alertaId: string) => {
        try {
            await alertasService.marcarComoLido(alertaId);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar como lido:', error);
        }
    };

    const handleMarcarTodosComoLidos = async () => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            await alertasService.marcarTodosComoLidos(user.id);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao marcar todos como lidos:', error);
        }
    };

    const handleDeletarAlerta = async (alertaId: string) => {
        if (!confirm('Deseja realmente excluir este alerta?')) return;

        try {
            await alertasService.deletarAlerta(alertaId);
            await carregarAlertas();
        } catch (error) {
            console.error('Erro ao deletar alerta:', error);
        }
    };

    const alertasFiltrados = alertas.filter((a) => {
        if (filtroTipo !== 'TODOS' && a.tipo_alerta !== filtroTipo) return false;
        if (filtroPrioridade !== 'TODOS' && a.prioridade !== filtroPrioridade) return false;
        if (filtroLido === 'LIDOS' && !a.lido) return false;
        if (filtroLido === 'NAO_LIDOS' && a.lido) return false;
        return true;
    });

    const getIconeAlerta = (tipo: string) => {
        switch (tipo) {
            case 'OS_VENCIDA':
                return <AlertCircle className="h-5 w-5 text-rose-500" />;
            case 'GARANTIA_PENDENTE':
                return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case 'PECAS_CHEGANDO':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-[var(--text-muted)]" />;
        }
    };




    const estatisticas = {
        total: alertas.length,
        naoLidos: alertas.filter((a) => !a.lido).length,
        urgentes: alertas.filter((a) => a.prioridade === 'URGENTE' && !a.lido).length,
    };

    // Cálculo de valor em risco (Viés de Aversão à Perda)
    const alertasCriticos = alertas.filter(a =>
        a.prioridade === 'URGENTE' && !a.lido && a.tipo_alerta === 'OS_VENCIDA'
    );

    // Estimar valor em risco baseado em OS vencidas (R$ 1.000 por dia de atraso)
    const calcularDiasAtraso = (createdAt: string) => {
        const created = new Date(createdAt);
        const now = new Date();
        const diff = now.getTime() - created.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const valorEmRisco = alertasCriticos.reduce((total, alerta) => {
        const diasAtraso = calcularDiasAtraso(alerta.created_at);
        return total + (diasAtraso * 1000); // R$ 1.000 por dia
    }, 0);

    const maxDiasAtraso = alertasCriticos.length > 0
        ? Math.max(...alertasCriticos.map(a => calcularDiasAtraso(a.created_at)))
        : 0;

    return (
        <AppLayout>
            <div className="p-8 animate-fadeIn max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <Bell className="w-8 h-8 text-blue-500" />
                            Central de Notificações
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 font-medium">
                            Gerencie pendências e alertas do sistema
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {estatisticas.naoLidos > 0 && (
                            <Button
                                onClick={handleMarcarTodosComoLidos}
                                variant="primary"
                                leftIcon={<CheckCheck className="w-4 h-4" />}
                            >
                                Marcar Tudo Lido
                            </Button>
                        )}
                        <Button
                            onClick={carregarAlertas}
                            variant="secondary"
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {loading ? (
                        [1, 2, 3].map(i => <Skeleton key={i} height={120} className="rounded-2xl" />)
                    ) : (
                        <>
                            <MetricCard
                                label="Total de Alertas"
                                value={estatisticas.total}
                                format="number"
                                className="border-blue-500/10"
                            />
                            <MetricCard
                                label="Não Lidos"
                                value={estatisticas.naoLidos}
                                format="number"
                                trend={estatisticas.naoLidos > 0 ? "up" : "stable"}
                                className="border-indigo-500/10"
                            />
                            <MetricCard
                                label="Urgentes Pendentes"
                                value={estatisticas.urgentes}
                                format="number"
                                trend={estatisticas.urgentes > 0 ? "down" : "stable"}
                                className={estatisticas.urgentes > 0 ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/10"}
                            />
                        </>
                    )}
                </div>

                {/* Critical Alert - Aversion to Loss */}
                {!loading && alertasCriticos.length > 0 && (
                    <div className="mb-8">
                        <AlertCard
                            type="critical"
                            title={`⚠️ ATENÇÃO: ${alertasCriticos.length} ${alertasCriticos.length === 1 ? 'Alerta Crítico' : 'Alertas Críticos'}!`}
                            message="Ordens vencidas representam risco direto de churn e prejuízo financeiro. Resolva imediatamente."
                            riskValue={valorEmRisco > 0 ? valorEmRisco : undefined}
                            daysOverdue={maxDiasAtraso > 0 ? maxDiasAtraso : undefined}
                            actionLabel="Filtrar Críticos"
                            onAction={() => {
                                setFiltroPrioridade('URGENTE');
                                setFiltroLido('NAO_LIDOS');
                            }}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="glass-card-enterprise p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                <Filter className="inline h-3 w-3 mr-1" /> Tipo
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="TODOS" className="bg-[#0f172a]">Todos</option>
                                <option value="OS_VENCIDA" className="bg-[#0f172a]">OS Vencida</option>
                                <option value="GARANTIA_PENDENTE" className="bg-[#0f172a]">Garantia Pendente</option>
                                <option value="PECAS_CHEGANDO" className="bg-[#0f172a]">Peças Chegando</option>
                                <option value="PREVISAO_ENTREGA" className="bg-[#0f172a]">Previsão Entrega</option>
                                <option value="META_FATURAMENTO" className="bg-[#0f172a]">Meta Faturamento</option>
                                <option value="OUTROS" className="bg-[#0f172a]">Outros</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                <AlertTriangle className="inline h-3 w-3 mr-1" /> Prioridade
                            </label>
                            <select
                                value={filtroPrioridade}
                                onChange={(e) => setFiltroPrioridade(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="TODOS" className="bg-[#0f172a]">Todas</option>
                                <option value="URGENTE" className="bg-[#0f172a]">Urgente</option>
                                <option value="ALTA" className="bg-[#0f172a]">Alta</option>
                                <option value="NORMAL" className="bg-[#0f172a]">Normal</option>
                                <option value="BAIXA" className="bg-[#0f172a]">Baixa</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                <CheckCircle className="inline h-3 w-3 mr-1" /> Status
                            </label>
                            <select
                                value={filtroLido}
                                onChange={(e) => setFiltroLido(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="TODOS" className="bg-[#0f172a]">Todos</option>
                                <option value="NAO_LIDOS" className="bg-[#0f172a]">Não Lidos</option>
                                <option value="LIDOS" className="bg-[#0f172a]">Lidos</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height={100} className="rounded-xl" />)}
                    </div>
                ) : alertasFiltrados.length > 0 ? (
                    <div className="space-y-4">
                        {alertasFiltrados.map((alerta) => (
                            <div
                                key={alerta.id}
                                className={`group p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${!alerta.lido
                                    ? 'bg-[var(--surface-light)] border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]'
                                    : 'bg-[var(--surface)] border-[var(--border-subtle)] opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {/* Priority Indicator Line */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${alerta.prioridade === 'URGENTE' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' :
                                    alerta.prioridade === 'ALTA' ? 'bg-orange-500' :
                                        alerta.prioridade === 'NORMAL' ? 'bg-blue-500' : 'bg-slate-500'
                                    }`} />

                                <div className="flex items-start gap-4 pl-3">
                                    <div className={`p-3 rounded-xl flex-shrink-0 ${!alerta.lido ? 'bg-blue-500/10' : 'bg-white/5'
                                        }`}>
                                        {getIconeAlerta(alerta.tipo_alerta)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <h3 className={`text-lg font-bold ${!alerta.lido ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                                                    }`}>
                                                    {alerta.titulo}
                                                </h3>
                                                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                                                    {alerta.mensagem}
                                                </p>

                                                <div className="flex items-center gap-4 mt-3 pt-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatarDataHora(alerta.created_at)}
                                                    </div>
                                                    <CustomBadge
                                                        label={alerta.prioridade}
                                                        variant={
                                                            alerta.prioridade === 'URGENTE' ? 'red' :
                                                                alerta.prioridade === 'ALTA' ? 'orange' :
                                                                    alerta.prioridade === 'NORMAL' ? 'blue' : 'gray'
                                                        }
                                                    />
                                                    {alerta.lido && (
                                                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                            <CheckCheck className="h-3 w-3" />
                                                            Lido
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!alerta.lido && (
                                                    <button
                                                        onClick={() => handleMarcarComoLido(alerta.id)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-transparent hover:border-blue-500/20"
                                                        title="Marcar como lido"
                                                    >
                                                        <CheckCheck className="h-5 w-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletarAlerta(alerta.id)}
                                                    className="p-2 text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                                                    title="Excluir alerta"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                                {alerta.os_id && (
                                                    <button
                                                        onClick={() => navigate(`/os/editar/${alerta.os_id}`)}
                                                        className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-[var(--surface-light)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg hover:border-blue-500/50 hover:text-blue-400 transition-all shadow-sm"
                                                    >
                                                        Ver OS
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Bell}
                        title="Tudo Silencioso"
                        description={filtroTipo !== 'TODOS' ? "Nenhum alerta encontrado com os filtros atuais." : "Você não possui notificações pendentes no momento."}
                        className="glass-card-enterprise py-20"
                    />
                )}
            </div>
        </AppLayout>
    );
}
