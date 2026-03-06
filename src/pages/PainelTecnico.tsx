import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Wrench,
    Clock,
    CheckCircle,
    Play,
    Pause,
    AlertTriangle,
    ChevronRight,
    Search,
    RefreshCw,
    Box,
    CreditCard,
    LayoutDashboard,
    DollarSign,
    Fuel,
    Utensils,
    Hotel,
    Car,
    ImageIcon,
    Paperclip
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { frotaService } from '@/services/frotaService';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { ModalAdicionarPeca } from '@/components/ui/ModalAdicionarPeca';
import { ModalLancarDespesa } from '@/components/ui/ModalLancarDespesa';
import { ModalGaleriaImagens } from '@/components/ui/ModalGaleriaImagens';
import { AgendaTecnicos } from '@/components/dashboard/AgendaTecnicos';

export default function PainelTecnico() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();
    const gerenteRoles = ['GERENTE', 'CHEFE_OFICINA', 'DIRETORIA'];
    const isGerente = gerenteRoles.includes(profile?.role?.toUpperCase() || '');

    const [selectedOS, setSelectedOS] = useState<string | null>(null);
    const [selectedNumeroOS, setSelectedNumeroOS] = useState<string>('');
    const [selectedOSForGallery, setSelectedOSForGallery] = useState<{ id: string, numero: string } | null>(null);
    const [modalPecaOpen, setModalPecaOpen] = useState(false);
    const [modalDespesaOpen, setModalDespesaOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'os'>('dashboard');
    const [despesasTecnico, setDespesasTecnico] = useState<any[]>([]);
    const [loadingDespesas, setLoadingDespesas] = useState(false);
    const [periodoFiltro, setPeriodoFiltro] = useState<'SEMANA' | 'MES' | 'TRIMESTRE' | 'SEMESTRE' | 'ANO' | 'TUDO'>('MES');

    // 1. Identificar Técnico
    const { data: tecnico, isLoading: isLoadingTecnico } = useQuery({
        queryKey: ['tecnico-profile', user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            return tecnicoService.getByUserId(user.id);
        },
        enabled: !!user?.id
    });

    // 2. Buscar Veículo do Técnico
    const { data: veiculoAlocado } = useQuery({
        queryKey: ['veiculo-tecnico', tecnico?.id],
        queryFn: async () => {
            if (!tecnico?.id) return null;
            return frotaService.getVeiculoDoTecnico(tecnico.id);
        },
        enabled: !!tecnico?.id
    });

    // 3. Buscar OS do Técnico
    const { data: osAtribuidas = [], isLoading: isLoadingOS } = useQuery({
        queryKey: ['os-tecnico', tecnico?.id, isGerente],
        queryFn: async () => {
            const filters: any = {};
            if (!isGerente) {
                if (!tecnico?.id) return [];
                filters.tecnicoId = tecnico.id;
            }

            const result = await ordemServicoService.list(filters, 1, 100);

            return result.data
                .filter(os => !['FATURADA', 'CANCELADA', 'CONCLUIDA', 'AGUARDANDO_PAGAMENTO'].includes(os.status_atual) && !!os.tecnico_id)
                .map((os: any) => {
                    const temPecasPendentes = os.itens?.some((i: any) => i.status_separacao === 'PENDENTE' || i.status_separacao === 'AGUARDANDO_COMPRA');
                    const todasPecasEntregues = os.itens?.length > 0 && !temPecasPendentes;

                    return {
                        id: os.id,
                        numero_os: os.numero_os,
                        nome_cliente_digitavel: os.nome_cliente_digitavel,
                        modelo_maquina: os.modelo_maquina,
                        status: os.status_atual,
                        data_abertura: os.data_abertura,
                        descricao_problema: os.descricao_problema || '',
                        pecas_lancadas: os.itens?.length || 0,
                        temPecasPendentes,
                        todasPecasEntregues,
                        nome_tecnico: os.tecnico?.nome_completo
                    };
                });
        },
        enabled: isGerente || !!tecnico?.id
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ osId, status }: { osId: string, status: string }) => {
            return ordemServicoService.update(osId, { status_atual: status } as any);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['os-tecnico'] });
            queryClient.invalidateQueries({ queryKey: ['todas-os-tecnico'] });
        }
    });

    const handleUpdateStatus = async (osId: string, status: string) => {
        try {
            await updateStatusMutation.mutateAsync({ osId, status });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    // Buscar despesas do técnico (todas as OS dele)
    useEffect(() => {
        const fetchDespesas = async () => {
            if (osAtribuidas.length === 0 && !isGerente) return;
            setLoadingDespesas(true);
            try {
                const osIds = osAtribuidas.map((os: any) => os.id);
                // Buscar também OS faturadas/concluídas do técnico
                let allOsIds = [...osIds];
                if (tecnico?.id) {
                    const { data: allOs } = await supabase
                        .from('ordens_servico')
                        .select('id')
                        .eq('tecnico_id', tecnico.id);
                    if (allOs) allOsIds = allOs.map((o: any) => o.id);
                }
                if (allOsIds.length > 0) {
                    const { data } = await supabase
                        .from('despesas_os' as any)
                        .select('*')
                        .in('ordem_servico_id', allOsIds)
                        .order('data_despesa', { ascending: false });
                    setDespesasTecnico((data || []) as any[]);
                }
            } catch (err) {
                console.error('Erro ao buscar despesas:', err);
            } finally {
                setLoadingDespesas(false);
            }
        };
        fetchDespesas();
    }, [osAtribuidas, tecnico?.id]);

    // Todas as OS do técnico (incluindo faturadas)
    const { data: todasOsTecnico = [] } = useQuery({
        queryKey: ['todas-os-tecnico', tecnico?.id],
        queryFn: async () => {
            if (!tecnico?.id) return [];
            const { data } = await supabase
                .from('ordens_servico')
                .select('*')
                .eq('tecnico_id', tecnico.id)
                .order('data_abertura', { ascending: false });
            return data || [];
        },
        enabled: !!tecnico?.id && !isGerente
    });

    // Estatísticas
    const estatisticas = {
        totalOS: osAtribuidas.length,
        emAndamento: osAtribuidas.filter((os: any) => os.status === 'EM_EXECUCAO').length,
        aguardandoPecas: osAtribuidas.filter((os: any) => os.status === 'AGUARDANDO_PECAS').length,
        concluidas: osAtribuidas.filter((os: any) => os.status === 'CONCLUIDA').length
    };

    // Filtros de tempo
    const filterByDate = (dateString: string) => {
        if (periodoFiltro === 'TUDO') return true;
        if (!dateString) return false;

        const now = new Date();
        const date = new Date(dateString);

        switch (periodoFiltro) {
            case 'SEMANA': {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return date >= oneWeekAgo;
            }
            case 'MES': {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            case 'TRIMESTRE': {
                const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                return date >= threeMonthsAgo;
            }
            case 'SEMESTRE': {
                const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                return date >= sixMonthsAgo;
            }
            case 'ANO': {
                return date.getFullYear() === now.getFullYear();
            }
            default: return true;
        }
    };

    // Dashboard KPIs (Gerais)

    // KPIs do Período
    const osFechadasPeriodo = todasOsTecnico.filter((os: any) =>
        ['FATURADA', 'CONCLUIDA', 'AGUARDANDO_PAGAMENTO'].includes(os.status_atual) &&
        filterByDate(os.data_faturamento || os.data_fechamento || os.data_conclusao_servico || os.updated_at || os.data_abertura)
    );

    let faturamentoPeriodo = 0;
    osFechadasPeriodo.forEach((os: any) => {
        faturamentoPeriodo += Number(os.valor_liquido_total) || Number(os.valor_servico) || 0;
    });

    const despesasPeriodo = despesasTecnico.filter(d => filterByDate(d.data_despesa));
    const totalDespesasPeriodo = despesasPeriodo.reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0);
    const saldoPeriodo = faturamentoPeriodo - totalDespesasPeriodo;

    // Despesas por categoria no período
    const despesasPorCategoria = {
        km: despesasPeriodo.filter(d => d.tipo === 'KM').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
        abastecimento: despesasPeriodo.filter(d => d.tipo === 'ABASTECIMENTO').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
        alimentacao: despesasPeriodo.filter(d => d.tipo === 'ALIMENTACAO').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
        hospedagem: despesasPeriodo.filter(d => d.tipo === 'HOSPEDAGEM').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
        pedagio: despesasPeriodo.filter(d => d.tipo === 'PEDAGIO').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
        outros: despesasPeriodo.filter(d => d.tipo === 'OUTROS').reduce((sum: number, d: any) => sum + (Number(d.valor_total) || 0), 0),
    };
    const totalKmRodados = despesasPeriodo.filter(d => d.tipo === 'KM').reduce((sum: number, d: any) => sum + (Number(d.quantidade) || 0), 0);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const loading = isLoadingTecnico || isLoadingOS;

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['os-tecnico'] });
        queryClient.invalidateQueries({ queryKey: ['todas-os-tecnico'] });
    };

    if (!loading && !tecnico && !isGerente) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="p-4 bg-amber-500/10 rounded-full mb-4">
                        <AlertTriangle className="w-12 h-12 text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Perfil Técnico Não Encontrado</h2>
                    <p className="text-[var(--text-muted)] max-w-md">
                        Seu usuário não está vinculado a um cadastro de técnico. Entre em contato com o gerente ou chefe de oficina.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Wrench className="w-8 h-8 text-blue-500" />
                            </div>
                            Painel do Técnico
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-1 ml-1">
                            {isGerente
                                ? 'Monitoramento global de ordens de serviço ativas'
                                : 'Gerenciamento de suas ordens de serviço ativas'}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={refreshData}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        className="bg-[var(--surface-light)] border-[var(--border-subtle)]"
                    >
                        Atualizar Dados
                    </Button>
                </div>

                {/* Tab Navigation */}
                {!isGerente && (
                    <div className="flex items-center gap-1 p-1 bg-[var(--surface-light)] rounded-xl border border-white/5 w-fit">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:bg-white/5'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('os')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'os'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:bg-white/5'
                                }`}
                        >
                            <Wrench className="w-4 h-4" />
                            Minhas OS
                        </button>
                    </div>
                )}

                {/* ========== TAB: DASHBOARD ========== */}
                {(!isGerente && activeTab === 'dashboard') && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Filtro de Período */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Desempenho e Financeiro</h2>
                            <div className="flex bg-[var(--surface-light)] rounded-xl p-1 border border-[var(--border-subtle)] overflow-x-auto scrollbar-hide">
                                {(
                                    [
                                        { id: 'SEMANA', title: '7 Dias' },
                                        { id: 'MES', title: 'Este Mês' },
                                        { id: 'TRIMESTRE', title: 'Trimestre' },
                                        { id: 'SEMESTRE', title: 'Semestre' },
                                        { id: 'ANO', title: 'Este Ano' },
                                        { id: 'TUDO', title: 'Tudo' }
                                    ] as const
                                ).map(op => (
                                    <button
                                        key={op.id}
                                        onClick={() => setPeriodoFiltro(op.id as any)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${periodoFiltro === op.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'}`}
                                    >
                                        {op.title}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card: OS Concluídas */}
                            <div className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-center">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">OS Concluídas</span>
                                <span className="text-3xl font-black text-blue-400 tracking-tight">{osFechadasPeriodo.length}</span>
                            </div>

                            {/* Card: Faturamento */}
                            <div className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-center">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Faturamento</span>
                                <span className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(faturamentoPeriodo)}</span>
                            </div>

                            {/* Card: Despesas */}
                            <div className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-center">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Despesas</span>
                                <span className="text-3xl font-black text-rose-400 tracking-tight">{formatCurrency(totalDespesasPeriodo)}</span>
                            </div>

                            {/* Card: Saldo */}
                            <div className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] flex flex-col justify-center">
                                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Saldo Líquido</span>
                                <span className={`text-3xl font-black tracking-tight ${saldoPeriodo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(saldoPeriodo)}</span>
                            </div>
                        </div>

                        {/* Minhas Despesas */}
                        <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                <CreditCard className="w-5 h-5 text-blue-500" />
                                Minhas Despesas
                            </h3>

                            {loadingDespesas ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                                </div>
                            ) : despesasTecnico.length === 0 ? (
                                <EmptyState icon={CreditCard} title="Sem despesas" description="Nenhuma despesa registrada ainda." />
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Breakdown por categoria */}
                                    <div className="lg:col-span-2 space-y-4">
                                        {[
                                            { tipo: 'KM', label: 'Quilometragem', icon: Car, valor: despesasPorCategoria.km, color: 'blue', extra: `${totalKmRodados.toLocaleString('pt-BR')} km` },
                                            { tipo: 'ABASTECIMENTO', label: 'Abastecimento', icon: Fuel, valor: despesasPorCategoria.abastecimento, color: 'emerald' },
                                            { tipo: 'ALIMENTACAO', label: 'Alimentação', icon: Utensils, valor: despesasPorCategoria.alimentacao, color: 'amber' },
                                            { tipo: 'HOSPEDAGEM', label: 'Hospedagem', icon: Hotel, valor: despesasPorCategoria.hospedagem, color: 'violet' },
                                            { tipo: 'PEDAGIO', label: 'Pedágio', icon: CreditCard, valor: despesasPorCategoria.pedagio, color: 'cyan' },
                                            { tipo: 'OUTROS', label: 'Outros', icon: DollarSign, valor: despesasPorCategoria.outros, color: 'slate' },
                                        ].filter(c => c.valor > 0).map((cat) => {
                                            const Icon = cat.icon;
                                            const percentual = totalDespesasPeriodo > 0 ? Math.round((cat.valor / totalDespesasPeriodo) * 100) : 0;
                                            return (
                                                <div key={cat.tipo} className="flex items-center gap-4 p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl hover:bg-[var(--surface-hover)] transition-all">
                                                    <div className={`p-3 rounded-xl bg-${cat.color}-500/10 border border-${cat.color}-500/20`}>
                                                        <Icon className={`w-5 h-5 text-${cat.color}-400`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">{cat.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                {cat.extra && <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{cat.extra}</span>}
                                                                <span className="text-sm font-black text-emerald-400">{formatCurrency(cat.valor)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-[var(--surface)] rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percentual}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Totalizador */}
                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-br from-blue-600/10 to-blue-500/5 rounded-2xl border border-blue-500/20">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Total no Período</p>
                                            <p className="text-3xl font-black text-white">{formatCurrency(totalDespesasPeriodo)}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">{despesasPeriodo.length} despesas registradas</p>
                                        </div>
                                        <div className="p-6 bg-[var(--surface-light)] rounded-2xl border border-[var(--border-subtle)]">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">KM Total Rodados</p>
                                            <p className="text-3xl font-black text-blue-400">{totalKmRodados.toLocaleString('pt-BR')}</p>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">quilômetros percorridos</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Últimas despesas */}
                        {despesasTecnico.length > 0 && (
                            <div className="glass-card-enterprise p-8 rounded-3xl shadow-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Últimas Despesas Registradas
                                </h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-visao360">
                                    {despesasPeriodo.slice(0, 10).map((desp: any) => (
                                        <div key={desp.id} className="flex items-center justify-between p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black text-[var(--text-primary)] uppercase">{desp.tipo}</span>
                                                        {desp.comprovante_url && (
                                                            <a
                                                                href={desp.comprovante_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                                                title="Ver Comprovante"
                                                            >
                                                                <Paperclip className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    {desp.descricao && <p className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">{desp.descricao}</p>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-emerald-400">{formatCurrency(Number(desp.valor_total) || 0)}</span>
                                                <p className="text-[8px] text-[var(--text-muted)]">{new Date(desp.data_despesa).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========== TAB: MINHAS OS / GERENTE ========== */}
                {(isGerente || activeTab === 'os') && (
                    <div className="space-y-8 animate-fadeIn">

                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card title="Total Ativo" value={estatisticas.totalOS} icon={Wrench} color="blue" priority={1} />
                            <Card title="Em Andamento" value={estatisticas.emAndamento} icon={Clock} color="blue" priority={2} />
                            <Card title="Aguardando Peças" value={estatisticas.aguardandoPecas} icon={Box} color="amber" priority={3} />
                            <Card title="Concluídas" value={estatisticas.concluidas} icon={CheckCircle} color="emerald" priority={4} />
                        </div>

                        {/* Lista de OS */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <LayoutDashboard className="w-4 h-4" />
                                {isGerente ? 'Fila de Trabalho / OS Ativas' : 'Minhas Ordens de Serviço'} ({osAtribuidas.length})
                            </h3>

                            {loading ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-3xl" />)}
                                </div>
                            ) : osAtribuidas.length === 0 ? (
                                <EmptyState
                                    icon={Wrench}
                                    title="Nenhuma OS atribuída"
                                    description="Você não possui ordens de serviço ativas no momento. Aproveite para organizar sua bancada!"
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {osAtribuidas.map((os: any) => (
                                        <div
                                            key={os.id}
                                            className="glass-card-enterprise p-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] transition-all duration-group relative overflow-hidden"
                                        >
                                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                                <div className="flex-1 space-y-4 w-full">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 shadow-sm uppercase tracking-tighter">
                                                            #{os.numero_os}
                                                        </span>
                                                        <StatusBadge status={os.status as any} size="sm" />
                                                        <span className="text-[10px] font-black uppercase text-[var(--text-muted)] flex items-center gap-1.5 bg-[var(--surface)] px-2 py-1.5 rounded-lg border border-[var(--border-subtle)]">
                                                            <RefreshCw className="w-3 h-3" />
                                                            {new Date(os.data_abertura).toLocaleDateString('pt-BR')}
                                                        </span>

                                                        {/* Indicadores Visão 360 */}
                                                        {os.temPecasPendentes && (
                                                            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-1.5 rounded-lg border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                                                                <Box className="w-3 h-3" />
                                                                Peças Pendentes
                                                            </span>
                                                        )}
                                                        {os.todasPecasEntregues && (
                                                            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1.5 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                                                                <CheckCircle className="w-3 h-3" />
                                                                Kit de Peças Pronto
                                                            </span>
                                                        )}
                                                        {veiculoAlocado && (
                                                            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3" />
                                                                Veículo: {veiculoAlocado.placa}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                                                            {os.nome_cliente_digitavel || 'S/ Proprietário'}
                                                        </h4>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-2">
                                                                <Search className="w-4 h-4" />
                                                                {os.modelo_maquina || 'Máquina não identificada'}
                                                            </p>
                                                            {os.pecas_lancadas > 0 && (
                                                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 uppercase tracking-tighter">
                                                                    {os.pecas_lancadas} Peças Lançadas
                                                                </span>
                                                            )}
                                                            {isGerente && os.nome_tecnico && (
                                                                <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 uppercase tracking-tighter flex items-center gap-1.5">
                                                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                                                    Técnico: {os.nome_tecnico}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {os.descricao_problema && (
                                                        <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)]">
                                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                Diagnóstico / Reclamação
                                                            </p>
                                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2 italic">
                                                                "{os.descricao_problema}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>

                                                {!isGerente && (
                                                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[var(--border-subtle)] lg:pl-6">
                                                        {['EM_EXECUCAO', 'PAUSADA', 'AGUARDANDO_PECAS', 'AGUARDANDO_ATRIBUICAO'].includes(os.status) && (
                                                            <>
                                                                <Button
                                                                    variant={os.status === 'EM_EXECUCAO' ? 'secondary' : 'primary'}
                                                                    size="sm"
                                                                    onClick={() => handleUpdateStatus(os.id, os.status === 'EM_EXECUCAO' ? 'PAUSADA' : 'EM_EXECUCAO')}
                                                                    leftIcon={os.status === 'EM_EXECUCAO' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                                    className={os.status === 'EM_EXECUCAO' ? 'border-[var(--border-subtle)] flex-1 lg:flex-none' : 'bg-blue-600 hover:bg-blue-700 text-white flex-1 lg:flex-none'}
                                                                >
                                                                    {os.status === 'EM_EXECUCAO' ? 'Pausar' : 'Iniciar'}
                                                                </Button>
                                                                {os.status === 'EM_EXECUCAO' && (
                                                                    <Button
                                                                        variant="primary"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (confirm("Deseja realmente concluir este serviço? Esta ação enviará a OS para faturamento.")) {
                                                                                handleUpdateStatus(os.id, 'AGUARDANDO_PAGAMENTO');
                                                                            }
                                                                        }}
                                                                        leftIcon={<CheckCircle className="w-4 h-4" />}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 lg:flex-none"
                                                                    >
                                                                        Concluir
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOS(os.id);
                                                                setModalPecaOpen(true);
                                                            }}
                                                            leftIcon={<Box className="w-4 h-4" />}
                                                            className="border-[var(--border-subtle)] opacity-80 hover:opacity-100 flex-1 lg:flex-none"
                                                        >
                                                            Peças
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOS(os.id);
                                                                setSelectedNumeroOS(os.numero_os);
                                                                setModalDespesaOpen(true);
                                                            }}
                                                            leftIcon={<CreditCard className="w-4 h-4" />}
                                                            className="border-[var(--border-subtle)] opacity-80 hover:opacity-100 flex-1 lg:flex-none"
                                                        >
                                                            Custos
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedOSForGallery({ id: os.id, numero: os.numero_os });
                                                            }}
                                                            leftIcon={<ImageIcon className="w-4 h-4" />}
                                                            className="border-[var(--border-subtle)] opacity-80 hover:opacity-100 flex-1 lg:flex-none"
                                                        >
                                                            Fotos
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => navigate(`/os/editar/${os.id}`)}
                                                            leftIcon={<ChevronRight className="w-4 h-4" />}
                                                            className="border-[var(--border-subtle)] p-2 hover:bg-blue-500 hover:text-white transition-colors"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isGerente && (
                            <div className="mt-12 pt-8 border-t border-[var(--border-subtle)]">
                                <AgendaTecnicos />
                            </div>
                        )}

                    </div>
                )}

                <ModalAdicionarPeca
                    isOpen={modalPecaOpen}
                    onClose={() => {
                        setModalPecaOpen(false);
                        setSelectedOS(null);
                    }}
                    osId={selectedOS || ''}
                    onSuccess={refreshData}
                />

                <ModalLancarDespesa
                    isOpen={modalDespesaOpen}
                    onClose={() => {
                        setModalDespesaOpen(false);
                        setSelectedOS(null);
                        setSelectedNumeroOS('');
                    }}
                    osId={selectedOS || ''}
                    osNumero={selectedNumeroOS}
                    onSuccess={refreshData}
                />

                <ModalGaleriaImagens
                    isOpen={!!selectedOSForGallery}
                    osId={selectedOSForGallery?.id || ''}
                    osNumero={selectedOSForGallery?.numero || ''}
                    onClose={() => setSelectedOSForGallery(null)}
                    canUpload={true}
                />
            </div>
        </AppLayout>
    );
}
