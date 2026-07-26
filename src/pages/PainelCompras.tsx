import { logger } from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Clock,
    CheckCircle2,
    Truck,
    DollarSign,
    X,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import type { Database, StatusSolicitacaoCompra } from '@/types/database.types';

interface SolicitacaoItem {
    id: string;
    codigo_peca: string | null;
    descricao_peca: string;
    quantidade: number;
    unidade: string;
    urgencia: string;
    status: string;
    valor_unitario: number | null;
    fornecedor: string | null;
    data_previsao_entrega: string | null;
    data_solicitacao: string;
    observacoes: string | null;
}

interface OSAgrupada {
    id: string;
    numero_os: string;
    cliente: string;
    itens: SolicitacaoItem[];
    totalPecas: number;
    pendentes: number;
    comprados: number;
}

const STATUS_COLORS: Record<string, string> = {
    PENDENTE: 'amber',
    EM_COTACAO: 'blue',
    COMPRADO: 'emerald',
    AGUARDANDO_ENTREGA: 'violet',
    ENTREGUE: 'green',
};

const STATUS_LABELS: Record<string, string> = {
    PENDENTE: 'Pendente',
    EM_COTACAO: 'Em Cotação',
    COMPRADO: 'Comprado',
    AGUARDANDO_ENTREGA: 'Aguard. Entrega',
    ENTREGUE: 'Entregue',
};

