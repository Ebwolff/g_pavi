import { logger } from '@/lib/logger';
import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from './Button';
import { notifyAlmoxarifado } from '@/lib/notificationHelper';

export interface ItemAprovacao {
    id: string;
    codigo_peca: string | null;
    descricao: string;
    quantidade: number;
    status_aprovacao: string;
}

export interface OSAprovacaoPecas {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    itens: ItemAprovacao[];
}

interface ModalAprovacaoPecasProps {
    os: OSAprovacaoPecas;
    onClose: () => void;
    onSuccess: () => void;
}

export function ModalAprovacaoPecas({ os, onClose, onSuccess }: ModalAprovacaoPecasProps) {
    const [loading, setLoading] = useState(false);
    
    // Estado local para armazenar a decisão de cada item: 'APROVADO' | 'REPROVADO' | 'PENDENTE'
    const [decisoes, setDecisoes] = useState<Record<string, 'APROVADO' | 'REPROVADO' | 'PENDENTE'>>(
        os.itens.reduce((acc, item) => ({ ...acc, [item.id]: 'PENDENTE' }), {})
    );

    const handleDecidirProp = (itemId: string, decisao: 'APROVADO' | 'REPROVADO') => {
        setDecisoes(prev => ({ ...prev, [itemId]: decisao }));
    };

    const handleAprovarTodos = () => {
        const novas = { ...decisoes };
        os.itens.forEach(i => novas[i.id] = 'APROVADO');
        setDecisoes(novas);
    };

    const handleSalvar = async () => {
        // Verificar se todos foram decididos
        const pendentes = Object.values(decisoes).filter(d => d === 'PENDENTE');
        if (pendentes.length > 0) {
            alert('Por favor, aprove ou reprove todas as peças da lista.');
            return;
        }

        setLoading(true);

        try {
            // Como Supabase não tem update em batch fácil sem RPC, faremos updates individuais (promessas em paralelo)
            const promessas = os.itens.map(item => {
                const decisao = decisoes[item.id];
                return supabase
                    .from('itens_os')
                    .update({ status_aprovacao: decisao })
                    .eq('id', item.id);
            });

            const resultados = await Promise.all(promessas);
            
            // Verifica erros
            const erros = resultados.filter(r => r.error);
            if (erros.length > 0) {
                throw new Error('Erro ao atualizar alguns itens.');
            }

            // Opcional: Adicionar na tabela historico_status_os que a validação ocorreu
            await supabase
                .from('historico_status_os')
                .insert({
                    ordem_servico_id: os.id,
                    status_anterior: 'AGUARDANDO_PECAS',
                    status_novo: 'AGUARDANDO_PECAS', // Mantém, mas registra
                    motivo_mudanca: 'Consultor realizou a aprovação das requisições extras do técnico.',
                    usuario_id: (await supabase.auth.getUser()).data.user?.id
                });

            onSuccess();

            // Fire-and-forget: notify ALMOXARIFADO about approved parts
            const pecasAprovadas = os.itens.filter(i => decisoes[i.id] === 'APROVADO');
            if (pecasAprovadas.length > 0) {
                const descricoes = pecasAprovadas.map(p => p.descricao).join(', ');
                notifyAlmoxarifado(os.id, descricoes).catch(() => {});
            }
        } catch (error) {
            logger.error('Erro ao salvar aprovações:', error);
            alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="glass-card-enterprise p-6 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Aprovação de Requisição do Técnico
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            OS #{os.numero_os} - {os.nome_cliente_digitavel || 'Cliente'} ({os.modelo_maquina})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
                    <div className="flex justify-end mb-4">
                        <Button variant="secondary" onClick={handleAprovarTodos} disabled={loading}>
                            Aprovar Todos
                        </Button>
                    </div>

                    {os.itens.map((item) => (
                        <div key={item.id} className={`p-4 rounded-xl border transition-colors flex items-center justify-between gap-4 ${
                            decisoes[item.id] === 'APROVADO' ? 'bg-emerald-500/10 border-emerald-500/30' :
                            decisoes[item.id] === 'REPROVADO' ? 'bg-rose-500/10 border-rose-500/30' :
                            'bg-white/[0.02] border-white/10'
                        }`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                                        {item.codigo_peca || 'S/N'}
                                    </span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        Qtd: {item.quantidade}
                                    </span>
                                </div>
                                <p className="font-bold text-white text-sm">{item.descricao}</p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className={`p-2.5 rounded-lg transition-all flex items-center gap-2 border ${
                                        decisoes[item.id] === 'REPROVADO'
                                            ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20'
                                            : 'bg-white/5 text-[var(--text-muted)] hover:bg-rose-500/20 hover:text-rose-400 border-transparent hover:border-rose-500/30'
                                    }`}
                                    onClick={() => handleDecidirProp(item.id, 'REPROVADO')}
                                    disabled={loading}
                                >
                                    <XCircle className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Reprovar</span>
                                </button>
                                
                                <button
                                    className={`p-2.5 rounded-lg transition-all flex items-center gap-2 border ${
                                        decisoes[item.id] === 'APROVADO'
                                            ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                            : 'bg-white/5 text-[var(--text-muted)] hover:bg-emerald-500/20 hover:text-emerald-400 border-transparent hover:border-emerald-500/30'
                                    }`}
                                    onClick={() => handleDecidirProp(item.id, 'APROVADO')}
                                    disabled={loading}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Aprovar</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t border-white/10 flex-shrink-0">
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSalvar} disabled={loading}>
                        {loading ? 'Salvando...' : 'Confirmar Avaliação'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
