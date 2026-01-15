/**
 * Modal para lançar despesas de viagem em uma OS
 * Tipos: KM, Abastecimento, Alimentação, Hospedagem, Pedágio, Outros
 */

import { useState, useEffect } from 'react';
import { X, Car, Fuel, Utensils, Hotel, CircleDollarSign, MoreHorizontal, Save } from 'lucide-react';
import { Button } from './Button';
import { despesasService, TipoDespesa, CreateDespesaInput } from '@/services/despesasService';
import { useAuth } from '@/hooks/useAuth';

interface ModalLancarDespesaProps {
    isOpen: boolean;
    onClose: () => void;
    osId: string;
    osNumero: string;
    onSuccess?: () => void;
}

const tiposDespesa: { value: TipoDespesa; label: string; icon: any; color: string }[] = [
    { value: 'KM', label: 'Quilometragem', icon: Car, color: 'text-blue-400 bg-blue-500/10' },
    { value: 'ABASTECIMENTO', label: 'Abastecimento', icon: Fuel, color: 'text-amber-400 bg-amber-500/10' },
    { value: 'ALIMENTACAO', label: 'Alimentação', icon: Utensils, color: 'text-emerald-400 bg-emerald-500/10' },
    { value: 'HOSPEDAGEM', label: 'Hospedagem', icon: Hotel, color: 'text-purple-400 bg-purple-500/10' },
    { value: 'PEDAGIO', label: 'Pedágio', icon: CircleDollarSign, color: 'text-rose-400 bg-rose-500/10' },
    { value: 'OUTROS', label: 'Outros', icon: MoreHorizontal, color: 'text-slate-400 bg-slate-500/10' },
];

export function ModalLancarDespesa({ isOpen, onClose, osId, osNumero, onSuccess }: ModalLancarDespesaProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [tipoSelecionado, setTipoSelecionado] = useState<TipoDespesa>('KM');

    // Campos do formulário
    const [kmInicial, setKmInicial] = useState('');
    const [kmFinal, setKmFinal] = useState('');
    const [valorPorKm, setValorPorKm] = useState('1.50');
    const [valor, setValor] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [descricao, setDescricao] = useState('');
    const [dataDespesa, setDataDespesa] = useState(new Date().toISOString().split('T')[0]);

    // Calcular valor total para km
    const kmRodados = parseFloat(kmFinal || '0') - parseFloat(kmInicial || '0');
    const valorTotalKm = kmRodados > 0 ? kmRodados * parseFloat(valorPorKm || '0') : 0;

    // Reset form quando modal abre/fecha
    useEffect(() => {
        if (isOpen) {
            setTipoSelecionado('KM');
            setKmInicial('');
            setKmFinal('');
            setValorPorKm('1.50');
            setValor('');
            setQuantidade('');
            setDescricao('');
            setDataDespesa(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const dados: CreateDespesaInput = {
                ordem_servico_id: osId,
                tipo: tipoSelecionado,
                data_despesa: dataDespesa,
                responsavel_id: user?.id,
                descricao: descricao || undefined,
                quantidade: undefined,
                valor_unitario: undefined,
                valor_total: 0,
            };

            if (tipoSelecionado === 'KM') {
                dados.km_inicial = parseFloat(kmInicial) || 0;
                dados.km_final = parseFloat(kmFinal) || 0;
                dados.quantidade = kmRodados;
                dados.valor_unitario = parseFloat(valorPorKm) || 0;
                dados.valor_total = valorTotalKm;
                dados.descricao = `${kmRodados} km rodados`;
            } else if (tipoSelecionado === 'ABASTECIMENTO') {
                dados.quantidade = parseFloat(quantidade) || undefined;
                dados.valor_total = parseFloat(valor) || 0;
                dados.descricao = descricao || `Abastecimento${quantidade ? ` - ${quantidade}L` : ''}`;
            } else {
                dados.valor_total = parseFloat(valor) || 0;
                dados.descricao = descricao || tiposDespesa.find(t => t.value === tipoSelecionado)?.label;
            }

            await despesasService.criarDespesa(dados);

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Erro ao lançar despesa:', error);
            alert('Erro ao lançar despesa. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass-card-enterprise p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Lançar Despesa</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                            OS: <span className="font-mono font-semibold text-[var(--text-secondary)]">{osNumero}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors" disabled={loading}>
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Seleção de Tipo */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Tipo de Despesa
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {tiposDespesa.map((tipo) => {
                            const Icon = tipo.icon;
                            const isSelected = tipoSelecionado === tipo.value;
                            return (
                                <button
                                    key={tipo.value}
                                    onClick={() => setTipoSelecionado(tipo.value)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                                        }`}
                                    disabled={loading}
                                >
                                    <div className={`p-2 rounded-lg ${tipo.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                                        {tipo.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Campos Dinâmicos */}
                <div className="space-y-4 mb-6">
                    {/* Campos para KM */}
                    {tipoSelecionado === 'KM' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Km Inicial
                                    </label>
                                    <input
                                        type="number"
                                        value={kmInicial}
                                        onChange={(e) => setKmInicial(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Km Final
                                    </label>
                                    <input
                                        type="number"
                                        value={kmFinal}
                                        onChange={(e) => setKmFinal(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                    Valor por Km (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={valorPorKm}
                                    onChange={(e) => setValorPorKm(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                    disabled={loading}
                                />
                            </div>
                            {kmRodados > 0 && (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-blue-400 font-medium">Km Rodados:</span>
                                        <span className="text-lg font-bold text-blue-400">{kmRodados} km</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-blue-400 font-medium">Valor Total:</span>
                                        <span className="text-xl font-black text-white">{formatCurrency(valorTotalKm)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Campos para Abastecimento */}
                    {tipoSelecionado === 'ABASTECIMENTO' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Litros (opcional)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={quantidade}
                                        onChange={(e) => setQuantidade(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                        Valor Total (R$)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={valor}
                                        onChange={(e) => setValor(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Campos para outras despesas */}
                    {!['KM', 'ABASTECIMENTO'].includes(tipoSelecionado) && (
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Valor (R$)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0.00"
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Descrição */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Descrição (opcional)
                        </label>
                        <input
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Adicione uma descrição..."
                            className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                            disabled={loading}
                        />
                    </div>

                    {/* Data */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Data da Despesa
                        </label>
                        <input
                            type="date"
                            value={dataDespesa}
                            onChange={(e) => setDataDespesa(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-secondary)] focus:border-[var(--primary)] outline-none"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1"
                        disabled={loading || (tipoSelecionado === 'KM' ? kmRodados <= 0 : !valor)}
                        isLoading={loading}
                        leftIcon={<Save className="w-4 h-4" />}
                    >
                        Salvar Despesa
                    </Button>
                </div>
            </div>
        </div>
    );
}
