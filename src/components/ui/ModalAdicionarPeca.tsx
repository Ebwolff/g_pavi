import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from './Button';

interface ModalAdicionarPecaProps {
    isOpen: boolean;
    onClose: () => void;
    osId: string;
    onSuccess: () => void;
}

interface PecaForm {
    codigo_peca: string;
    descricao: string;
    quantidade: number;
}

export function ModalAdicionarPeca({ isOpen, onClose, osId, onSuccess }: ModalAdicionarPecaProps) {
    const [loading, setLoading] = useState(false);
    const [pecas, setPecas] = useState<PecaForm[]>([{
        codigo_peca: '',
        descricao: '',
        quantidade: 1
    }]);

    if (!isOpen) return null;

    const adicionarLinhaPeca = () => {
        setPecas([...pecas, { codigo_peca: '', descricao: '', quantidade: 1 }]);
    };

    const removerLinhaPeca = (index: number) => {
        if (pecas.length > 1) {
            setPecas(pecas.filter((_, i) => i !== index));
        }
    };

    const atualizarPeca = (index: number, field: keyof PecaForm, value: string | number) => {
        const novasPecas = [...pecas];
        novasPecas[index] = { ...novasPecas[index], [field]: value };
        setPecas(novasPecas);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validar peças
            const pecasValidas = pecas.filter(p => p.descricao.trim() && p.quantidade > 0);

            if (pecasValidas.length === 0) {
                alert('Adicione pelo menos uma peça válida');
                return;
            }

            // Inserir peças
            const { error } = await supabase
                .from('itens_os')
                .insert(
                    pecasValidas.map(peca => ({
                        ordem_servico_id: osId,
                        codigo_peca: peca.codigo_peca || null,
                        descricao: peca.descricao,
                        quantidade: peca.quantidade,
                        valor_unitario: 0,
                        status_separacao: 'PENDENTE'
                    }))
                );

            if (error) throw error;

            // Atualizar status da OS para AGUARDANDO_PECAS
            await supabase
                .from('ordens_servico')
                .update({ status_atual: 'AGUARDANDO_PECAS' })
                .eq('id', osId);

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erro ao adicionar peças:', error);
            alert('Erro ao adicionar peças. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fadeIn">
            <div className="glass-card-enterprise p-6 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        Lançar Peças Necessárias
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Lista de Peças */}
                    <div className="space-y-3">
                        {pecas.map((peca, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-white/[0.02] rounded-lg border border-white/5">
                                {/* Código */}
                                <div className="col-span-3">
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                                        Código
                                    </label>
                                    <input
                                        type="text"
                                        value={peca.codigo_peca}
                                        onChange={(e) => atualizarPeca(index, 'codigo_peca', e.target.value)}
                                        placeholder="Ex: FILTRO-001"
                                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                    />
                                </div>

                                {/* Descrição */}
                                <div className="col-span-6">
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                                        Descrição *
                                    </label>
                                    <input
                                        type="text"
                                        value={peca.descricao}
                                        onChange={(e) => atualizarPeca(index, 'descricao', e.target.value)}
                                        placeholder="Ex: Filtro de óleo motor"
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                    />
                                </div>

                                {/* Quantidade */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                                        Qtd *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={peca.quantidade}
                                        onChange={(e) => atualizarPeca(index, 'quantidade', parseInt(e.target.value) || 1)}
                                        required
                                        className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                                    />
                                </div>

                                {/* Remover */}
                                <div className="col-span-1 flex items-end">
                                    {pecas.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removerLinhaPeca(index)}
                                            className="p-2 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Adicionar Mais */}
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={adicionarLinhaPeca}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Adicionar Mais Peças
                    </Button>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Peças'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
