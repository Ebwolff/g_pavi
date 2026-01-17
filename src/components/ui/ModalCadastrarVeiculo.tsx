/**
 * Modal para cadastrar/editar veículo da frota
 */

import { useState, useEffect } from 'react';
import { X, Car, Save } from 'lucide-react';
import { Button } from './Button';
import { frotaService, Veiculo, CreateVeiculoInput } from '@/services/frotaService';

interface ModalCadastrarVeiculoProps {
    isOpen: boolean;
    onClose: () => void;
    veiculo?: Veiculo | null;
    onSuccess?: () => void;
}

export function ModalCadastrarVeiculo({ isOpen, onClose, veiculo, onSuccess }: ModalCadastrarVeiculoProps) {
    const [loading, setLoading] = useState(false);
    const [placa, setPlaca] = useState('');
    const [modelo, setModelo] = useState('');
    const [marca, setMarca] = useState('');
    const [ano, setAno] = useState('');
    const [cor, setCor] = useState('');
    const [kmAtual, setKmAtual] = useState('0');
    const [observacoes, setObservacoes] = useState('');

    const isEditing = !!veiculo;

    useEffect(() => {
        if (isOpen) {
            if (veiculo) {
                setPlaca(veiculo.placa);
                setModelo(veiculo.modelo);
                setMarca(veiculo.marca || '');
                setAno(veiculo.ano?.toString() || '');
                setCor(veiculo.cor || '');
                setKmAtual(veiculo.km_atual?.toString() || '0');
                setObservacoes(veiculo.observacoes || '');
            } else {
                setPlaca('');
                setModelo('');
                setMarca('');
                setAno('');
                setCor('');
                setKmAtual('0');
                setObservacoes('');
            }
        }
    }, [isOpen, veiculo]);

    if (!isOpen) return null;

    const formatPlaca = (value: string) => {
        // Remove caracteres não alfanuméricos e limita a 7 caracteres
        const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 7);
        // Formato Mercosul: ABC1D23 ou antigo: ABC1234
        if (clean.length <= 3) return clean;
        if (clean.length <= 4) return `${clean.substring(0, 3)}-${clean.substring(3)}`;
        return `${clean.substring(0, 3)}-${clean.substring(3, 7)}`;
    };

    const handleSubmit = async () => {
        if (!placa || !modelo) {
            alert('Placa e Modelo são obrigatórios');
            return;
        }

        setLoading(true);
        try {
            const dados: CreateVeiculoInput = {
                placa: placa.replace('-', ''),
                modelo,
                marca: marca || undefined,
                ano: ano ? parseInt(ano) : undefined,
                cor: cor || undefined,
                km_atual: parseFloat(kmAtual) || 0,
                observacoes: observacoes || undefined,
            };

            if (isEditing && veiculo) {
                await frotaService.atualizarVeiculo(veiculo.id, dados);
            } else {
                await frotaService.criarVeiculo(dados);
            }

            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar veículo:', error);
            if (error.code === '23505') {
                alert('Esta placa já está cadastrada');
            } else {
                alert('Erro ao salvar veículo. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg glass-card-enterprise p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Car className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                {isEditing ? 'Editar Veículo' : 'Cadastrar Veículo'}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)]">
                                {isEditing ? 'Altere os dados do veículo' : 'Adicione um novo veículo à frota'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors" disabled={loading}>
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4 mb-6">
                    {/* Placa */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Placa *
                        </label>
                        <input
                            type="text"
                            value={placa}
                            onChange={(e) => setPlaca(formatPlaca(e.target.value))}
                            placeholder="ABC-1234"
                            className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none font-mono uppercase"
                            disabled={loading}
                            maxLength={8}
                        />
                    </div>

                    {/* Modelo e Marca */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Modelo *
                            </label>
                            <input
                                type="text"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                placeholder="Ex: Hilux SW4"
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Marca
                            </label>
                            <input
                                type="text"
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                                placeholder="Ex: Toyota"
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Ano e Cor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Ano
                            </label>
                            <input
                                type="number"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                placeholder="Ex: 2023"
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
                                disabled={loading}
                                min="1990"
                                max="2030"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                Cor
                            </label>
                            <input
                                type="text"
                                value={cor}
                                onChange={(e) => setCor(e.target.value)}
                                placeholder="Ex: Branco"
                                className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Km Atual */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Km Atual
                        </label>
                        <input
                            type="number"
                            value={kmAtual}
                            onChange={(e) => setKmAtual(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none"
                            disabled={loading}
                            min="0"
                        />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            Observações
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Observações sobre o veículo..."
                            rows={2}
                            className="w-full px-4 py-2.5 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:border-[var(--primary)] outline-none resize-none"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="flex-1"
                        disabled={loading || !placa || !modelo}
                        isLoading={loading}
                        leftIcon={<Save className="w-4 h-4" />}
                    >
                        {isEditing ? 'Salvar' : 'Cadastrar'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
