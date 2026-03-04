/**
 * Modal para lançar despesas de viagem em uma OS
 * Tipos: KM, Abastecimento, Alimentação, Hospedagem, Pedágio, Outros
 */

import { useState, useEffect } from 'react';
import { X, Car, Fuel, Utensils, Hotel, CircleDollarSign, MoreHorizontal, Save, Wrench } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { despesasService, TipoDespesa, CreateDespesaInput } from '@/services/despesasService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

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
    { value: 'MAO_DE_OBRA', label: 'Mão de Obra', icon: Wrench, color: 'text-indigo-400 bg-indigo-500/10' },
    { value: 'OUTROS', label: 'Outros Custos', icon: MoreHorizontal, color: 'text-slate-400 bg-slate-500/10' },
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
            <div className="relative w-full max-w-lg bg-[var(--surface)] p-6 rounded-2xl shadow-2xl border border-[var(--border-subtle)] max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8 border-b border-[var(--border-subtle)] pb-4">
                    <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Lançar Despesa</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">Protocolo OS</span>
                            <span className="text-sm font-black text-blue-500">#{osNumero}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-all" disabled={loading}>
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Seleção de Tipo */}
                <div className="mb-8">
                    <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 ml-1">
                        Selecione a Categoria
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {tiposDespesa.map((tipo) => {
                            const Icon = tipo.icon;
                            const isSelected = tipoSelecionado === tipo.value;
                            return (
                                <button
                                    key={tipo.value}
                                    onClick={() => setTipoSelecionado(tipo.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                                        isSelected
                                            ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5 scale-[1.02]"
                                            : "border-[var(--border-subtle)] bg-[var(--surface-light)] hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)]"
                                    )}
                                    disabled={loading}
                                >
                                    <div className={cn(
                                        "p-2.5 rounded-xl transition-colors",
                                        isSelected ? "bg-blue-500 text-white" : tipo.color
                                    )}>
                                        <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest text-center",
                                        isSelected ? "text-blue-500" : "text-[var(--text-muted)]"
                                    )}>
                                        {tipo.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Campos Dinâmicos */}
                <div className="space-y-6 mb-8">
                    {/* Campos para KM */}
                    {tipoSelecionado === 'KM' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Km Inicial"
                                    type="number"
                                    value={kmInicial}
                                    onChange={(e) => setKmInicial(e.target.value)}
                                    placeholder="0"
                                    className="bg-[var(--surface-light)]"
                                    disabled={loading}
                                />
                                <Input
                                    label="Km Final"
                                    type="number"
                                    value={kmFinal}
                                    onChange={(e) => setKmFinal(e.target.value)}
                                    placeholder="0"
                                    className="bg-[var(--surface-light)]"
                                    disabled={loading}
                                />
                            </div>
                            <Input
                                label="Valor por Km (R$)"
                                type="number"
                                step="0.01"
                                value={valorPorKm}
                                onChange={(e) => setValorPorKm(e.target.value)}
                                className="bg-[var(--surface-light)]"
                                disabled={loading}
                            />
                            {kmRodados > 0 && (
                                <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl shadow-inner">
                                    <div className="flex justify-between items-center pb-3 border-b border-blue-500/10">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Distância Percorrida</span>
                                        <span className="text-xl font-black text-[var(--text-primary)]">{kmRodados} <span className="text-xs font-medium text-blue-400">km</span></span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3">
                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total do Reembolso</span>
                                        <span className="text-2xl font-black text-blue-500">{formatCurrency(valorTotalKm)}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Campos para Abastecimento */}
                    {tipoSelecionado === 'ABASTECIMENTO' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Litros (opcional)"
                                type="number"
                                step="0.01"
                                value={quantidade}
                                onChange={(e) => setQuantidade(e.target.value)}
                                placeholder="0.00"
                                className="bg-[var(--surface-light)]"
                                disabled={loading}
                            />
                            <Input
                                label="Valor Total (R$)"
                                type="number"
                                step="0.01"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0.00"
                                className="bg-[var(--surface-light)]"
                                disabled={loading}
                            />
                        </div>
                    )}

                    {/* Campos para outras despesas */}
                    {!['KM', 'ABASTECIMENTO'].includes(tipoSelecionado) && (
                        <Input
                            label="Valor da Despesa (R$)"
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0.00"
                            className="bg-[var(--surface-light)]"
                            disabled={loading}
                        />
                    )}

                    {/* Descrição */}
                    <Input
                        label="Observações / Motivo"
                        placeholder="Ex: Pedágio na BR-163, Fazenda Boa Vista..."
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="bg-[var(--surface-light)]"
                        disabled={loading}
                    />

                    {/* Data */}
                    <Input
                        label="Data do Comprovante"
                        type="date"
                        value={dataDespesa}
                        onChange={(e) => setDataDespesa(e.target.value)}
                        className="bg-[var(--surface-light)]"
                        disabled={loading}
                    />
                </div>

                {/* Ações */}
                <div className="flex gap-4 pt-4 border-t border-[var(--border-subtle)]">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1 font-bold py-4 rounded-xl"
                        disabled={loading}
                    >
                        Descartar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1 font-black py-4 rounded-xl shadow-lg shadow-blue-500/20"
                        disabled={loading || (tipoSelecionado === 'KM' ? kmRodados <= 0 : !valor)}
                        isLoading={loading}
                        leftIcon={<Save className="w-4 h-4" />}
                    >
                        Confirmar Lançamento
                    </Button>
                </div>
            </div>
        </div>
    );
}
