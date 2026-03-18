import { logger } from '@/lib/logger';
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
    PieChart as PieChartIcon,
    ShoppingBag,
    History,
    LayoutDashboard,
    Search,
    Wrench,
    ArrowRight,
    FileDown,
    Image as ImageIcon,
    Package
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { StatusOS, TipoOS } from '@/types/database.types';
import { Paperclip } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { DistribuicaoOperacionalChart } from '@/components/ui/Charts';
import { PedidoPeca } from '@/components/consultor/PedidoPeca';
import { ModalGaleriaImagens } from '@/components/ui/ModalGaleriaImagens';
import { ModalHistoricoOS } from '@/components/ui/ModalHistoricoOS';
import { ModalTriagemPecas } from '@/components/ui/ModalTriagemPecas';
import { ModalAprovacaoPecas } from '@/components/ui/ModalAprovacaoPecas';
import { Card } from '@/components/ui/Card';

import { useAuth } from '@/hooks/useAuth';

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
    chassi: string | null;
    data_abertura: string;
    valor_liquido_total: number;
    dias_em_aberto: number;
    tecnico?: {
        nome: string;
        veiculos?: { placa: string }[];
    };
    link_pdf_os?: string | null;
    data_faturamento?: string | null;
}

const statusLabels: Record<StatusOS, string> = {
    'AGUARDANDO_ATRIBUICAO': 'Aguard. Atribuição',
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
    const { profile } = useAuth();
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'servicos' | 'faturadas' | 'pedidos' | 'aprovacao'>('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOSForGallery, setSelectedOSForGallery] = useState<{ id: string, numero: string } | null>(null);
    const [selectedOSForHistorico, setSelectedOSForHistorico] = useState<{ id: string; numero: string } | null>(null);
    const [osComPecasPendentes, setOsComPecasPendentes] = useState<any[]>([]);
    const [selectedOSTriagem, setSelectedOSTriagem] = useState<any | null>(null);
    const [osComAprovacaoPendente, setOsComAprovacaoPendente] = useState<any[]>([]);
    const [selectedOSAprovacao, setSelectedOSAprovacao] = useState<any | null>(null);

    const isGerente = ['GERENTE', 'CHEFE_OFICINA'].includes(profile?.role?.toUpperCase() || '');
    const isGarantia = profile?.role?.toUpperCase() === 'CONSULTOR_GARANTIA';
    const isPosVenda = profile?.role?.toUpperCase() === 'CONSULTOR_POS_VENDA';
    const isConsultorNormal = !isGerente && !isGarantia;

    // Carregar OS do consultor com filtros de cargo
    const carregarDados = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('ordens_servico')
                .select(`
                    *,
                    tecnico:tecnicos(*),
                    despesas:despesas_os(comprovante_url)
                `)
                .order('data_abertura', { ascending: false });

            // 1. Filtro por Cargo (Segregação de Dados Garantia vs Normal)
            if (!isGerente && profile?.id) {
                const tipo = isGarantia ? 'GARANTIA' : 'NORMAL';
                query = query.eq('tipo_os', tipo);
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
            const abertas = todasOS.filter((o: any) => !['CONCLUIDA', 'FATURADA', 'CANCELADA', 'AGUARDANDO_PAGAMENTO'].includes(o.status_atual));
            const concluidas = todasOS.filter((o: any) => ['CONCLUIDA', 'FATURADA', 'AGUARDANDO_PAGAMENTO'].includes(o.status_atual));

            const limite60Dias = new Date();
            limite60Dias.setDate(limite60Dias.getDate() - 60);
            const criticas = abertas.filter((o: any) => new Date(o.data_abertura) < limite60Dias);

            setEstatisticas({
                totalOS: todasOS.length,
                osAbertas: abertas.length,
                osConcluidas: concluidas.length,
                valorAberto: abertas.reduce((sum: number, o: any) => sum + (Number(o.valor_liquido_total) || 0), 0),
                valorFaturado: todasOS
                    .filter((o: any) => o.status_atual === 'FATURADA')
                    .reduce((sum: number, o: any) => sum + (Number(o.valor_liquido_total) || 0), 0),
                osCriticas: criticas.length,
            });

        } catch (error) {
            logger.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile) carregarDados();
    }, [profile?.role, profile?.id]);

    // Carregar peças pendentes de triagem
    const carregarPecasPendentes = async () => {
        try {
            let query = supabase
                .from('itens_os')
                .select('*, ordens_servico!inner(id, numero_os, nome_cliente_digitavel, modelo_maquina, tipo_os)')
                .eq('status_separacao', 'PENDENTE')
                .eq('status_aprovacao', 'APROVADO');

            if (!isGerente && profile?.id) {
                const tipo = isGarantia ? 'GARANTIA' : 'NORMAL';
                query = query.eq('ordens_servico.tipo_os', tipo);
            }

            const { data: itens, error } = await query;

            if (error) throw error;

            // Agrupar por OS
            const osMap = new Map<string, any>();
            (itens || []).forEach((item: any) => {
                const os = item.ordens_servico;
                if (!os) return;
                if (!osMap.has(os.id)) {
                    osMap.set(os.id, {
                        id: os.id,
                        numero_os: os.numero_os,
                        nome_cliente_digitavel: os.nome_cliente_digitavel,
                        modelo_maquina: os.modelo_maquina,
                        itens: []
                    });
                }
                osMap.get(os.id).itens.push({
                    id: item.id,
                    ordem_servico_id: item.ordem_servico_id,
                    codigo_peca: item.codigo_peca,
                    descricao: item.descricao,
                    quantidade: item.quantidade,
                    status_separacao: item.status_separacao,
                    valor_unitario: item.valor_unitario
                });
            });

            setOsComPecasPendentes(Array.from(osMap.values()));
        } catch (error) {
            logger.error('Erro ao carregar peças pendentes:', error);
        }
    };

    const carregarPecasAprovacaoPendentes = async () => {
        if (isGarantia) return; // Garantia não tem aprovação de peças financeira
        try {
            let query = supabase
                .from('itens_os')
                .select('*, ordens_servico!inner(id, numero_os, nome_cliente_digitavel, modelo_maquina, tipo_os)')
                .eq('status_aprovacao', 'PENDENTE_CONSULTOR');

            if (!isGerente && profile?.id) {
                query = query.eq('ordens_servico.tipo_os', 'NORMAL');
            }

            const { data: itens, error } = await query;
            if (error) throw error;

            // Agrupar por OS
            const osMap = new Map<string, any>();
            (itens || []).forEach((item: any) => {
                const os = item.ordens_servico;
                if (!os) return;
                if (!osMap.has(os.id)) {
                    osMap.set(os.id, {
                        id: os.id,
                        numero_os: os.numero_os,
                        nome_cliente_digitavel: os.nome_cliente_digitavel,
                        modelo_maquina: os.modelo_maquina,
                        itens: []
                    });
                }
                osMap.get(os.id).itens.push(item);
            });

            setOsComAprovacaoPendente(Array.from(osMap.values()));
        } catch (error) {
            logger.error('Erro ao carregar peças pendentes de aprovação:', error);
        }
    };

    useEffect(() => {
        carregarPecasPendentes();
        carregarPecasAprovacaoPendentes();
    }, [isGarantia]);

    // Filtragem baseada na aba ativa
    const osFiltrada = osList.filter(os => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            os.numero_os.toLowerCase().includes(searchLower) ||
            (os.nome_cliente_digitavel || '').toLowerCase().includes(searchLower) ||
            (os.chassi || '').toLowerCase().includes(searchLower) ||
            (os.modelo_maquina || '').toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        if (activeTab === 'servicos') {
            const isAberta = !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(os.status_atual);
            if (!isAberta) return false;
            if (filtroStatus === 'ABERTAS' || !filtroStatus) return true;
            return os.status_atual === filtroStatus;
        }
        if (activeTab === 'faturadas') return os.status_atual === 'FATURADA';
        return true;
    });

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
                            Gestão Técnica {isGarantia ? '- Garantia' : isPosVenda ? '- Pós-Venda' : ''}
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">
                            {isGerente ? 'Consolidado operacional e financeiro' : `Atendimento ${isGarantia ? 'Garantia' : 'Normal'}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (isConsultorNormal) navigate('/orcamentos/novo');
                                else navigate('/os/nova');
                            }}
                            leftIcon={<Plus className="w-4 h-4" />}
                            className="shadow-lg shadow-blue-500/20"
                        >
                            {isConsultorNormal ? 'Novo Orçamento' : 'Nova OS'}
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

                {/* Tabs & Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[var(--surface-light)]/50 backdrop-blur-md border border-white/5 rounded-2xl w-full lg:w-fit">
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'dashboard'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Painel
                        </button>
                        <button
                            onClick={() => setActiveTab('servicos')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'servicos'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <Wrench className="w-4 h-4" />
                            Serviços
                        </button>
                        <button
                            onClick={() => setActiveTab('faturadas')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap ${activeTab === 'faturadas'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Faturadas
                        </button>
                        <button
                            onClick={() => setActiveTab('pedidos')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap relative ${activeTab === 'pedidos'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Triagem Peças
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                {osComPecasPendentes.reduce((sum, os) => sum + os.itens.length, 0) || osList.filter(o => o.status_atual === 'AGUARDANDO_PECAS').length}
                            </span>
                        </button>
                        {!isGarantia && (
                            <button
                                onClick={() => setActiveTab('aprovacao')}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all whitespace-nowrap relative ${activeTab === 'aprovacao'
                                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                    }`}
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Aprovação
                                {osComAprovacaoPendente.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                        {osComAprovacaoPendente.reduce((sum, os) => sum + os.itens.length, 0)}
                                    </span>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-[400px]">
                        <div className="relative group w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-all" />
                            <input
                                type="text"
                                placeholder="Busca por OS, Cliente, Chassi..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-8 animate-slideUp">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            <Card
                                title="Total OS"
                                value={estatisticas.totalOS}
                                icon={FileText}
                                color="blue"
                                priority={1}
                            />
                            <Card
                                title="Em Aberto"
                                value={estatisticas.osAbertas}
                                icon={Clock}
                                color="blue"
                                priority={2}
                            />
                            <Card
                                title="Concluídas"
                                value={estatisticas.osConcluidas}
                                icon={CheckCircle}
                                color="emerald"
                                priority={3}
                            />
                            <Card
                                title="Críticas"
                                value={estatisticas.osCriticas}
                                icon={AlertTriangle}
                                color={estatisticas.osCriticas > 0 ? "rose" : "blue"}
                                priority={4}
                            />
                            <Card
                                title="Vlr. Aberto"
                                value={formatCurrency(estatisticas.valorAberto)}
                                icon={DollarSign}
                                color="amber"
                                priority={5}
                            />
                            <Card
                                title="Faturado"
                                value={formatCurrency(estatisticas.valorFaturado)}
                                icon={TrendingUp}
                                color="violet"
                                priority={6}
                            />
                        </div>

                        {/* Operational Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    <PieChartIcon className="w-32 h-32 text-blue-500" />
                                </div>
                                <h2 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-blue-500/30 rounded-full" />
                                    Distribuição Operacional
                                </h2>
                                {!loading ? (
                                    <DistribuicaoOperacionalChart
                                        data={[
                                            { name: 'Peças', value: osList.filter(o => o.status_atual === 'AGUARDANDO_PECAS').length, color: '#60A5FA' },
                                            { name: 'Serviço', value: osList.filter(o => ['EM_EXECUCAO', 'EM_DIAGNOSTICO', 'PAUSADA', 'EM_TRANSITO'].includes(o.status_atual)).length, color: '#FBBF24' },
                                            { name: 'Adm', value: osList.filter(o => ['CONCLUIDA', 'AGUARDANDO_APROVACAO_ORCAMENTO', 'AGUARDANDO_PAGAMENTO'].includes(o.status_atual)).length, color: '#4ADE80' },
                                            { name: 'Fábrica', value: osList.filter(o => o.tipo_os === 'GARANTIA').length, color: '#A78BFA' }
                                        ]}
                                    />
                                ) : (
                                    <Skeleton width="100%" height={300} className="rounded-xl" />
                                )}
                            </div>

                            <div className="glass-card-enterprise p-8 rounded-3xl border border-white/[0.03] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                    <AlertTriangle className="w-32 h-32 text-rose-500" />
                                </div>
                                <h2 className="text-sm font-black text-rose-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <span className="w-8 h-[2px] bg-rose-500/30 rounded-full" />
                                    Criticidade (SLA)
                                </h2>
                                {!loading ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">OS Extrapoladas</p>
                                                    <p className="text-xs text-[var(--text-muted)]">+60 dias em aberto</p>
                                                </div>
                                            </div>
                                            <span className="text-3xl font-black text-rose-500">{estatisticas.osCriticas}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                    <Clock className="w-6 h-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">No Prazo</p>
                                                    <p className="text-xs text-[var(--text-muted)]">Fluxo em conformidade</p>
                                                </div>
                                            </div>
                                            <span className="text-3xl font-black text-emerald-500">{estatisticas.osAbertas - estatisticas.osCriticas}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <Skeleton width="100%" height={200} className="rounded-xl" />
                                )}
                            </div>
                        </div>
                    </div>
                ) : activeTab === 'aprovacao' ? (
                    <div className="space-y-8 animate-slideUp">
                        {osComAprovacaoPendente.length === 0 ? (
                            <div className="py-24 text-center">
                                <div className="max-w-xs mx-auto opacity-30">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-white">Nenhuma peça pendente de aprovação</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Peças Pendentes de Aprovação</h2>
                                        <p className="text-xs text-[var(--text-muted)]">Reveja as solicitações feitas pelos técnicos antes de irem para o estoque</p>
                                    </div>
                                    <span className="ml-auto px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                                        {osComAprovacaoPendente.reduce((sum: number, os: any) => sum + os.itens.length, 0)} solicitações
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {osComAprovacaoPendente.map((os: any) => (
                                        <div
                                            key={os.id}
                                            onClick={() => setSelectedOSAprovacao(os)}
                                            className="glass-card-enterprise p-5 rounded-2xl border border-amber-500/15 hover:border-amber-500/30 cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                                                    OS #{os.numero_os}
                                                </span>
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold border border-amber-500/20">
                                                    {os.itens.length} peça{os.itens.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white mb-1 truncate">{os.nome_cliente_digitavel || 'Cliente'}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{os.modelo_maquina || ''}</p>
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-[10px] text-[var(--text-muted)] group-hover:text-amber-400 transition-colors">Clique para iniciar aprovação →</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'pedidos' ? (
                    <div className="space-y-8 animate-slideUp">
                        {/* Seção: Peças Pendentes de Triagem */}
                        {osComPecasPendentes.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <Package className="w-6 h-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Peças Aguardando Triagem</h2>
                                        <p className="text-xs text-[var(--text-muted)]">Decida se cada peça será retirada do estoque ou solicitada para compra</p>
                                    </div>
                                    <span className="ml-auto px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-bold border border-amber-500/20">
                                        {osComPecasPendentes.reduce((sum: number, os: any) => sum + os.itens.length, 0)} peças
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {osComPecasPendentes.map((os: any) => (
                                        <div
                                            key={os.id}
                                            onClick={() => setSelectedOSTriagem(os)}
                                            className="glass-card-enterprise p-5 rounded-2xl border border-amber-500/15 hover:border-amber-500/30 cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                                                    OS #{os.numero_os}
                                                </span>
                                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold border border-amber-500/20">
                                                    {os.itens.length} peça{os.itens.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-white mb-1 truncate">{os.nome_cliente_digitavel || 'Cliente'}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{os.modelo_maquina || ''}</p>
                                            <div className="mt-3 pt-3 border-t border-white/5">
                                                <p className="text-[10px] text-[var(--text-muted)] group-hover:text-amber-400 transition-colors">Clique para fazer a triagem →</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Separador */}
                        {osComPecasPendentes.length > 0 && (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-white/5"></div>
                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Solicitações de Compra</span>
                                <div className="flex-1 h-px bg-white/5"></div>
                            </div>
                        )}

                        {/* PedidoPeca original */}
                        <PedidoPeca />
                    </div>
                ) : (
                    <div className="space-y-6 animate-slideUp">
                        {/* List Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                {activeTab === 'servicos' ? <Wrench className="w-6 h-6 text-blue-500" /> : <History className="w-6 h-6 text-violet-500" />}
                                {activeTab === 'servicos' ? 'Ordens em Aberto' : 'Histórico de Faturamento'}
                                <span className="ml-2 px-2 py-0.5 bg-white/5 rounded-lg text-sm text-[var(--text-muted)] font-mono">
                                    {osFiltrada.length}
                                </span>
                            </h2>

                            {activeTab === 'servicos' && (
                                <div className="flex items-center gap-2 p-1 bg-[var(--surface-light)] rounded-xl border border-white/5 overflow-x-auto">
                                    <button onClick={() => setFiltroStatus('ABERTAS')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === 'ABERTAS' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:bg-white/5'}`}>Abertas</button>
                                    {Object.entries(statusLabels).filter(([k]) => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(k)).map(([value, label]) => (
                                        <button key={value} onClick={() => setFiltroStatus(value as StatusOS)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filtroStatus === value ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:bg-white/5'}`}>{label}</button>
                                    ))}
                                    <button onClick={() => setFiltroStatus('')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === '' ? 'bg-blue-600 text-white' : 'text-[var(--text-muted)] hover:bg-white/5'}`}>Todas</button>
                                </div>
                            )}
                        </div>

                        {/* Enhanced Table */}
                        <div className="glass-card-enterprise rounded-3xl overflow-hidden shadow-2xl border-white/[0.03] bg-[var(--surface-light)]/30 backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">OS</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Padrão</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Cliente</th>
                                            {activeTab === 'faturadas' && <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Técnico</th>}
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Máquina</th>
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</th>
                                            {activeTab === 'servicos' && <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">SLC</th>}
                                            {activeTab === 'faturadas' && <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Faturamento</th>}
                                            <th className="px-6 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Receita</th>
                                            <th className="px-6 py-5 text-center text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.03]">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={10} className="px-6 py-6"><Skeleton width="100%" height={32} className="rounded-xl" /></td></tr>)
                                        ) : osFiltrada.length === 0 ? (
                                            <tr>
                                                <td colSpan={10} className="px-6 py-24 text-center">
                                                    <div className="max-w-xs mx-auto opacity-30">
                                                        <Search className="w-12 h-12 mx-auto mb-4" />
                                                        <p className="text-sm font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            osFiltrada.map((os) => (
                                                <tr key={os.id} className={`group hover:bg-white/[0.03] transition-all ${!isGerente ? 'cursor-pointer' : ''}`}>
                                                    <td className="px-6 py-6" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                                            <span className="font-black text-white text-base">#{os.numero_os}</span>
                                                            {(os as any).despesas?.some((d: any) => d.comprovante_url) && (
                                                                <span title="Possui comprovantes de despesa">
                                                                    <Paperclip className="w-3 h-3 text-blue-400 opacity-60" />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}>
                                                        <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-lg border border-white/5 w-fit">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${os.tipo_os === 'GARANTIA' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                            <span className="text-[10px] font-black uppercase text-gray-300">{os.tipo_os}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}>
                                                        <span className="text-sm font-bold text-gray-200 block truncate max-w-[150px]">{os.nome_cliente_digitavel || '-'}</span>
                                                    </td>
                                                    {activeTab === 'faturadas' && (
                                                        <td className="px-6 py-6">
                                                            <span className="text-xs font-medium text-gray-400">{os.tecnico?.nome || '-'}</span>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-6 text-sm font-medium text-[var(--text-muted)] italic" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}>{os.modelo_maquina || '-'}</td>
                                                    <td className="px-6 py-6" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}><StatusBadge status={os.status_atual as any} /></td>
                                                    {activeTab === 'servicos' && <td className="px-6 py-6 text-sm font-black text-gray-400">{os.dias_em_aberto}d</td>}
                                                    {activeTab === 'faturadas' && (
                                                        <td className="px-6 py-6 text-xs text-gray-400">
                                                            {os.data_faturamento ? new Date(os.data_faturamento).toLocaleDateString() : '-'}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-6 font-black text-emerald-400 text-base" onClick={() => !isGerente && navigate(`/os/editar/${os.id}`)}>{formatCurrency(os.valor_liquido_total)}</td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {activeTab === 'faturadas' && os.link_pdf_os && (
                                                                <a
                                                                    href={os.link_pdf_os}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-2 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all border border-violet-500/20"
                                                                    title="Ver PDF"
                                                                >
                                                                    <FileDown className="w-4 h-4" />
                                                                </a>
                                                            )}
                                                            <button
                                                                onClick={() => setSelectedOSForGallery({ id: os.id, numero: os.numero_os })}
                                                                className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all border border-blue-500/20"
                                                                title="Ver Anexos"
                                                            >
                                                                <ImageIcon className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedOSForHistorico({ id: os.id, numero: os.numero_os })}
                                                                className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all border border-amber-500/20"
                                                                title="Ver Histórico/Pipeline"
                                                            >
                                                                <History className="w-4 h-4" />
                                                            </button>
                                                            {!isGerente && (
                                                                <button
                                                                    onClick={() => navigate(`/os/editar/${os.id}`)}
                                                                    className="p-2 rounded-xl bg-white/5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </button>
                                                            )}
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
                )}

                {/* Modais */}
                <ModalGaleriaImagens
                    isOpen={!!selectedOSForGallery}
                    osId={selectedOSForGallery?.id || ''}
                    osNumero={selectedOSForGallery?.numero || ''}
                    onClose={() => setSelectedOSForGallery(null)}
                />

                {selectedOSForHistorico && (
                    <ModalHistoricoOS
                        isOpen={!!selectedOSForHistorico}
                        onClose={() => setSelectedOSForHistorico(null)}
                        osId={selectedOSForHistorico.id}
                        osNumero={selectedOSForHistorico.numero}
                    />
                )}

                {/* Modal Triagem de Peças */}
                {selectedOSTriagem && (
                    <ModalTriagemPecas
                        isOpen={!!selectedOSTriagem}
                        onClose={() => setSelectedOSTriagem(null)}
                        os={selectedOSTriagem}
                        onSuccess={() => {
                            carregarPecasPendentes();
                            carregarDados();
                        }}
                    />
                )}
                {selectedOSAprovacao && (
                    <ModalAprovacaoPecas
                        os={selectedOSAprovacao}
                        onClose={() => setSelectedOSAprovacao(null)}
                        onSuccess={() => {
                            setSelectedOSAprovacao(null);
                            carregarPecasAprovacaoPendentes();
                            carregarPecasPendentes(); // Para o Estoque já ver
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
