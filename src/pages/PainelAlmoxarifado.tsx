import { useState, useEffect, useCallback } from 'react';
import {
    Package,
    CheckCircle2,
    Truck,
    RefreshCw,
    Search,
    Box,
    PackageCheck,
    X,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

interface ItemPeca {
    id: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    status_separacao: string;
}

interface OSAgrupada {
    id: string;
    numero_os: string;
    cliente: string;
    modelo_maquina: string;
    itens: ItemPeca[];
    totalPecas: number;
    pecasSeparadas: number;
    temComprasPendentes: boolean;
}

interface SolicitacaoChegando {
    id: string;
    ordem_servico_id: string;
    codigo_peca: string | null;
    descricao_peca: string;
    quantidade: number;
    status: string;
    numero_os: string;
    cliente: string;
}

export default function PainelAlmoxarifado() {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'separar' | 'chegando'>('separar');
    const [searchTerm, setSearchTerm] = useState('');
    const [osParaSeparar, setOsParaSeparar] = useState<OSAgrupada[]>([]);
    const [itensChegando, setItensChegando] = useState<SolicitacaoChegando[]>([]);
    const [selectedOS, setSelectedOS] = useState<OSAgrupada | null>(null);
    const [processando, setProcessando] = useState<Record<string, boolean>>({});

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Peças SOLICITADO_ESTOQUE (para separar) — agrupadas por OS
            const { data: estoque, error: e1 } = await supabase
                .from('itens_os')
                .select('*, ordens_servico:ordem_servico_id(id, numero_os, nome_cliente_digitavel, modelo_maquina)')
                .in('status_separacao', ['SOLICITADO_ESTOQUE', 'SEPARANDO']);

            if (e1) throw e1;

            // Agrupar por OS
            const osMap = new Map<string, OSAgrupada>();
            (estoque || []).forEach((item: any) => {
                const os = item.ordens_servico;
                if (!os) return;
                if (!osMap.has(os.id)) {
                    osMap.set(os.id, {
                        id: os.id,
                        numero_os: os.numero_os,
                        cliente: os.nome_cliente_digitavel || 'Cliente',
                        modelo_maquina: os.modelo_maquina || '',
                        itens: [],
                        totalPecas: 0,
                        pecasSeparadas: 0,
                        temComprasPendentes: false,
                    });
                }
                const osData = osMap.get(os.id)!;
                osData.itens.push({
                    id: item.id,
                    codigo_peca: item.codigo_peca,
                    descricao: item.descricao,
                    quantidade: item.quantidade,
                    status_separacao: item.status_separacao,
                });
                osData.totalPecas++;
            });

            // Verificar se cada OS tem compras pendentes (peças com SOLICITADO_COMPRA)
            for (const [osId, osData] of osMap) {
                const { data: comprasPendentes } = await supabase
                    .from('itens_os')
                    .select('id')
                    .eq('ordem_servico_id', osId)
                    .eq('status_separacao', 'SOLICITADO_COMPRA');

                osData.temComprasPendentes = (comprasPendentes || []).length > 0;
            }

            setOsParaSeparar(Array.from(osMap.values()));

            // 2. Peças compradas chegando (COMPRADO ou AGUARDANDO_ENTREGA)
            const { data: compras, error: e2 } = await supabase
                .from('solicitacoes_compra')
                .select('*, ordens_servico:ordem_servico_id(numero_os, nome_cliente_digitavel)')
                .in('status', ['COMPRADO', 'AGUARDANDO_ENTREGA']);

            if (e2) throw e2;

            setItensChegando((compras || []).map((item: any) => ({
                id: item.id,
                ordem_servico_id: item.ordem_servico_id,
                codigo_peca: item.codigo_peca,
                descricao_peca: item.descricao_peca,
                quantidade: item.quantidade,
                status: item.status,
                numero_os: item.ordens_servico?.numero_os || 'N/A',
                cliente: item.ordens_servico?.nome_cliente_digitavel || '',
            })));

        } catch (error) {
            console.error('Erro ao carregar dados do almoxarifado:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregarDados(); }, [carregarDados]);

    // Separar uma peça individual
    const separarPeca = async (itemId: string) => {
        setProcessando(prev => ({ ...prev, [itemId]: true }));
        try {
            const { error } = await (supabase.from('itens_os') as any)
                .update({ status_separacao: 'AGUARDANDO_RETIRADA' })
                .eq('id', itemId);
            if (error) throw error;

            // Atualizar lista local
            if (selectedOS) {
                const updated = {
                    ...selectedOS,
                    itens: selectedOS.itens.map(i =>
                        i.id === itemId ? { ...i, status_separacao: 'AGUARDANDO_RETIRADA' } : i
                    )
                };
                setSelectedOS(updated);
            }
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, [itemId]: false }));
        }
    };

    // Confirmar chegada de peça comprada
    const confirmarChegada = async (solicitacaoId: string) => {
        setProcessando(prev => ({ ...prev, [solicitacaoId]: true }));
        try {
            // 1. Marcar solicitação como ENTREGUE
            const { error: e1 } = await (supabase.from('solicitacoes_compra') as any)
                .update({ status: 'ENTREGUE', data_entrega_real: new Date().toISOString() })
                .eq('id', solicitacaoId);
            if (e1) throw e1;

            // 2. Buscar item_os vinculado e trocar status para SOLICITADO_ESTOQUE (para o almoxarifado separar)
            const { data: sol } = await supabase
                .from('solicitacoes_compra')
                .select('item_os_id')
                .eq('id', solicitacaoId)
                .single();

            if ((sol as any)?.item_os_id) {
                await (supabase.from('itens_os') as any)
                    .update({ status_separacao: 'SOLICITADO_ESTOQUE' })
                    .eq('id', (sol as any).item_os_id);
            }

            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, [solicitacaoId]: false }));
        }
    };

    // Verificar se todas peças da OS no modal já foram separadas
    const todasSeparadas = selectedOS?.itens.every(i => i.status_separacao === 'AGUARDANDO_RETIRADA') || false;
    const podeLiberarRetirada = todasSeparadas && !selectedOS?.temComprasPendentes;

    // Liberar OS para retirada (atualizar status da OS)
    const liberarParaRetirada = async () => {
        if (!selectedOS) return;
        setProcessando(prev => ({ ...prev, ['liberar']: true }));
        try {
            // Atualizar status da OS para AGUARDANDO_PECAS (mantém) — as peças já estão como AGUARDANDO_RETIRADA
            // O chefe de oficina detecta pelo status das peças
            setSelectedOS(null);
            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, ['liberar']: false }));
        }
    };

    const filteredOS = osParaSeparar.filter(os =>
        os.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.cliente.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredChegando = itensChegando.filter(i =>
        i.descricao_peca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.codigo_peca || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <div className="p-8 space-y-8 animate-fadeIn max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <Package className="w-8 h-8 text-emerald-500" />
                            </div>
                            Almoxarifado
                        </h1>
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Separação e recebimento de peças</p>
                    </div>
                    <Button variant="secondary" onClick={carregarDados} leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}>
                        Atualizar
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-amber-500/10 rounded-xl"><Box className="w-6 h-6 text-amber-500" /></div><div><p className="text-2xl font-black text-white">{osParaSeparar.length}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">OS p/ Separar</p></div></div></Card>
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-violet-500/10 rounded-xl"><Truck className="w-6 h-6 text-violet-500" /></div><div><p className="text-2xl font-black text-white">{itensChegando.length}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Peças Chegando</p></div></div></Card>
                    <Card><div className="flex items-center gap-4"><div className="p-3 bg-emerald-500/10 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div><div><p className="text-2xl font-black text-white">{osParaSeparar.reduce((s, os) => s + os.totalPecas, 0)}</p><p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Total Peças</p></div></div></Card>
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 p-1.5 bg-[var(--surface-light)]/50 border border-white/5 rounded-2xl w-fit">
                        <button onClick={() => setActiveSection('separar')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all relative ${activeSection === 'separar' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:bg-white/5'}`}>
                            <Box className="w-4 h-4" /> Separar
                            {osParaSeparar.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">{osParaSeparar.length}</span>}
                        </button>
                        <button onClick={() => setActiveSection('chegando')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all relative ${activeSection === 'chegando' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-[var(--text-muted)] hover:bg-white/5'}`}>
                            <Truck className="w-4 h-4" /> Chegando
                            {itensChegando.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">{itensChegando.length}</span>}
                        </button>
                    </div>
                    <div className="relative group w-full lg:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input type="text" placeholder="Buscar OS ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none" />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <Skeleton key={i} width="100%" height={160} className="rounded-2xl" />)}
                    </div>
                ) : activeSection === 'separar' ? (
                    filteredOS.length === 0 ? (
                        <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma OS para separar</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Tudo em dia! 🎉</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
                            {filteredOS.map(os => (
                                <div
                                    key={os.id}
                                    onClick={() => setSelectedOS(os)}
                                    className="glass-card-enterprise p-6 rounded-2xl border border-amber-500/15 hover:border-amber-500/30 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">OS #{os.numero_os}</span>
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[10px] font-bold border border-amber-500/20">
                                            {os.totalPecas} peça{os.totalPecas > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white mb-1 truncate">{os.cliente}</p>
                                    <p className="text-xs text-[var(--text-muted)] truncate">{os.modelo_maquina}</p>
                                    {os.temComprasPendentes && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400">
                                            <AlertTriangle className="w-3 h-3" /> Aguardando peças de compra
                                        </div>
                                    )}
                                    <div className="mt-3 pt-3 border-t border-white/5">
                                        <p className="text-[10px] text-[var(--text-muted)] group-hover:text-amber-400 transition-colors">Clique para separar peças →</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* Aba Chegando */
                    filteredChegando.length === 0 ? (
                        <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                            <Truck className="w-12 h-12 mx-auto mb-4 text-violet-400" />
                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma peça a caminho</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
                            {filteredChegando.map(item => (
                                <div key={item.id} className="glass-card-enterprise p-5 rounded-2xl border border-violet-500/15">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">OS #{item.numero_os}</span>
                                        <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-md text-[9px] font-black border border-violet-500/20">Chegando</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1">{item.descricao_peca}</h3>
                                    <p className="text-xs text-[var(--text-muted)]">Código: <span className="text-violet-400">{item.codigo_peca || 'N/A'}</span> • Qtd: <span className="text-white font-bold">{item.quantidade}</span></p>
                                    <p className="text-xs text-[var(--text-muted)] truncate">{item.cliente}</p>
                                    <div className="pt-3 mt-3 border-t border-white/5">
                                        <Button variant="primary" size="sm" disabled={processando[item.id]} onClick={() => confirmarChegada(item.id)} leftIcon={<CheckCircle2 className="w-4 h-4" />} className="w-full">
                                            {processando[item.id] ? 'Processando...' : 'Confirmar Chegada'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* ===== Modal: Separação de Peças da OS ===== */}
            {selectedOS && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-card-enterprise p-0 rounded-2xl border border-white/10 max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-500/20">
                                    <PackageCheck className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Separar Peças</h2>
                                    <p className="text-xs text-[var(--text-muted)]">OS #{selectedOS.numero_os} • {selectedOS.cliente}</p>
                                </div>
                            </div>
                            <button onClick={() => { setSelectedOS(null); carregarDados(); }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Aviso: compras pendentes */}
                        {selectedOS.temComprasPendentes && (
                            <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <p className="text-xs text-amber-400 font-medium">Esta OS possui peças aguardando chegada do Dept. de Compras. A liberação para retirada só será possível quando todas chegarem.</p>
                            </div>
                        )}

                        {/* Lista de peças */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3">
                            {selectedOS.itens.map(item => {
                                const jaSeparada = item.status_separacao === 'AGUARDANDO_RETIRADA';
                                return (
                                    <div key={item.id} className={`p-4 rounded-xl border transition-all ${jaSeparada ? 'border-emerald-500/20 bg-emerald-500/5 opacity-70' : 'border-white/10 bg-white/[0.02]'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.descricao}</p>
                                                <p className="text-xs text-[var(--text-muted)]">
                                                    Código: <span className="text-blue-400">{item.codigo_peca || 'N/A'}</span> • Qtd: <span className="text-white font-bold">{item.quantidade}</span>
                                                </p>
                                            </div>
                                            {jaSeparada ? (
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                                    <CheckCircle2 className="w-4 h-4" /> Separada
                                                </span>
                                            ) : (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={processando[item.id]}
                                                    onClick={() => separarPeca(item.id)}
                                                    leftIcon={processando[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
                                                >
                                                    {processando[item.id] ? '...' : 'Separar'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <p className="text-xs text-[var(--text-muted)]">
                                {selectedOS.itens.filter(i => i.status_separacao === 'AGUARDANDO_RETIRADA').length}/{selectedOS.totalPecas} separadas
                            </p>
                            {podeLiberarRetirada ? (
                                <Button variant="primary" onClick={liberarParaRetirada} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                                    Liberar para Retirada
                                </Button>
                            ) : (
                                <Button variant="secondary" onClick={() => { setSelectedOS(null); carregarDados(); }}>
                                    Fechar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
