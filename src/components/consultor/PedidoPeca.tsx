import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Filter,
    Clock,
    CheckCircle2,
    AlertCircle,
    Package,
    Truck,
    XCircle,
    Info,
    ArrowUpRight,
    Loader2,
    Check,
    TrendingUp
} from 'lucide-react';
import { comprasService, SolicitacaoCompra } from '@/services/compras.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';

export function PedidoPeca() {
    const [pedidos, setPedidos] = useState<SolicitacaoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState<SolicitacaoCompra | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<string>('');

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const data = await comprasService.getSolicitacoes();
            setPedidos(data);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPedidos();
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDENTE': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'EM_COTACAO': return <Filter className="w-4 h-4 text-blue-500" />;
            case 'COMPRADO': return <Package className="w-4 h-4 text-emerald-500" />;
            case 'AGUARDANDO_ENTREGA': return <Truck className="w-4 h-4 text-violet-500" />;
            case 'ENTREGUE': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'CANCELADO': return <XCircle className="w-4 h-4 text-rose-500" />;
            default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar peça ou OS..."
                        className="w-full bg-[var(--surface-light)] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                        className="bg-[var(--surface-light)] border border-white/5 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest outline-none cursor-pointer hover:bg-white/5 transition-all"
                    >
                        <option value="">Todos os Status</option>
                        <option value="PENDENTE">Pendente</option>
                        <option value="EM_COTACAO">Em Cotação</option>
                        <option value="COMPRADO">Comprado</option>
                        <option value="AGUARDANDO_ENTREGA">Aguardando Entrega</option>
                        <option value="ENTREGUE">Entregue</option>
                    </select>
                    <Button
                        variant="primary"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowNewModal(true)}
                    >
                        Solicitar Peça
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-card-enterprise p-6 rounded-3xl border border-white/5 space-y-4">
                            <Skeleton width="40%" height={24} className="rounded-lg" />
                            <Skeleton width="100%" height={16} />
                            <Skeleton width="100%" height={16} />
                            <div className="pt-4 flex justify-between">
                                <Skeleton width="30%" height={24} className="rounded-full" />
                                <Skeleton width="24%" height={24} className="rounded-full" />
                            </div>
                        </div>
                    ))
                ) : pedidos.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card-enterprise rounded-3xl border border-white/5 opacity-50">
                        <Package className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    pedidos.map((pedido) => (
                        <div
                            key={pedido.id}
                            onClick={() => setShowDetailModal(pedido)}
                            className="glass-card-enterprise p-6 rounded-3xl border border-white/[0.03] hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                {getStatusIcon(pedido.status)}
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                                    OS #{pedido.numero_os || 'N/A'}
                                </span>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${pedido.urgencia === 'URGENTE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                    pedido.urgencia === 'ALTA' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    {pedido.urgencia}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{pedido.descricao_peca}</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">Qtd: <span className="text-white">{pedido.quantidade} {pedido.unidade}</span></p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/5">
                                        {getStatusIcon(pedido.status)}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                                        {pedido.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 italic">
                                    <Clock className="w-3 h-3" />
                                    {pedido.dias_aguardando}d atrás
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fadeIn">
                    <div className="glass-card-enterprise w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                                    <Info className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Detalhes do Pedido</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">Solicitação #{showDetailModal.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDetailModal(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <XCircle className="w-6 h-6 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Ordem de Serviço</p>
                                    <p className="font-bold text-white">#{showDetailModal.numero_os || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Peça (Código)</p>
                                    <p className="font-bold text-white">{showDetailModal.codigo_peca || 'Não informado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Quantidade</p>
                                    <p className="font-bold text-white">{showDetailModal.quantidade} {showDetailModal.unidade}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Valor Unitário</p>
                                    <p className="font-black text-emerald-400">{formatCurrency(showDetailModal.valor_unitario)}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Descrição da Peça</p>
                                <p className="text-lg font-bold text-white leading-tight">{showDetailModal.descricao_peca}</p>
                            </div>

                            {/* Status Timeline / Notifications */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status da Operação</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                <Filter className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tighter">Setor de Compras</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{showDetailModal.status === 'PENDENTE' ? 'Aguardando Cotação' : showDetailModal.status === 'CANCELADO' ? 'Cancelado' : 'Processado'}</p>
                                            </div>
                                        </div>
                                        <div className={`p-1 rounded-full ${['COMPRADO', 'AGUARDANDO_ENTREGA', 'ENTREGUE'].includes(showDetailModal.status) ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/30'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
                                                <Truck className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white uppercase tracking-tighter">Entrada Almoxarifado</p>
                                                <p className="text-[10px] text-[var(--text-muted)]">{showDetailModal.status === 'ENTREGUE' ? 'Confirmado' : 'Pendente'}</p>
                                            </div>
                                        </div>
                                        <div className={`p-1 rounded-full ${showDetailModal.status === 'ENTREGUE' ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/30'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Previsão de Entrega</p>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-400" />
                                        {showDetailModal.data_previsao_entrega ? new Date(showDetailModal.data_previsao_entrega).toLocaleDateString() : 'Aguardando Cotação'}
                                    </p>
                                </div>
                                <div className="p-6 bg-violet-500/5 rounded-2xl border border-violet-500/10">
                                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Faturamento Fábrica</p>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-violet-400" />
                                        {showDetailModal.data_faturamento_fabrica ? new Date(showDetailModal.data_faturamento_fabrica).toLocaleDateString() : 'Pendente'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">AOL (Status Fábrica)</p>
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                    <Package className="w-4 h-4 text-emerald-400" />
                                    {showDetailModal.aol || 'Aguardando Processamento'}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
                            <Button variant="secondary" onClick={() => setShowDetailModal(null)}>Fechar Detalhes</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
