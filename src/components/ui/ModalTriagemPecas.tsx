import { useState, useEffect } from 'react';
import {
    X,
    Package,
    ShoppingCart,
    Warehouse,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { comprasService } from '@/services/compras.service';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './Button';
import { notifyCompras, notifyAlmoxarifado } from '@/lib/notificationHelper';

interface ItemOS {
    id: string;
    ordem_servico_id: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    status_separacao: string;
    valor_unitario: number;
}

interface OSComPecasPendentes {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    itens: ItemOS[];
}

interface ModalTriagemPecasProps {
    isOpen: boolean;
    onClose: () => void;
    os: OSComPecasPendentes;
    onSuccess: () => void;
}

export function ModalTriagemPecas({ isOpen, onClose, os, onSuccess }: ModalTriagemPecasProps) {
    const { profile } = useAuth();
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [decisoes, setDecisoes] = useState<Record<string, 'estoque' | 'compra' | null>>({});
    const [processados, setProcessados] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            setDecisoes({});
            setProcessados([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const pecasPendentes = os.itens.filter(
        i => i.status_separacao === 'PENDENTE' && !processados.includes(i.id)
    );

    const handleSolicitarEstoque = async (item: ItemOS) => {
        setLoading(prev => ({ ...prev, [item.id]: true }));
        try {
            // Atualizar status do item para SOLICITADO_ESTOQUE
            const { error } = await (supabase
                .from('itens_os') as any)
                .update({ status_separacao: 'SOLICITADO_ESTOQUE' })
                .eq('id', item.id);

            if (error) throw error;

            setProcessados(prev => [...prev, item.id]);
            setDecisoes(prev => ({ ...prev, [item.id]: 'estoque' }));

            // Fire-and-forget: notify ALMOXARIFADO to separate the part
            notifyAlmoxarifado(os.id, item.descricao).catch(() => {});
        } catch (error: any) {
            alert(`Erro ao solicitar do estoque: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const handleSolicitarCompra = async (item: ItemOS) => {
        setLoading(prev => ({ ...prev, [item.id]: true }));
        try {
            // 1. Criar solicitação de compra vinculada à OS e ao item
            await comprasService.criarSolicitacao({
                ordem_servico_id: os.id,
                item_os_id: item.id,
                codigo_peca: item.codigo_peca || undefined,
                descricao_peca: item.descricao,
                quantidade: item.quantidade,
                unidade: 'UN',
                urgencia: 'ALTA',
                solicitante_id: profile?.id,
            });

            // 2. Atualizar status do item
            const { error } = await (supabase
                .from('itens_os') as any)
                .update({ status_separacao: 'SOLICITADO_COMPRA' })
                .eq('id', item.id);

            if (error) throw error;

            setProcessados(prev => [...prev, item.id]);
            setDecisoes(prev => ({ ...prev, [item.id]: 'compra' }));

            // Fire-and-forget: notify COMPRAS about purchase request
            notifyCompras(os.id, item.descricao).catch(() => {});
        } catch (error: any) {
            alert(`Erro ao solicitar compra: ${error.message}`);
        } finally {
            setLoading(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const todasProcessadas = pecasPendentes.length === 0 && processados.length > 0;

    const handleFechar = () => {
        if (processados.length > 0) {
            onSuccess();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="glass-card-enterprise p-0 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                            <Package className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Triagem de Peças</h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                OS #{os.numero_os} • {os.nome_cliente_digitavel || 'Cliente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleFechar}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Instruções */}
                <div className="px-6 py-3 bg-amber-500/5 border-b border-amber-500/10">
                    <p className="text-xs text-amber-400 font-medium">
                        📋 Para cada peça, decida se está <strong>disponível no estoque</strong> ou se precisa ser <strong>comprada</strong>.
                    </p>
                </div>

                {/* Lista de Peças */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {todasProcessadas ? (
                        <div className="text-center py-12">
                            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                            <h3 className="text-lg font-bold text-white mb-2">Triagem Concluída!</h3>
                            <p className="text-sm text-[var(--text-muted)]">
                                Todas as peças foram encaminhadas. O almoxarifado e/ou departamento de compras serão notificados.
                            </p>
                        </div>
                    ) : pecasPendentes.length === 0 && processados.length === 0 ? (
                        <div className="text-center py-12 opacity-60">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
                            <p className="text-sm text-[var(--text-muted)]">Nenhuma peça pendente de triagem nesta OS.</p>
                        </div>
                    ) : (
                        <>
                            {/* Peças pendentes */}
                            {pecasPendentes.map(item => (
                                <div key={item.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.descricao}</p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                Código: <span className="text-blue-400">{item.codigo_peca || 'Não informado'}</span> • Qtd: <span className="text-white font-bold">{item.quantidade}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={!!loading[item.id]}
                                            leftIcon={loading[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Warehouse className="w-4 h-4" />}
                                            onClick={() => handleSolicitarEstoque(item)}
                                        >
                                            Retirar do Estoque
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={!!loading[item.id]}
                                            leftIcon={loading[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                                            onClick={() => handleSolicitarCompra(item)}
                                        >
                                            Solicitar Compra
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <Button variant="secondary" onClick={handleFechar}>
                        {todasProcessadas ? 'Concluir' : 'Fechar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
