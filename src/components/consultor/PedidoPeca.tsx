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
} from 'lucide-react';
import { comprasService, SolicitacaoCompra } from '@/services/compras.service';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';

export function PedidoPeca() {
    const { profile } = useAuth();
    const [pedidos, setPedidos] = useState<SolicitacaoCompra[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<{ numero_os: string; cliente: string; modelo_maquina: string; itens: SolicitacaoCompra[]; maxUrgencia: string; dias_aguardando: number } | null>(null);
    const [filtroStatus, setFiltroStatus] = useState<string>('');

    const isGerente = ['GERENTE', 'CHEFE_OFICINA'].includes(profile?.role?.toUpperCase() || '');
    const isGarantia = profile?.role?.toUpperCase() === 'CONSULTOR_GARANTIA';

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const data = await comprasService.getSolicitacoes();
            let pedidosFiltrados = data;
            if (!isGerente && profile) {
                const tipoPermitido = isGarantia ? 'GARANTIA' : 'NORMAL';
                // Mostra apenas peças da própria área (Garantia ou Normal) ou que sejam avulsas
                pedidosFiltrados = data.filter(p => !p.ordem_servico_id || p.tipo_os === tipoPermitido);
            }
            setPedidos(pedidosFiltrados);
        } catch (error) {
            console.error('Erro ao carregar pedidos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile) {
            loadPedidos();
        }
    }, [profile?.id, profile?.role]);

    // Agrupamento por OS
    const pedidosAgrupados = pedidos.reduce((acc: any, pedido) => {
        if (filtroStatus && pedido.status !== filtroStatus) return acc;

        const key = pedido.numero_os || 'SEM_OS';
        if (!acc[key]) {
            acc[key] = {
                numero_os: key,
                cliente: pedido.cliente,
                modelo_maquina: pedido.modelo_maquina,
                itens: [],
                maxUrgencia: pedido.urgencia,
                dias_aguardando: pedido.dias_aguardando || 0
            };
        }

        acc[key].itens.push(pedido);

        // Prioridade de urgência
        const niveis = { 'URGENTE': 4, 'ALTA': 3, 'NORMAL': 2, 'BAIXA': 1 };
        if (niveis[pedido.urgencia as keyof typeof niveis] > niveis[acc[key].maxUrgencia as keyof typeof niveis]) {
            acc[key].maxUrgencia = pedido.urgencia;
        }

        if ((pedido.dias_aguardando || 0) > acc[key].dias_aguardando) {
            acc[key].dias_aguardando = pedido.dias_aguardando;
        }

        return acc;
    }, {});

    const grupos = Object.values(pedidosAgrupados) as any[];

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

            {/* Modal para solicitar peça (Placeholder/Not implemented here but kept for UI consistency) */}
            {showNewModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-card-enterprise p-8 rounded-3xl border border-white/10 max-w-md w-full text-center space-y-6">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20">
                            <Plus className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Solicitar Nova Peça</h3>
                            <p className="text-sm text-[var(--text-muted)]">A funcionabilidade de abertura de pedidos deve ser feita através da edição da OS.</p>
                        </div>
                        <Button className="w-full" onClick={() => setShowNewModal(false)}>Entendi</Button>
                    </div>
                </div>
            )}

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
                ) : grupos.length === 0 ? (
                    <div className="col-span-full py-20 text-center glass-card-enterprise rounded-3xl border border-white/5 opacity-50">
                        <Package className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    grupos.map((grupo) => (
                        <div
                            key={grupo.numero_os}
                            onClick={() => setSelectedGroup(grupo)}
                            className="glass-card-enterprise p-6 rounded-3xl border border-white/[0.03] hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80">
                                    OS #{grupo.numero_os}
                                </span>
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${grupo.maxUrgencia === 'URGENTE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                    grupo.maxUrgencia === 'ALTA' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                    {grupo.maxUrgencia}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{grupo.cliente || 'Cliente não identificado'}</h3>
                            <p className="text-xs text-[var(--text-muted)] mb-4">{grupo.modelo_maquina || 'Máquina não identificada'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-white/5">
                                        <Package className="w-3 h-3 text-blue-400" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                                        {grupo.itens.length} Peça{grupo.itens.length > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 italic">
                                    <Clock className="w-3 h-3" />
                                    Hpa {grupo.dias_aguardando}d
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* List Modal */}
            {selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-fadeIn">
                    <div className="glass-card-enterprise w-full max-w-4xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slideUp max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                                    <Package className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Peças Solicitadas - OS #{selectedGroup.numero_os}</h2>
                                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">{selectedGroup.cliente}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedGroup(null)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <XCircle className="w-6 h-6 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 space-y-4">
                            {selectedGroup.itens.map((item) => (
                                <div key={item.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{item.codigo_peca || 'S/ Cod.'}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${item.urgencia === 'URGENTE' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                                item.urgencia === 'ALTA' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                    'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {item.urgencia}
                                            </span>
                                        </div>
                                        <p className="font-bold text-white">{item.descricao_peca}</p>
                                        <p className="text-xs text-[var(--text-muted)]">Quantidade: {item.quantidade} {item.unidade}</p>
                                        {item.valor_unitario && (
                                            <p className="text-xs font-bold text-emerald-400">
                                                {item.valor_unitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(item.status)}
                                                <span className="text-xs font-bold text-white">{item.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right min-w-[120px]">
                                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Previsão</p>
                                            <p className="text-xs font-bold text-blue-400">
                                                {item.data_previsao_entrega ? new Date(item.data_previsao_entrega).toLocaleDateString() : 'Não informada'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex justify-end">
                            <Button variant="secondary" onClick={() => setSelectedGroup(null)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
