// Trigger deploy: 2026-02-18 15:53
import React, { useState, useMemo } from 'react';
import {
    Users,
    Clock,
    CheckCircle,
    AlertTriangle,
    Plus,
    UserPlus,
    PieChart,
    RefreshCw,
    Package,
    DollarSign,
    TrendingUp,
    LayoutDashboard,
    Wrench,
    Award,
    Timer,
    FileText
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AssignTechnicianModal } from '@/components/ui/AssignTechnicianModal';
import { ModalCadastrarTecnico } from '@/components/ui/ModalCadastrarTecnico';
import { Card } from '@/components/ui/Card';
import { ModalDetalhesTecnico } from '@/components/ui/ModalDetalhesTecnico';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';

// Sub-componente: OS com pepas prontas para retirada
function OsPecasProntas({ onAssignClick }: { onAssignClick?: (os: any) => void }) {
    const { data: osProntas = [], isLoading } = useQuery({
        queryKey: ['os-pecas-prontas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('itens_os')
                .select('*, ordens_servico:ordem_servico_id(id, numero_os, nome_cliente_digitavel, modelo_maquina, tecnico_id)')
                .eq('status_separacao', 'AGUARDANDO_RETIRADA');

            if (error || !data) return [];

            const osMap = new Map<string, any>();
            data.forEach((item: any) => {
                const os = item.ordens_servico;
                // Só mostrar se NÃO tiver técnico atribuído
                if (!os || os.tecnico_id) return;

                if (!osMap.has(os.id)) {
                    osMap.set(os.id, { id: os.id, numero_os: os.numero_os, nome_cliente_digitavel: os.nome_cliente_digitavel, modelo_maquina: os.modelo_maquina, pecas: 0 });
                }
                osMap.get(os.id).pecas++;
            });
            return Array.from(osMap.values());
        }
    });

    if (isLoading) return <Skeleton className="h-48 w-full rounded-3xl" />;
    if (osProntas.length === 0) return null;

    return (
        <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-emerald-500/20 bg-emerald-500/[0.02]">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Package className="w-5 h-5" />
                OS com Peças Prontas para Retirada ({osProntas.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {osProntas.map((os: any) => (
                    <div
                        key={os.id}
                        onClick={() => onAssignClick && onAssignClick(os)}
                        className={`p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl transition-all ${onAssignClick ? 'cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30' : ''}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-emerald-400">#{os.numero_os}</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold border border-emerald-500/20">
                                {os.pecas} peça{os.pecas > 1 ? 's' : ''}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{os.nome_cliente_digitavel || 'Cliente'}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{os.modelo_maquina || ''}</p>
                        <p className="text-[10px] text-emerald-400/70 mt-2">✅ Peças separadas — clique para atribuir/notificar técnico p/ conclusão</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface OSNaoAtribuida {
    id: string;
    numero_os: string;
    tipo_os: 'NORMAL' | 'GARANTIA';
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    data_abertura: string;
    dias_em_aberto: number;
    descricao_problema: string | null;
}

const PainelChefeOficina: React.FC = () => {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedOS, setSelectedOS] = useState<OSNaoAtribuida | null>(null);
    const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
    const [modalDetalhesOpen, setModalDetalhesOpen] = useState(false);
    const [selectedTecnico, setSelectedTecnico] = useState<any | null>(null);
    const [expandedOS, setExpandedOS] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'gestao'>('dashboard');
    const { profile } = useAuth();
    const isGerente = profile?.role === 'GERENTE';

    // Refs para scroll suave
    const tecnicosRef = React.useRef<HTMLDivElement>(null);
    const pendenciasRef = React.useRef<HTMLDivElement>(null);
    const distribucaoRef = React.useRef<HTMLDivElement>(null);

    const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const { data: tecnicos = [], isLoading: isLoadingTecnicos } = useQuery({
        queryKey: ['tecnicos-stats'],
        queryFn: async () => {
            const allTecnicos = await tecnicoService.getAll(true);

            // Buscar OS para popular o modal de detalhes
            const { data: osData } = await supabase
                .from('ordens_servico')
                .select('*')
                .not('status_atual', 'in', '(CANCELADA,FATURADA)');

            return allTecnicos.map(t => ({
                ...t,
                ordens_servico: (osData || []).filter((os: any) => os.tecnico_id === t.id)
            }));
        }
    });

    // Todas as OS ativas
    const { data: todasOS = [], isLoading: isLoadingOS } = useQuery({
        queryKey: ['os-ativas'],
        queryFn: async () => {
            const result = await ordemServicoService.list({ status: undefined }, 1, 1000);
            return result.data;
        }
    });

    const openTecnicoDetails = (tecnico: any) => {
        setSelectedTecnico(tecnico);
        setModalDetalhesOpen(true);
    };

    // Cálculos derivados
    const osAtivas = todasOS.filter((os: any) => !['FATURADA', 'CANCELADA'].includes(os.status_atual));
    const limite60Dias = new Date();
    limite60Dias.setDate(limite60Dias.getDate() - 60);

    const osSemTecnico = osAtivas.filter((o: any) => !o.tecnico_id);
    const totalHorasSemTecnico = osSemTecnico.reduce((acc: number, o: any) => {
        const horas = (Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60);
        return acc + horas;
    }, 0);

    const estatisticas = {
        totalTecnicos: tecnicos.length,
        tecnicosDisponiveis: tecnicos.filter((t: any) => t.status_disponibilidade === 'DISPONIVEL').length,
        tecnicosIndisponiveis: tecnicos.filter((t: any) => t.status_disponibilidade !== 'DISPONIVEL').length,
        osEmAndamento: osAtivas.filter((o: any) => o.status_atual === 'EM_EXECUCAO').length,
        osAguardandoPecas: osAtivas.filter((o: any) => o.status_atual === 'AGUARDANDO_PECAS').length,
        osSemTecnico: osSemTecnico.length,
        osCriticas: osAtivas.filter((o: any) => new Date(o.data_abertura) < limite60Dias).length,
        leadTimeTriagem: osSemTecnico.length > 0 ? (totalHorasSemTecnico / osSemTecnico.length).toFixed(1) : 0,
    };

    const osNaoAtribuidas: OSNaoAtribuida[] = osAtivas
        .filter((o: any) => !o.tecnico_id)
        .map((o: any) => ({
            id: o.id,
            numero_os: o.numero_os,
            tipo_os: o.tipo_os,
            nome_cliente_digitavel: o.nome_cliente_digitavel,
            modelo_maquina: o.modelo_maquina,
            data_abertura: o.data_abertura,
            dias_em_aberto: Math.floor((Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24)),
            descricao_problema: o.descricao_problema || 'Nenhuma descrição detalhada fornecida.',
        }));

    const statusCounts = osAtivas.reduce((acc: any, os: any) => {
        acc[os.status_atual] = (acc[os.status_atual] || 0) + 1;
        return acc;
    }, {});

    const distribuicaoStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        quantidade: Number(count),
        percentual: Math.round((Number(count) / (osAtivas.length || 1)) * 100)
    })).sort((a, b) => b.quantidade - a.quantidade);

    // Datas com OS ativas para o Calendário (usando a data de abertura como marco da tarefa)
    const calendarEvents = useMemo(() => {
        const events: any[] = [];
        osAtivas.forEach((os: any) => {
            if (os.tecnico_id && os.data_abertura) {
                const date = new Date(os.data_abertura).toISOString().split('T')[0];
                const tecnicoNome = tecnicos.find((t: any) => t.id === os.tecnico_id)?.nome || 'Sem técnico';
                events.push({
                    id: os.id,
                    date,
                    title: `OS #${os.numero_os}`,
                    subtitle: `Téc: ${tecnicoNome}`
                });
            }
        });
        return events;
    }, [osAtivas, tecnicos]);

    // === Dashboard KPIs ===
    const osFaturadas = todasOS.filter((os: any) => os.status_atual === 'FATURADA');
    const valorEmAberto = osAtivas.reduce((sum: number, os: any) => sum + (Number(os.valor_liquido_total) || 0), 0);
    const valorFaturado = osFaturadas.reduce((sum: number, os: any) => sum + (Number(os.valor_liquido_total) || 0), 0);
    const osPrazoExcedido = osAtivas.filter((o: any) => {
        const dias = Math.floor((Date.now() - new Date(o.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
        return dias > 30;
    });

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // === Desempenho Operacional dos Técnicos ===
    const desempenhoTecnicos = tecnicos.map((t: any) => {
        const osDoTecnico = todasOS.filter((os: any) => os.tecnico_id === t.id);
        const concluidas = osDoTecnico.filter((os: any) => ['CONCLUIDA', 'FATURADA', 'AGUARDANDO_PAGAMENTO'].includes(os.status_atual)).length;
        const emExecucao = osDoTecnico.filter((os: any) => os.status_atual === 'EM_EXECUCAO').length;
        const aguardando = osDoTecnico.filter((os: any) => os.status_atual === 'AGUARDANDO_PECAS').length;
        const totalAtivas = osDoTecnico.filter((os: any) => !['FATURADA', 'CANCELADA'].includes(os.status_atual)).length;
        const faturamentoTotal = osDoTecnico
            .filter((os: any) => os.status_atual === 'FATURADA')
            .reduce((sum: number, os: any) => sum + (Number(os.valor_liquido_total) || 0), 0);

        return {
            id: t.id,
            nome: t.nome || t.nome_completo,
            concluidas,
            emExecucao,
            aguardando,
            totalAtivas,
            faturamentoTotal,
        };
    }).sort((a: any, b: any) => b.concluidas - a.concluidas);

    const handleAtribuir = async (tecnicoId: string) => {
        if (selectedOS) {
            try {
                await ordemServicoService.update(selectedOS.id, { tecnico_id: tecnicoId } as any);
                queryClient.invalidateQueries({ queryKey: ['os-ativas'] });
                queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] });
                queryClient.invalidateQueries({ queryKey: ['os-pecas-prontas'] });
                setModalOpen(false);
                setSelectedOS(null);
            } catch (error) {
                console.error('Erro ao atribuir:', error);
            }
        }
    };

    const openAssignModal = (os: OSNaoAtribuida) => {
        setSelectedOS(os);
        setModalOpen(true);
    };

    const isLoading = isLoadingTecnicos || isLoadingOS;

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                                <Plus className="w-8 h-8 text-amber-500" />
                            </div>
                            Gestão de Oficina
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-1 ml-1">Controle estratégico de equipe e fluxo de produção</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => queryClient.invalidateQueries()}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                            className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                        >
                            Sincronizar
                        </Button>
                        {!isGerente && (
                            <Button
                                variant="primary"
                                onClick={() => setModalCadastroOpen(true)}
                                leftIcon={<UserPlus className="w-4 h-4" />}
                                className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20"
                            >
                                Novo Técnico
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-1 p-1 bg-[var(--surface-light)] rounded-xl border border-white/5 w-fit">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard'
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                            : 'text-[var(--text-muted)] hover:bg-white/5'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('gestao')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'gestao'
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                            : 'text-[var(--text-muted)] hover:bg-white/5'
                            }`}
                    >
                        <Wrench className="w-4 h-4" />
                        Gestão
                    </button>
                </div>

                {/* ========== TAB: DASHBOARD ========== */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* KPIs Financeiros */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card
                                title="OS Abertas"
                                value={osAtivas.length}
                                icon={FileText}
                                color="blue"
                                priority={1}
                            />
                            <Card
                                title="Valor em Aberto"
                                value={formatCurrency(valorEmAberto)}
                                icon={DollarSign}
                                color="amber"
                                priority={2}
                            />
                            <Card
                                title="Valor Faturado"
                                value={formatCurrency(valorFaturado)}
                                icon={TrendingUp}
                                color="emerald"
                                priority={3}
                            />
                            <Card
                                title="Prazo Excedido"
                                value={osPrazoExcedido.length}
                                icon={AlertTriangle}
                                color={osPrazoExcedido.length > 0 ? 'rose' : 'blue'}
                                priority={4}
                            />
                        </div>

                        {/* Desempenho Operacional dos Técnicos */}
                        <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <Award className="w-5 h-5 text-amber-500" />
                                Desempenho Operacional dos Técnicos
                            </h3>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                                </div>
                            ) : desempenhoTecnicos.length === 0 ? (
                                <EmptyState icon={Users} title="Sem dados" description="Nenhum técnico cadastrado para exibir desempenho." />
                            ) : (
                                <div className="space-y-4">
                                    {/* Header da tabela */}
                                    <div className="grid grid-cols-7 gap-4 px-5 py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em]">
                                        <div className="col-span-2">Técnico</div>
                                        <div className="text-center">Concluídas</div>
                                        <div className="text-center">Em Execução</div>
                                        <div className="text-center">Aguardando</div>
                                        <div className="text-center">Carga Total</div>
                                        <div className="text-right">Faturamento</div>
                                    </div>

                                    {desempenhoTecnicos.map((tec: any, idx: number) => (
                                        <div
                                            key={tec.id}
                                            className="grid grid-cols-7 gap-4 items-center p-5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl hover:bg-[var(--surface-hover)] transition-all group"
                                        >
                                            <div className="col-span-2 flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${idx === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                    idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                                                        idx === 2 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                            'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight truncate">{tec.nome}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black">
                                                    <CheckCircle className="w-3 h-3" />
                                                    {tec.concluidas}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black">
                                                    <Timer className="w-3 h-3" />
                                                    {tec.emExecucao}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${tec.aguardando > 0
                                                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                                    : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]'
                                                    }`}>
                                                    <Package className="w-3 h-3" />
                                                    {tec.aguardando}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-base font-black ${tec.totalAtivas > 5
                                                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                                    : 'bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
                                                    }`}>
                                                    {tec.totalAtivas}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-emerald-400">
                                                    {formatCurrency(tec.faturamentoTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Distribuição de Demanda e OS Críticas */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <PieChart className="w-5 h-5 text-amber-500" />
                                    Distribuição por Status
                                </h3>
                                <div className="space-y-4">
                                    {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : distribuicaoStatus.length === 0 ? (
                                        <p className="text-center py-8 text-[var(--text-muted)] text-sm">Sem dados</p>
                                    ) : (
                                        distribuicaoStatus.map((item) => (
                                            <div key={item.status} className="space-y-2">
                                                <div className="flex justify-between items-end px-1">
                                                    <StatusBadge status={item.status as any} size="sm" />
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-[var(--text-primary)]">{item.quantidade}</span>
                                                        <span className="text-[10px] font-black text-blue-400 ml-2">{item.percentual}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-[var(--surface-light)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-[1px]">
                                                    <div className="h-full rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]" style={{ width: `${item.percentual}%` }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* OS com Prazo Excedido */}
                            <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5" />
                                    OS com Prazo Excedido ({osPrazoExcedido.length})
                                </h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-visao360">
                                    {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : osPrazoExcedido.length === 0 ? (
                                        <div className="text-center py-12 opacity-30">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                                            <p className="text-sm font-bold uppercase tracking-widest">Nenhuma OS com prazo excedido</p>
                                        </div>
                                    ) : (
                                        osPrazoExcedido.map((os: any) => {
                                            const dias = Math.floor((Date.now() - new Date(os.data_abertura).getTime()) / (1000 * 60 * 60 * 24));
                                            return (
                                                <div key={os.id} className="flex items-center justify-between p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl hover:bg-rose-500/10 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                                        <div>
                                                            <span className="text-xs font-black text-rose-400">#{os.numero_os}</span>
                                                            <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">{os.nome_cliente_digitavel || '-'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-rose-400">{dias}d</span>
                                                        <p className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest">em aberto</p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Calendário de Operações */}
                            <CalendarWidget events={calendarEvents} />
                        </div>

                        {/* ===== Seção: OS com Peças Prontas para Retirada ===== */}
                        <OsPecasProntas onAssignClick={openAssignModal} />
                    </div>
                )}

                {/* ========== TAB: GESTÃO (conteúdo original) ========== */}
                {activeTab === 'gestao' && (
                    <div className="space-y-8 animate-fadeIn">

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                            <Card
                                title="Técnicos Disponíveis"
                                value={`${estatisticas.tecnicosDisponiveis}/${estatisticas.totalTecnicos}`}
                                icon={Users}
                                color="emerald"
                                priority={1}
                                onClick={() => scrollToRef(tecnicosRef)}
                            />
                            <Card
                                title="OS em Execução"
                                value={estatisticas.osEmAndamento}
                                icon={Clock}
                                color="blue"
                                priority={2}
                                onClick={() => scrollToRef(distribucaoRef)}
                            />
                            <Card
                                title="OS Sem Técnico"
                                value={estatisticas.osSemTecnico}
                                icon={UserPlus}
                                color={estatisticas.osSemTecnico > 0 ? "rose" : "blue"}
                                priority={3}
                                onClick={() => scrollToRef(pendenciasRef)}
                            />
                            <Card
                                title="Lead Time Triagem"
                                value={`${estatisticas.leadTimeTriagem}h`}
                                icon={Clock}
                                color={Number(estatisticas.leadTimeTriagem) > 24 ? "rose" : "amber"}
                                priority={4}
                                trend={{ value: 0, label: 'média atual', isPositive: false }}
                            />
                            <Card
                                title="Atrasos Críticos"
                                value={estatisticas.osCriticas}
                                icon={AlertTriangle}
                                color={estatisticas.osCriticas > 0 ? "rose" : "blue"}
                                priority={5}
                                onClick={() => scrollToRef(pendenciasRef)}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div id="distribuicao-oficina" ref={distribucaoRef} className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] scroll-mt-8">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <PieChart className="w-5 h-5 text-amber-500" />
                                    Distribuição da Demanda
                                </h3>
                                <div className="space-y-5">
                                    {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : distribuicaoStatus.length === 0 ? (
                                        <p className="text-center py-12 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-subtle)] rounded-2xl">Nenhum serviço em andamento</p>
                                    ) : (
                                        distribuicaoStatus.map((item) => (
                                            <div key={item.status} className="space-y-2.5 group">
                                                <div className="flex justify-between items-end px-1">
                                                    <StatusBadge status={item.status as any} size="sm" />
                                                    <div className="text-right">
                                                        <span className="text-sm font-black text-[var(--text-primary)]">{item.quantidade}</span>
                                                        <span className="text-[10px] font-black text-blue-400 ml-2 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">{item.percentual}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2.5 w-full bg-[var(--surface-light)] rounded-full overflow-hidden border border-[var(--border-subtle)] p-[1px]">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-1000 ease-out bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                                        style={{ width: `${item.percentual}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div id="carga-tecnica" ref={tecnicosRef} className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)] scroll-mt-8">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <Users className="w-5 h-5 text-emerald-500" />
                                    Carga Técnica da Equipe
                                </h3>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-visao360">
                                    {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />) : tecnicos.length === 0 ? (
                                        <p className="text-center py-12 text-[var(--text-muted)] text-sm italic border border-dashed border-[var(--border-subtle)] rounded-2xl">Nenhum técnico disponível na base</p>
                                    ) : (
                                        (tecnicos || []).map((tecnico: any) => (
                                            <div
                                                key={tecnico.id}
                                                className="p-5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-between hover:bg-[var(--surface-hover)] transition-all group cursor-pointer"
                                            >
                                                <div className="flex-1" onClick={() => openTecnicoDetails(tecnico)}>
                                                    <div className="flex items-center gap-3 mb-2.5">
                                                        <div className={`w-3 h-3 rounded-full ${tecnico.status_disponibilidade === 'DISPONIVEL' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                            tecnico.status_disponibilidade === 'AUSENTE' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,114,114,0.5)]' :
                                                                tecnico.status_disponibilidade === 'EM_TREINAMENTO' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                                                    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                                                            }`}></div>
                                                        <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{tecnico.nome}</p>
                                                        <StatusBadge status={tecnico.status_disponibilidade} size="sm" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400">
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">{tecnico.stats?.osEmExecucao || 0} Executando</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                                                            <span className="text-[10px] font-black uppercase tracking-tighter">{tecnico.stats?.osConcluidas || 0} Concluídas</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <select
                                                        value={tecnico.status_disponibilidade}
                                                        onChange={async (e) => {
                                                            try {
                                                                await tecnicoService.setAvailability(tecnico.id, e.target.value as any);
                                                                queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] });
                                                            } catch (err) {
                                                                console.error('Erro ao atualizar status:', err);
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[10px] font-bold rounded-lg px-2 py-1 outline-none hover:border-amber-500/50 transition-colors uppercase tracking-tight"
                                                    >
                                                        <option value="DISPONIVEL">Disponível</option>
                                                        <option value="EM_TREINAMENTO">Treinamento</option>
                                                        <option value="AUSENTE">Ausente</option>
                                                        <option value="FERIAS">Férias</option>
                                                    </select>

                                                    <div className={`flex flex-col items-center justify-center h-16 w-16 rounded-2xl border transition-all duration-300 ${(tecnico.stats?.osAtribuidas || 0) > 5 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-primary)]'}`}>
                                                        <span className="text-2xl font-black leading-none">{tecnico.stats?.osAtribuidas || 0}</span>
                                                        <span className="text-[8px] font-black uppercase opacity-40 tracking-widest mt-1">Carga</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div id="pendencias-alocacao" ref={pendenciasRef} className="space-y-6 pt-4 scroll-mt-8">
                            <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                                <AlertTriangle className="w-4 h-4" />
                                Pendências de Alocação ({osNaoAtribuidas.length})
                            </h3>

                            {isLoading ? <Skeleton className="h-[200px] w-full rounded-2xl" /> : osNaoAtribuidas.length === 0 ? (
                                <EmptyState icon={CheckCircle} title="Oficina Sincronizada" description="Excelente! Todas as ordens de serviço ativas possuem técnicos atribuídos." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {osNaoAtribuidas.map((os) => (
                                        <div
                                            key={os.id}
                                            className={`glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-between hover:bg-[var(--surface-hover)] transition-all group relative overflow-hidden cursor-pointer ${expandedOS === os.id ? 'ring-2 ring-orange-500/50' : ''}`}
                                            onClick={() => setExpandedOS(expandedOS === os.id ? null : os.id)}
                                        >
                                            <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                                                <UserPlus className="w-32 h-32 text-orange-500 rotate-12" />
                                            </div>
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 shadow-sm">#{os.numero_os}</span>
                                                    <StatusBadge status={os.tipo_os as any} size="sm" />
                                                </div>
                                                <h4 className="text-base font-black text-[var(--text-primary)] uppercase leading-tight line-clamp-2 min-h-[2.5em]">
                                                    {os.nome_cliente_digitavel || 'S/ Proprietário'}
                                                </h4>
                                                <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1.5">
                                                    <Package className="w-3.5 h-3.5" />
                                                    {os.modelo_maquina || 'Máquina não especificada'}
                                                </p>

                                                {expandedOS === os.id && (
                                                    <div className="mt-4 p-4 bg-[var(--surface)] border border-orange-500/20 rounded-2xl animate-slideDown">
                                                        <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Relato do Problema
                                                        </p>
                                                        <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed italic border-l-2 border-orange-500/30 pl-3">
                                                            "{os.descricao_problema}"
                                                        </p>
                                                    </div>
                                                )}

                                                <div className={`flex items-center gap-3 text-[10px] font-black uppercase p-3 rounded-xl border ${os.dias_em_aberto > 7 ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-[var(--surface)] border-[var(--border-subtle)] text-[var(--text-muted)]'}`}>
                                                    <div className={`w-2 h-2 rounded-full ${os.dias_em_aberto > 7 ? 'bg-rose-500 animate-pulse' : 'bg-slate-500/40'}`} />
                                                    <span>{os.dias_em_aberto} dias em espera</span>
                                                </div>
                                            </div>
                                            {!isGerente && (
                                                <div className="mt-6 pt-5 border-t border-[var(--border-subtle)] relative z-10">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openAssignModal(os);
                                                        }}
                                                        leftIcon={<UserPlus className="w-4 h-4" />}
                                                        className="w-full text-[10px] font-black tracking-widest uppercase hover:bg-orange-500 hover:text-white transition-all"
                                                    >
                                                        Atribuir Técnico
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AssignTechnicianModal
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedOS(null); }}
                onAssign={handleAtribuir}
                tecnicos={tecnicos.map((t: any) => ({
                    ...t,
                    osAtribuidas: t.stats?.osAtribuidas || 0,
                    osEmExecucao: t.stats?.osEmExecucao || 0,
                    osConcluidas: t.stats?.osConcluidas || 0
                }))}
                osNumero={selectedOS?.numero_os || ''}
                osCliente={selectedOS?.nome_cliente_digitavel || undefined}
            />

            <ModalCadastrarTecnico
                isOpen={modalCadastroOpen}
                onClose={() => setModalCadastroOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tecnicos-stats'] })}
            />

            <ModalDetalhesTecnico
                isOpen={modalDetalhesOpen}
                onClose={() => {
                    setModalDetalhesOpen(false);
                    setSelectedTecnico(null);
                }}
                tecnico={selectedTecnico}
            />
        </AppLayout>
    );
};

export default PainelChefeOficina;