export default function PainelCompras() {
    const [loading, setLoading] = useState(true);
    const [osAgrupadas, setOsAgrupadas] = useState<OSAgrupada[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOS, setSelectedOS] = useState<OSAgrupada | null>(null);
    const [processando, setProcessando] = useState<Record<string, boolean>>({});
    const [editando, setEditando] = useState<{ id: string; field: string } | null>(null);

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('solicitacoes_compra')
                .select('*, ordens_servico:ordem_servico_id(id, numero_os, nome_cliente_digitavel)')
                .not('status', 'in', '(ENTREGUE,CANCELADO)')
                .order('data_solicitacao', { ascending: false });

            if (error) throw error;

            // Agrupar por OS
            const osMap = new Map<string, OSAgrupada>();
            (data || []).forEach((item) => {
                const os = Array.isArray(item.ordens_servico) ? item.ordens_servico[0] : item.ordens_servico;
                const osId = os?.id || item.ordem_servico_id || 'sem-os';
                if (!osMap.has(osId)) {
                    osMap.set(osId, {
                        id: osId,
                        numero_os: os?.numero_os || 'N/A',
                        cliente: os?.nome_cliente_digitavel || '',
                        itens: [],
                        totalPecas: 0,
                        pendentes: 0,
                        comprados: 0,
                    });
                }
                const osData = osMap.get(osId)!;
                osData.itens.push({
                    id: item.id,
                    codigo_peca: item.codigo_peca,
                    descricao_peca: item.descricao_peca,
                    quantidade: item.quantidade,
                    unidade: item.unidade || 'UN',
                    urgencia: item.urgencia,
                    status: item.status,
                    valor_unitario: item.valor_unitario,
                    fornecedor: item.fornecedor,
                    data_previsao_entrega: item.data_previsao_entrega,
                    data_solicitacao: item.data_solicitacao,
                    observacoes: item.observacoes,
                });
                osData.totalPecas++;
                if (item.status === 'PENDENTE') osData.pendentes++;
                if (['COMPRADO', 'AGUARDANDO_ENTREGA'].includes(item.status)) osData.comprados++;
            });

            setOsAgrupadas(Array.from(osMap.values()));
        } catch (error) {
            logger.error('Erro ao carregar solicitações:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregarDados(); }, [carregarDados]);

    const atualizarStatus = async (id: string, novoStatus: StatusSolicitacaoCompra) => {
        setProcessando(prev => ({ ...prev, [id]: true }));
        try {
            const { error } = await supabase.from('solicitacoes_compra')
                .update({ status: novoStatus })
                .eq('id', id);
            if (error) throw error;

            // Atualizar local
            if (selectedOS) {
                setSelectedOS({
                    ...selectedOS,
                    itens: selectedOS.itens.map(i => i.id === id ? { ...i, status: novoStatus } : i),
                });
            }
        } catch (error) {
            alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setProcessando(prev => ({ ...prev, [id]: false }));
        }
    };

    const registrarCompra = async (id: string, fornecedor: string, valor: number, previsao: string) => {
        try {
            const updateData: Database['public']['Tables']['solicitacoes_compra']['Update'] = { fornecedor, valor_unitario: valor, status: 'COMPRADO' };
            if (previsao) {
                updateData.data_previsao_entrega = previsao;
                updateData.status = 'AGUARDANDO_ENTREGA';
            }
            const { error } = await supabase.from('solicitacoes_compra')
                .update(updateData)
                .eq('id', id);
            if (error) throw error;
            setEditando(null);
            if (selectedOS) {
                setSelectedOS({
                    ...selectedOS,
                    itens: selectedOS.itens.map(i => i.id === id ? { ...i, ...updateData } : i),
                });
            }
        } catch (error) {
            alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };


    const stats = {
        totalOS: osAgrupadas.length,
        pendentes: osAgrupadas.reduce((s, os) => s + os.pendentes, 0),
        comprados: osAgrupadas.reduce((s, os) => s + os.comprados, 0),
    };

    const filteredOS = osAgrupadas.filter(os =>
        os.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <ShoppingCart className="w-8 h-8 text-blue-500" />
                            </div>
                            Departamento de Compras
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Solicitações de peças por Ordem de Serviço</p>
                    </div>
                    <Button variant="secondary" onClick={carregarDados} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
                        Atualizar
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="w-6 h-6 text-amber-500" /></div><div><p className="text-2xl font-black text-white">{stats.pendentes}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Pendentes</p></div></div></Card>
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-blue-500/10 rounded-xl"><DollarSign className="w-6 h-6 text-blue-500" /></div><div><p className="text-2xl font-black text-white">{stats.totalOS}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">OS Ativas</p></div></div></Card>
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 rounded-xl"><Truck className="w-6 h-6 text-emerald-500" /></div><div><p className="text-2xl font-black text-white">{stats.comprados}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Comprados / Entrega</p></div></div></Card>
                </div>

                {/* Search */}
                <div className="flex justify-end">
                    <div className="relative group w-full lg:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input type="text" placeholder="Buscar OS ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                    </div>
                </div>

                {/* OS Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={160} className="rounded-2xl" />)}
                    </div>
                ) : filteredOS.length === 0 ? (
                    <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma solicitação ativa</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
                        {filteredOS.map(os => (
                            <div
                                key={os.id}
                                onClick={() => setSelectedOS(os)}
                                className="glass-card-enterprise p-6 rounded-2xl border border-blue-500/15 hover:border-blue-500/30 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">OS #{os.numero_os}</span>
                                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-[10px] font-bold border border-blue-500/20">
                                        {os.totalPecas} peça{os.totalPecas > 1 ? 's' : ''}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-white mb-1 truncate">{os.cliente}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    {os.pendentes > 0 && (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[9px] font-black border border-amber-500/20">
                                            {os.pendentes} pendente{os.pendentes > 1 ? 's' : ''}
                                        </span>
                                    )}
                                    {os.comprados > 0 && (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md text-[9px] font-black border border-emerald-500/20">
                                            {os.comprados} comprada{os.comprados > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5">
                                    <p className="text-[10px] text-[var(--text-muted)] group-hover:text-blue-400 transition-colors">Clique para gerenciar →</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ===== Modal: Peças da OS ===== */}
            {selectedOS && !editando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-card-enterprise p-0 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                                    <ShoppingCart className="w-6 h-6 text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Peças para Compra</h2>
                                    <p className="text-xs text-[var(--text-muted)]">OS #{selectedOS.numero_os} • {selectedOS.cliente}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedOS(null); carregarDados(); }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Lista */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {selectedOS.itens.map(item => {
                                const color = STATUS_COLORS[item.status] || 'gray';
                                return (
                                    <div key={item.id} className={`p-4 rounded-xl border transition-all ${item.status === 'AGUARDANDO_ENTREGA' ? 'border-violet-500/20 bg-violet-500/5' :
                                        item.status === 'COMPRADO' ? 'border-emerald-500/20 bg-emerald-500/5' :
                                            'border-white/10 bg-white/[0.02]'
                                        }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-bold text-white">{item.descricao_peca}</p>
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border bg-${color}-500/10 text-${color}-400 border-${color}-500/20`}>
                                                        {STATUS_LABELS[item.status] || item.status}
                                                    </span>
                                                    {item.urgencia === 'URGENTE' && <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded text-[9px] font-black border border-rose-500/20">URGENTE</span>}
                                                </div>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Código: <span className="text-blue-400">{item.codigo_peca || 'N/A'}</span> • Qtd: <span className="text-white font-bold">{item.quantidade} {item.unidade}</span>
                                                </p>
                                                {item.fornecedor && <p className="text-[10px] text-[var(--text-muted)] mt-1">Fornecedor: <span className="text-white">{item.fornecedor}</span></p>}
                                                {item.data_previsao_entrega && <p className="text-[10px] text-[var(--text-muted)]">Previsão: <span className="text-emerald-400">{new Date(item.data_previsao_entrega).toLocaleDateString('pt-BR')}</span></p>}
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {item.status === 'PENDENTE' && (
                                                    <Button size="sm" variant="secondary" disabled={processando[item.id]} onClick={() => atualizarStatus(item.id, 'EM_COTACAO')}>
                                                        {processando[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Iniciar Cotação'}
                                                    </Button>
                                                )}
                                                {item.status === 'EM_COTACAO' && (
                                                    <Button size="sm" variant="primary" onClick={() => setEditando({ id: item.id, field: 'comprar' })}>
                                                        Registrar Compra
                                                    </Button>
                                                )}
                                                {item.status === 'COMPRADO' && (
                                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Comprado — aguard. previsão</span>
                                                )}
                                                {item.status === 'AGUARDANDO_ENTREGA' && (
                                                    <span className="text-[10px] text-violet-400 flex items-center gap-1"><Truck className="w-3 h-3" /> Aguard. Almoxarifado</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <p className="text-xs text-[var(--text-muted)]">{selectedOS.totalPecas} peça{selectedOS.totalPecas > 1 ? 's' : ''} nesta OS</p>
                            <Button variant="secondary" onClick={() => { setSelectedOS(null); carregarDados(); }}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Registrar Compra */}
            {editando?.field === 'comprar' && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-card-enterprise p-6 rounded-2xl border border-white/10 max-w-md w-full">
                        <h3 className="text-lg font-bold text-white mb-4">Registrar Compra</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const fornecedor = (form.elements.namedItem('fornecedor') as HTMLInputElement).value;
                            const valor = parseFloat((form.elements.namedItem('valor') as HTMLInputElement).value) || 0;
                            const previsao = (form.elements.namedItem('previsao') as HTMLInputElement).value;
                            registrarCompra(editando.id, fornecedor, valor, previsao);
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Fornecedor</label>
                                <input name="fornecedor" required className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Valor Unitário (R$)</label>
                                <input name="valor" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Previsão de Chegada</label>
                                <input name="previsao" type="date" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
                                <Button type="submit" variant="primary">Confirmar Compra</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
