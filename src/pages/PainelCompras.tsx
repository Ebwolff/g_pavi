import { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Calendar,
    MoreHorizontal,
    Plus
} from 'lucide-react';
import { comprasService, SolicitacaoCompra } from '@/services/compras.service';
import { StatusSolicitacaoCompra, UrgenciaCompra } from '@/types/database.types';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge, CustomBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { MetricCard } from '@/components/cognitive-bias';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { PackageOpen } from 'lucide-react';

// Helper para formatar data
const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
};

// Helper para formatar valor
// Helper para formatar valor (Unused removed)

export default function PainelCompras() {
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacaoCompra | ''>('');
    const [filtroUrgencia, setFiltroUrgencia] = useState<UrgenciaCompra | ''>('');
    const [busca, setBusca] = useState('');
    const [estatisticas, setEstatisticas] = useState({
        pendentes: 0,
        emCotacao: 0,
        aguardandoEntrega: 0,
        entreguesHoje: 0,
        valorTotalPendente: 0,
    });

    // Carregar dados
    const carregarDados = async () => {
        setLoading(true);
        try {
            const [dados, stats] = await Promise.all([
                comprasService.getSolicitacoes({
                    status: filtroStatus || undefined,
                    urgencia: filtroUrgencia || undefined,
                }),
                comprasService.getEstatisticas(),
            ]);
            setSolicitacoes(dados);
            setEstatisticas(stats);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [filtroStatus, filtroUrgencia]);

    // Filtrar por busca
    const solicitacoesFiltradas = solicitacoes.filter(s => {
        if (!busca) return true;
        const termoBusca = busca.toLowerCase();
        return (
            s.descricao_peca?.toLowerCase().includes(termoBusca) ||
            s.codigo_peca?.toLowerCase().includes(termoBusca) ||
            s.numero_os?.toLowerCase().includes(termoBusca) ||
            s.cliente?.toLowerCase().includes(termoBusca) ||
            s.fornecedor?.toLowerCase().includes(termoBusca)
        );
    });

    // Atualizar status
    const handleAtualizarStatus = async (id: string, novoStatus: StatusSolicitacaoCompra) => {
        try {
            await comprasService.atualizarStatus(id, novoStatus);
            carregarDados();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    // Definir previsão
    const handleDefinirPrevisao = async (id: string, data: string) => {
        try {
            await comprasService.definirPrevisaoEntrega(id, data);
            carregarDados();
        } catch (error) {
            console.error('Erro ao definir previsão:', error);
        }
    };

    return (
        <AppLayout>
            <div className="p-6 md:p-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <ShoppingCart className="w-8 h-8 text-blue-500" />
                            Painel de Compras
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 font-medium">Gestão de Peças e Suprimentos</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={carregarDados}
                            isLoading={loading}
                            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                        >
                            Atualizar
                        </Button>
                        <Button
                            variant="primary"
                            leftIcon={<Plus className="w-5 h-5" />}
                        >
                            Nova Solicitação
                        </Button>
                    </div>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => <Skeleton key={i} height={140} className="rounded-xl" />)
                    ) : (
                        <>
                            <MetricCard
                                label="Pendentes"
                                value={estatisticas.pendentes}
                                trend={estatisticas.pendentes > 5 ? 'down' : 'stable'}
                                format="number"
                                className="border-amber-500/20"
                            />
                            <MetricCard
                                label="Em Cotação"
                                value={estatisticas.emCotacao}
                                trend="up"
                                format="number"
                                className="border-blue-500/20"
                            />
                            <MetricCard
                                label="Aguardando"
                                value={estatisticas.aguardandoEntrega}
                                format="number"
                                className="border-orange-500/20"
                            />
                            <MetricCard
                                label="Entregues"
                                value={estatisticas.entreguesHoje}
                                trend="up"
                                format="number"
                                className="border-emerald-500/20"
                            />
                            <MetricCard
                                label="Valor Pendente"
                                value={estatisticas.valorTotalPendente}
                                format="currency"
                                className="border-violet-500/20"
                            />
                        </>
                    )}
                </div>

                {/* Filtros Section */}
                <div className="glass-card-enterprise p-5 md:p-6 rounded-2xl mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Busca */}
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                Pesquisar Peças / OS
                            </label>
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Descrição, código, OS ou cliente..."
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Filtro Status */}
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                Filtrar Status
                            </label>
                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value as StatusSolicitacaoCompra | '')}
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-[#0f172a]">Todos os Status</option>
                                <option value="PENDENTE" className="bg-[#0f172a]">Pendente</option>
                                <option value="EM_COTACAO" className="bg-[#0f172a]">Em Cotação</option>
                                <option value="APROVADO" className="bg-[#0f172a]">Aprovado</option>
                                <option value="COMPRADO" className="bg-[#0f172a]">Comprado</option>
                                <option value="AGUARDANDO_ENTREGA" className="bg-[#0f172a]">Aguardando Entrega</option>
                                <option value="ENTREGUE" className="bg-[#0f172a]">Entregue</option>
                                <option value="CANCELADO" className="bg-[#0f172a]">Cancelado</option>
                            </select>
                        </div>

                        {/* Filtro Urgência */}
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 ml-1">
                                Urgência
                            </label>
                            <select
                                value={filtroUrgencia}
                                onChange={(e) => setFiltroUrgencia(e.target.value as UrgenciaCompra | '')}
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-[var(--text-secondary)] transition-all font-medium appearance-none cursor-pointer"
                            >
                                <option value="" className="bg-[#0f172a]">Todas</option>
                                <option value="BAIXA" className="bg-[#0f172a]">Baixa</option>
                                <option value="MEDIA" className="bg-[#0f172a]">Média</option>
                                <option value="ALTA" className="bg-[#0f172a]">Alta</option>
                                <option value="URGENTE" className="bg-[#0f172a]">Urgente</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabela de Solicitações */}
                <div className="glass-card-enterprise rounded-2xl overflow-hidden">
                    <Table>
                        <THead>
                            <TR>
                                <TH>Urgência</TH>
                                <TH>Peça</TH>
                                <TH>OS / Cliente</TH>
                                <TH className="text-center">Qtd</TH>
                                <TH>SLA</TH>
                                <TH>Status</TH>
                                <TH>Previsão</TH>
                                <TH className="text-right">Ações</TH>
                            </TR>
                        </THead>
                        <TBody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map((i) => (
                                    <TR key={i}>
                                        <TD><Skeleton width={80} height={20} /></TD>
                                        <TD><Skeleton width={120} height={20} /></TD>
                                        <TD><Skeleton width={150} height={20} /></TD>
                                        <TD className="text-center"><Skeleton width={40} height={20} className="mx-auto" /></TD>
                                        <TD><Skeleton width={40} height={20} /></TD>
                                        <TD><Skeleton width={100} height={20} /></TD>
                                        <TD><Skeleton width={80} height={20} /></TD>
                                        <TD className="text-right"><Skeleton width={80} height={32} className="ml-auto" /></TD>
                                    </TR>
                                ))
                            ) : solicitacoesFiltradas.length === 0 ? (
                                <TR>
                                    <TD colSpan={8} className="py-20 text-center">
                                        <EmptyState
                                            icon={PackageOpen}
                                            title="Nenhuma solicitação encontrada"
                                            description="Você não possui solicitações ativas ou que correspondam aos filtros aplicados."
                                            className="py-0"
                                        />
                                    </TD>
                                </TR>
                            ) : (
                                solicitacoesFiltradas.map((sol) => (
                                    <TR key={sol.id}>
                                        {/* Urgência */}
                                        <TD>
                                            <CustomBadge
                                                label={sol.urgencia}
                                                variant={
                                                    sol.urgencia === 'URGENTE' ? 'red' :
                                                        sol.urgencia === 'ALTA' ? 'orange' :
                                                            sol.urgencia === 'MEDIA' ? 'blue' : 'gray'
                                                }
                                                className={sol.urgencia === 'URGENTE' ? 'animate-pulse' : ''}
                                            />
                                        </TD>

                                        {/* Peça */}
                                        <TD>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[var(--text-primary)]">{sol.descricao_peca}</span>
                                                {sol.codigo_peca && (
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest mt-0.5 uppercase">
                                                        COD: {sol.codigo_peca}
                                                    </span>
                                                )}
                                            </div>
                                        </TD>

                                        {/* OS / Cliente */}
                                        <TD>
                                            <div className="flex flex-col">
                                                {sol.numero_os && (
                                                    <span className="font-bold text-blue-400">OS {sol.numero_os}</span>
                                                )}
                                                <span className="text-xs text-[var(--text-muted)] truncate max-w-[180px]">
                                                    {sol.cliente || 'Sem OS vinculada'}
                                                </span>
                                            </div>
                                        </TD>

                                        {/* Quantidade */}
                                        <TD className="text-center font-bold text-[var(--text-primary)]">
                                            {sol.quantidade} <span className="text-[10px] text-[var(--text-muted)] ml-0.5">{sol.unidade}</span>
                                        </TD>

                                        {/* Dias aguardando */}
                                        <TD>
                                            <span className={`font-bold ${(sol.dias_aguardando || 0) > 7 ? 'text-rose-500' : (sol.dias_aguardando || 0) > 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                {sol.dias_aguardando || 0}d
                                            </span>
                                        </TD>

                                        {/* Status */}
                                        <TD>
                                            <StatusBadge status={sol.status as any} />
                                        </TD>

                                        {/* Previsão */}
                                        <TD>
                                            {sol.data_previsao_entrega ? (
                                                <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                                    {formatDate(sol.data_previsao_entrega)}
                                                </div>
                                            ) : (
                                                <input
                                                    type="date"
                                                    onChange={(e) => handleDefinirPrevisao(sol.id, e.target.value)}
                                                    className="bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded px-2 py-1 text-[10px] text-[var(--text-secondary)] focus:border-blue-500 outline-none"
                                                />
                                            )}
                                        </TD>

                                        {/* Ações */}
                                        <TD className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {sol.status === 'PENDENTE' && (
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleAtualizarStatus(sol.id, 'EM_COTACAO')}
                                                    >
                                                        Cotar
                                                    </Button>
                                                )}
                                                {sol.status === 'AGUARDANDO_ENTREGA' && (
                                                    <Button
                                                        size="sm"
                                                        variant="primary"
                                                        onClick={() => handleAtualizarStatus(sol.id, 'ENTREGUE')}
                                                    >
                                                        Entregar
                                                    </Button>
                                                )}
                                                <button className="p-2 rounded-lg bg-[var(--surface-light)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-blue-500 transition-all">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))
                            )}
                        </TBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
