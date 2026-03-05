import { useState, useEffect, useCallback } from 'react';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Calendar,
    Clock,
    CheckCircle2,
    Truck,
    DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

interface SolicitacaoCompra {
    id: string;
    ordem_servico_id: string | null;
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
    numero_os: string;
    cliente: string;
    modelo_maquina: string;
    observacoes: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDENTE: { label: 'Pendente', color: 'amber' },
    EM_COTACAO: { label: 'Em Cotação', color: 'blue' },
    COMPRADO: { label: 'Comprado', color: 'emerald' },
    AGUARDANDO_ENTREGA: { label: 'Aguard. Entrega', color: 'violet' },
    ENTREGUE: { label: 'Entregue', color: 'green' },
    CANCELADO: { label: 'Cancelado', color: 'rose' },
};

export default function PainelCompras() {
    const [loading, setLoading] = useState(true);
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([]);
    const [filtroStatus, setFiltroStatus] = useState<string>('ativos');
    const [searchTerm, setSearchTerm] = useState('');
    const [processando, setProcessando] = useState<Record<string, boolean>>({});
    const [editando, setEditando] = useState<{ id: string; field: string } | null>(null);

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('solicitacoes_compra')
                .select('*, ordens_servico:ordem_servico_id(numero_os, nome_cliente_digitavel, modelo_maquina)')
                .order('data_solicitacao', { ascending: false });

            // Filtra: "ativos" exclui ENTREGUE e CANCELADO
            if (filtroStatus === 'ativos') {
                query = query.not('status', 'in', '(ENTREGUE,CANCELADO)');
            } else if (filtroStatus !== 'todos') {
                query = query.eq('status', filtroStatus);
            }

            const { data, error } = await query;
            if (error) throw error;

            setSolicitacoes((data || []).map((item: any) => ({
                ...item,
                numero_os: item.ordens_servico?.numero_os || 'N/A',
                cliente: item.ordens_servico?.nome_cliente_digitavel || '',
                modelo_maquina: item.ordens_servico?.modelo_maquina || '',
            })));
        } catch (error) {
            console.error('Erro ao carregar solicitações:', error);
        } finally {
            setLoading(false);
        }
    }, [filtroStatus]);

    useEffect(() => { carregarDados(); }, [carregarDados]);

    const atualizarStatus = async (id: string, novoStatus: string) => {
        setProcessando(prev => ({ ...prev, [id]: true }));
        try {
            const { error } = await (supabase
                .from('solicitacoes_compra') as any)
                .update({ status: novoStatus })
                .eq('id', id);

            if (error) throw error;
            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, [id]: false }));
        }
    };

    const definirPrevisao = async (id: string, data: string) => {
        try {
            const { error } = await (supabase
                .from('solicitacoes_compra') as any)
                .update({ data_previsao_entrega: data, status: 'AGUARDANDO_ENTREGA' })
                .eq('id', id);

            if (error) throw error;
            setEditando(null);
            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const definirFornecedor = async (id: string, fornecedor: string, valor: number) => {
        try {
            const { error } = await (supabase
                .from('solicitacoes_compra') as any)
                .update({ fornecedor, valor_unitario: valor, status: 'COMPRADO' })
                .eq('id', id);

            if (error) throw error;
            setEditando(null);
            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        }
    };

    const filtered = solicitacoes.filter(s =>
        s.descricao_peca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.codigo_peca || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        pendentes: solicitacoes.filter(s => s.status === 'PENDENTE').length,
        emCotacao: solicitacoes.filter(s => s.status === 'EM_COTACAO').length,
        comprados: solicitacoes.filter(s => ['COMPRADO', 'AGUARDANDO_ENTREGA'].includes(s.status)).length,
    };

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
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Solicitações de peças vinculadas às Ordens de Serviço</p>
                    </div>
                    <Button variant="secondary" onClick={carregarDados} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
                        Atualizar
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl"><Clock className="w-6 h-6 text-amber-500" /></div>
                            <div>
                                <p className="text-2xl font-black text-white">{stats.pendentes}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Pendentes</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl"><DollarSign className="w-6 h-6 text-blue-500" /></div>
                            <div>
                                <p className="text-2xl font-black text-white">{stats.emCotacao}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Em Cotação</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl"><Truck className="w-6 h-6 text-emerald-500" /></div>
                            <div>
                                <p className="text-2xl font-black text-white">{stats.comprados}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Comprados / Entrega</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filtros + Busca */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 p-1.5 bg-[var(--surface-light)]/50 border border-white/5 rounded-2xl w-fit overflow-x-auto">
                        {[
                            { key: 'ativos', label: 'Ativos' },
                            { key: 'PENDENTE', label: 'Pendentes' },
                            { key: 'EM_COTACAO', label: 'Em Cotação' },
                            { key: 'COMPRADO', label: 'Comprados' },
                            { key: 'AGUARDANDO_ENTREGA', label: 'Aguard. Entrega' },
                            { key: 'todos', label: 'Todos' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltroStatus(f.key)}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filtroStatus === f.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-[var(--text-muted)] hover:bg-white/5'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative group w-full lg:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Buscar peça, OS ou cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Lista de Solicitações */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={120} className="rounded-2xl" />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                        <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma solicitação encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-slideUp">
                        {filtered.map(sol => {
                            const statusInfo = STATUS_LABELS[sol.status] || { label: sol.status, color: 'gray' };
                            const dias = Math.floor((Date.now() - new Date(sol.data_solicitacao).getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <div key={sol.id} className="glass-card-enterprise p-5 rounded-2xl border border-white/[0.05] hover:border-blue-500/20 transition-all">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">OS #{sol.numero_os}</span>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border bg-${statusInfo.color}-500/10 text-${statusInfo.color}-400 border-${statusInfo.color}-500/20`}>
                                                    {statusInfo.label}
                                                </span>
                                                {sol.urgencia === 'URGENTE' && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md text-[9px] font-black border border-rose-500/20">URGENTE</span>}
                                                {sol.urgencia === 'ALTA' && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[9px] font-black border border-amber-500/20">ALTA</span>}
                                            </div>
                                            <h3 className="text-sm font-bold text-white mb-1">{sol.descricao_peca}</h3>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Código: <span className="text-blue-400">{sol.codigo_peca || 'N/A'}</span> • Qtd: <span className="text-white font-bold">{sol.quantidade} {sol.unidade}</span> • {sol.cliente}
                                            </p>
                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                                Solicitado há {dias} dia{dias !== 1 ? 's' : ''}
                                                {sol.fornecedor && <> • Fornecedor: <span className="text-white">{sol.fornecedor}</span></>}
                                                {sol.data_previsao_entrega && <> • Previsão: <span className="text-emerald-400">{new Date(sol.data_previsao_entrega).toLocaleDateString('pt-BR')}</span></>}
                                            </p>
                                        </div>

                                        {/* Ações */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {sol.status === 'PENDENTE' && (
                                                <Button size="sm" variant="secondary" disabled={processando[sol.id]} onClick={() => atualizarStatus(sol.id, 'EM_COTACAO')}>
                                                    Iniciar Cotação
                                                </Button>
                                            )}
                                            {sol.status === 'EM_COTACAO' && (
                                                <>
                                                    <Button size="sm" variant="primary" onClick={() => setEditando({ id: sol.id, field: 'comprar' })}>
                                                        Registrar Compra
                                                    </Button>
                                                </>
                                            )}
                                            {sol.status === 'COMPRADO' && (
                                                <Button size="sm" variant="primary" onClick={() => setEditando({ id: sol.id, field: 'previsao' })}>
                                                    <Calendar className="w-4 h-4 mr-1" /> Informar Previsão
                                                </Button>
                                            )}
                                            {sol.status === 'AGUARDANDO_ENTREGA' && (
                                                <span className="text-xs text-violet-400 flex items-center gap-1">
                                                    <Truck className="w-4 h-4" /> Aguardando recebimento pelo Almoxarifado
                                                </span>
                                            )}
                                            {sol.status === 'ENTREGUE' && (
                                                <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-4 h-4" /> Entregue ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Modal inline para registrar compra */}
                {editando?.field === 'comprar' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="glass-card-enterprise p-6 rounded-2xl border border-white/10 max-w-md w-full">
                            <h3 className="text-lg font-bold text-white mb-4">Registrar Compra</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const fornecedor = (form.elements.namedItem('fornecedor') as HTMLInputElement).value;
                                const valor = parseFloat((form.elements.namedItem('valor') as HTMLInputElement).value) || 0;
                                definirFornecedor(editando.id, fornecedor, valor);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Fornecedor</label>
                                    <input name="fornecedor" required className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Valor Unitário (R$)</label>
                                    <input name="valor" type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
                                    <Button type="submit" variant="primary">Confirmar Compra</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal inline para previsão de entrega */}
                {editando?.field === 'previsao' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="glass-card-enterprise p-6 rounded-2xl border border-white/10 max-w-sm w-full">
                            <h3 className="text-lg font-bold text-white mb-4">Previsão de Chegada</h3>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const data = (form.elements.namedItem('data') as HTMLInputElement).value;
                                definirPrevisao(editando.id, data);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] mb-1">Data Prevista</label>
                                    <input name="data" type="date" required className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-white text-sm outline-none focus:ring-2 focus:ring-blue-500/50" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
                                    <Button type="submit" variant="primary">Salvar Previsão</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
