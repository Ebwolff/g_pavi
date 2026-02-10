import { useState } from 'react';
import {
    Package,
    CheckCircle,
    ShoppingCart,
    RefreshCw,
    AlertTriangle,
    Search,
    Filter,
    ArrowUpRight,
    Box
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { almoxarifadoService, PecaPendente } from '@/services/almoxarifado.service';
import { Input } from '@/components/ui/Input';

export default function PainelAlmoxarifado() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroDisponibilidade, setFiltroDisponibilidade] = useState<string>('');

    // Fetch Data
    const { data: pecas = [], isLoading } = useQuery({
        queryKey: ['pecas-pendentes'],
        queryFn: almoxarifadoService.getPecasPendentes
    });

    // Mutations
    const separarMutation = useMutation({
        mutationFn: async ({ itemId, codigoPeca, quantidade }: { itemId: string, codigoPeca: string, quantidade: number }) => {
            await almoxarifadoService.separarPeca(itemId, codigoPeca, quantidade);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pecas-pendentes'] });
        },
        onError: (error: any) => {
            alert(`Erro ao separar peça: ${error.message}`);
        }
    });

    const solicitarCompraMutation = useMutation({
        mutationFn: async (peca: PecaPendente) => {
            await almoxarifadoService.solicitarCompra({
                item_id: peca.item_id,
                ordem_servico_id: peca.ordem_servico_id,
                codigo_peca: peca.codigo_peca,
                descricao_peca: peca.descricao,
                quantidade: peca.quantidade,
                unidade: peca.unidade
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pecas-pendentes'] });
        },
        onError: (error: any) => {
            alert(`Erro ao solicitar compra: ${error.message}`);
        }
    });

    // Filtering
    const pecasFiltradas = pecas.filter(p => {
        const matchesSearch =
            p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo_peca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.numero_os.includes(searchTerm) ||
            p.cliente.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDisp = filtroDisponibilidade ? p.disponibilidade === filtroDisponibilidade : true;

        return matchesSearch && matchesDisp;
    });

    // Stats
    const estatisticas = {
        totalPendentes: pecas.filter(p => p.status_separacao === 'PENDENTE').length,
        disponiveis: pecas.filter(p => p.disponibilidade === 'DISPONIVEL').length,
        indisponiveis: pecas.filter(p => p.disponibilidade === 'INDISPONIVEL').length,
        parciais: pecas.filter(p => p.disponibilidade === 'PARCIAL').length,
        aguardandoCompra: pecas.filter(p => p.status_separacao === 'AGUARDANDO_COMPRA').length
    };

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                <Package className="w-8 h-8 text-purple-500" />
                            </div>
                            Almoxarifado
                        </h1>
                        <p className="text-[var(--text-muted)] font-medium mt-2 ml-1">
                            Controle de separação de peças e gestão de estoque
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['pecas-pendentes'] })}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                    >
                        Atualizar Lista
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card
                        title="Total Pendente"
                        value={estatisticas.totalPendentes}
                        icon={Box}
                        trend={{ value: 0, label: 'itens', isPositive: false }}
                        color="violet"
                        priority={0}
                    />
                    <Card
                        title="Em Estoque"
                        value={estatisticas.disponiveis}
                        icon={CheckCircle}
                        trend={{ value: 0, label: 'para separar', isPositive: true }}
                        color="emerald"
                        priority={1}
                    />
                    <Card
                        title="Indisponíveis"
                        value={estatisticas.indisponiveis}
                        icon={AlertTriangle}
                        trend={{ value: 0, label: 'em falta', isPositive: false }}
                        color="rose"
                        priority={2}
                    />
                    <Card
                        title="Parciais"
                        value={estatisticas.parciais}
                        icon={ArrowUpRight}
                        trend={{ value: 0, label: 'saldo insuficiente', isPositive: false }}
                        color="amber"
                        priority={3}
                    />
                    <Card
                        title="Em Compra"
                        value={estatisticas.aguardandoCompra}
                        icon={ShoppingCart}
                        trend={{ value: 0, label: 'solicitados', isPositive: true }}
                        color="blue"
                        priority={4}
                    />
                </div>

                {/* Filtros e Busca */}
                <div className="flex flex-col md:flex-row gap-4 items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div className="flex-1 w-full">
                        <Input
                            placeholder="Buscar por peça, código, cliente ou OS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={Search}
                            className="bg-transparent border-none focus:ring-0"
                        />
                    </div>
                    <div className="h-8 w-px bg-white/10 hidden md:block" />
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                        <select
                            value={filtroDisponibilidade}
                            onChange={(e) => setFiltroDisponibilidade(e.target.value)}
                            className="bg-transparent text-sm text-[var(--text-primary)] border-none focus:ring-0 cursor-pointer min-w-[200px]"
                        >
                            <option value="">Todas as Situações</option>
                            <option value="DISPONIVEL">Disponível Total</option>
                            <option value="PARCIAL">Parcialmente Disponível</option>
                            <option value="INDISPONIVEL">Indisponível</option>
                        </select>
                    </div>
                </div>

                {/* Lista de Peças */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Fila de Separação ({pecasFiltradas.length})
                    </h3>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} height={140} className="rounded-2xl" />
                            ))}
                        </div>
                    ) : pecasFiltradas.length === 0 ? (
                        <EmptyState
                            icon={CheckCircle}
                            title="Tudo em Dia!"
                            description={searchTerm || filtroDisponibilidade ? "Nenhum item encontrado com os filtros atuais." : "Não há peças pendentes de separação no momento."}
                        />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {pecasFiltradas.map((peca) => (
                                <div
                                    key={peca.item_id}
                                    className="glass-card-enterprise p-6 rounded-2xl border border-white/[0.03] hover:bg-white/[0.04] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                                        <div className="flex-1 space-y-3 w-full">
                                            {/* Top info */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-xs font-mono font-bold text-white bg-purple-500/20 px-2 py-1 rounded shadow-sm border border-purple-500/10">
                                                    OS #{peca.numero_os}
                                                </span>
                                                <div className={`text-[10px] font-black uppercase px-2 py-1 rounded flex items-center gap-1.5 ${peca.disponibilidade === 'DISPONIVEL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    peca.disponibilidade === 'PARCIAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${peca.disponibilidade === 'DISPONIVEL' ? 'bg-emerald-400' :
                                                        peca.disponibilidade === 'PARCIAL' ? 'bg-amber-400' :
                                                            'bg-rose-400'
                                                        }`} />
                                                    {peca.disponibilidade}
                                                </div>
                                                {peca.codigo_peca && (
                                                    <span className="text-xs font-mono text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded">
                                                        REF: {peca.codigo_peca}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Main Info */}
                                            <div>
                                                <h4 className="text-lg font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">
                                                    {peca.descricao}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--text-secondary)] mt-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-0.5">Quantidade</span>
                                                        <span className="font-mono text-sm text-[var(--text-primary)]">{peca.quantidade} <span className="text-[10px] text-[var(--text-muted)]">{peca.unidade}</span></span>
                                                    </div>
                                                    <div className="w-px h-6 bg-white/10" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-0.5">Estoque</span>
                                                        <span className={`font-mono text-sm ${(peca.estoque_disponivel || 0) >= peca.quantidade ? 'text-emerald-400' : 'text-rose-400'
                                                            }`}>
                                                            {peca.estoque_disponivel || 0} <span className="text-[10px] text-[var(--text-muted)]">{peca.unidade}</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-px h-6 bg-white/10" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-0.5">Cliente</span>
                                                        <span className="font-medium truncate max-w-[150px]" title={peca.cliente}>{peca.cliente}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-white/10" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-0.5">Técnico</span>
                                                        <span className="font-medium">{peca.tecnico_responsavel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-3 min-w-[200px]">
                                            {peca.disponibilidade === 'DISPONIVEL' && peca.status_separacao === 'PENDENTE' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    leftIcon={<CheckCircle className="w-4 h-4" />}
                                                    onClick={() => separarMutation.mutate({
                                                        itemId: peca.item_id,
                                                        codigoPeca: peca.codigo_peca || '',
                                                        quantidade: peca.quantidade
                                                    })}
                                                    isLoading={separarMutation.isPending}
                                                    // className="w-full justify-start pl-4"
                                                    className="w-full"
                                                >
                                                    Confirmar Separação
                                                </Button>
                                            )}

                                            {(peca.disponibilidade === 'INDISPONIVEL' || peca.disponibilidade === 'PARCIAL') && peca.status_separacao === 'PENDENTE' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    leftIcon={<ShoppingCart className="w-4 h-4 text-amber-400" />}
                                                    onClick={() => solicitarCompraMutation.mutate(peca)}
                                                    isLoading={solicitarCompraMutation.isPending}
                                                    // className="w-full justify-start pl-4"
                                                    className="w-full"
                                                // className="w-full justify-start pl-4 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20"
                                                >
                                                    Solicitar Compra
                                                </Button>
                                            )}

                                            {peca.status_separacao === 'AGUARDANDO_COMPRA' && (
                                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center gap-2 text-amber-400">
                                                    <ShoppingCart className="w-4 h-4 animate-pulse" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Aguardando Compra</span>
                                                </div>
                                            )}

                                            {peca.status_separacao === 'SEPARADO' && (
                                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400">
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Separado</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
