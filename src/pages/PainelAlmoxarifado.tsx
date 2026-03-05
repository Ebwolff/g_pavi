import { useState, useEffect, useCallback } from 'react';
import {
    Package,
    CheckCircle2,
    Truck,
    RefreshCw,
    Search,
    Box,
    PackageCheck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

interface ItemPendente {
    id: string;
    ordem_servico_id: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    status_separacao: string;
    numero_os: string;
    cliente: string;
    modelo_maquina: string;
}

export default function PainelAlmoxarifado() {
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'separar' | 'chegando' | 'historico'>('separar');
    const [searchTerm, setSearchTerm] = useState('');
    const [itensSeparar, setItensSeparar] = useState<ItemPendente[]>([]);
    const [itensChegando, setItensChegando] = useState<ItemPendente[]>([]);
    const [processando, setProcessando] = useState<Record<string, boolean>>({});

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Peças para separar (solicitadas do estoque pelo consultor)
            const { data: estoque, error: e1 } = await supabase
                .from('itens_os')
                .select('*, ordens_servico:ordem_servico_id(id, numero_os, nome_cliente_digitavel, modelo_maquina)')
                .eq('status_separacao', 'SOLICITADO_ESTOQUE');

            if (e1) throw e1;

            setItensSeparar((estoque || []).map((item: any) => ({
                id: item.id,
                ordem_servico_id: item.ordem_servico_id,
                codigo_peca: item.codigo_peca,
                descricao: item.descricao,
                quantidade: item.quantidade,
                status_separacao: item.status_separacao,
                numero_os: item.ordens_servico?.numero_os || '',
                cliente: item.ordens_servico?.nome_cliente_digitavel || '',
                modelo_maquina: item.ordens_servico?.modelo_maquina || '',
            })));

            // 2. Peças compradas chegando (solicitação de compra com status COMPRADO ou AGUARDANDO_ENTREGA)
            const { data: compras, error: e2 } = await supabase
                .from('solicitacoes_compra')
                .select('*, ordens_servico:ordem_servico_id(id, numero_os, nome_cliente_digitavel, modelo_maquina)')
                .in('status', ['COMPRADO', 'AGUARDANDO_ENTREGA']);

            if (e2) throw e2;

            setItensChegando((compras || []).map((item: any) => ({
                id: item.id,
                ordem_servico_id: item.ordem_servico_id,
                codigo_peca: item.codigo_peca,
                descricao: item.descricao_peca,
                quantidade: item.quantidade,
                status_separacao: item.status,
                numero_os: item.ordens_servico?.numero_os || '',
                cliente: item.ordens_servico?.nome_cliente_digitavel || '',
                modelo_maquina: item.ordens_servico?.modelo_maquina || '',
            })));

        } catch (error) {
            console.error('Erro ao carregar dados do almoxarifado:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregarDados(); }, [carregarDados]);

    // Marcar peça como "Aguardando Retirada" (peças do estoque)
    const marcarAguardandoRetirada = async (item: ItemPendente) => {
        setProcessando(prev => ({ ...prev, [item.id]: true }));
        try {
            const { error } = await (supabase
                .from('itens_os') as any)
                .update({ status_separacao: 'AGUARDANDO_RETIRADA' })
                .eq('id', item.id);

            if (error) throw error;
            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, [item.id]: false }));
        }
    };

    // Confirmar chegada de peça comprada
    const confirmarChegada = async (item: ItemPendente) => {
        setProcessando(prev => ({ ...prev, [item.id]: true }));
        try {
            // 1. Atualizar solicitação de compra para ENTREGUE
            const { error: e1 } = await (supabase
                .from('solicitacoes_compra') as any)
                .update({ status: 'ENTREGUE', data_entrega_real: new Date().toISOString() })
                .eq('id', item.id);

            if (e1) throw e1;

            // 2. Buscar o item_os vinculado e marcar como AGUARDANDO_RETIRADA
            const { data: solicitacao } = await supabase
                .from('solicitacoes_compra')
                .select('item_os_id')
                .eq('id', item.id)
                .single();

            if ((solicitacao as any)?.item_os_id) {
                await (supabase
                    .from('itens_os') as any)
                    .update({ status_separacao: 'AGUARDANDO_RETIRADA' })
                    .eq('id', (solicitacao as any).item_os_id);
            }

            carregarDados();
        } catch (error: any) {
            alert(`Erro: ${error.message}`);
        } finally {
            setProcessando(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const filteredSeparar = itensSeparar.filter(i =>
        i.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.codigo_peca || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredChegando = itensChegando.filter(i =>
        i.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.numero_os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.codigo_peca || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderItemCard = (item: ItemPendente, tipo: 'separar' | 'chegando') => (
        <div key={item.id} className="glass-card-enterprise p-5 rounded-2xl border border-white/[0.05] hover:border-blue-500/20 transition-all">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                    OS #{item.numero_os}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${tipo === 'separar' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                    }`}>
                    {tipo === 'separar' ? 'Separar' : 'Chegando'}
                </span>
            </div>

            <h3 className="text-sm font-bold text-white mb-1">{item.descricao}</h3>
            <p className="text-xs text-[var(--text-muted)] mb-1">
                Código: <span className="text-blue-400">{item.codigo_peca || 'N/A'}</span> • Qtd: <span className="text-white font-bold">{item.quantidade}</span>
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3 truncate">{item.cliente} • {item.modelo_maquina}</p>

            <div className="pt-3 border-t border-white/5">
                {tipo === 'separar' ? (
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={processando[item.id]}
                        onClick={() => marcarAguardandoRetirada(item)}
                        leftIcon={<PackageCheck className="w-4 h-4" />}
                        className="w-full"
                    >
                        {processando[item.id] ? 'Processando...' : 'Marcar Aguardando Retirada'}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={processando[item.id]}
                        onClick={() => confirmarChegada(item)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="w-full"
                    >
                        {processando[item.id] ? 'Processando...' : 'Confirmar Chegada'}
                    </Button>
                )}
            </div>
        </div>
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
                        <p className="text-[var(--text-muted)] mt-1 ml-1">Gestão de separação e recebimento de peças</p>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={carregarDados}
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
                    >
                        Atualizar
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl">
                                <Box className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{itensSeparar.length}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Para Separar</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-violet-500/10 rounded-xl">
                                <Truck className="w-6 h-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{itensChegando.length}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Peças Chegando</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-white">{itensSeparar.length + itensChegando.length}</p>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Total Pendente</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 p-1.5 bg-[var(--surface-light)]/50 backdrop-blur-md border border-white/5 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveSection('separar')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all relative ${activeSection === 'separar'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <Box className="w-4 h-4" /> Separar
                            {itensSeparar.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                    {itensSeparar.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveSection('chegando')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase transition-all relative ${activeSection === 'chegando'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                                }`}
                        >
                            <Truck className="w-4 h-4" /> Chegando
                            {itensChegando.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-[8px] font-black rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                    {itensChegando.length}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="relative group w-full lg:w-[400px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-emerald-500 transition-all" />
                        <input
                            type="text"
                            placeholder="Buscar peça, código ou OS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} width="100%" height={200} className="rounded-2xl" />
                        ))}
                    </div>
                ) : activeSection === 'separar' ? (
                    filteredSeparar.length === 0 ? (
                        <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma peça para separar</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Tudo em dia! 🎉</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
                            {filteredSeparar.map(item => renderItemCard(item, 'separar'))}
                        </div>
                    )
                ) : (
                    filteredChegando.length === 0 ? (
                        <div className="text-center py-20 glass-card-enterprise rounded-3xl border border-white/5 opacity-60">
                            <Truck className="w-12 h-12 mx-auto mb-4 text-violet-400" />
                            <p className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Nenhuma peça a caminho</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">Sem compras pendentes de recebimento</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slideUp">
                            {filteredChegando.map(item => renderItemCard(item, 'chegando'))}
                        </div>
                    )
                )}
            </div>
        </AppLayout>
    );
}
