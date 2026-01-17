/**
 * Modal para alocar veículo a um técnico
 */

import { useState, useEffect } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Button } from './Button';
import { frotaService, Veiculo } from '@/services/frotaService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Tecnico {
    id: string;
    nome_completo: string;
}

interface ModalAlocarVeiculoProps {
    isOpen: boolean;
    onClose: () => void;
    veiculo: Veiculo | null;
    onSuccess?: () => void;
}

export function ModalAlocarVeiculo({ isOpen, onClose, veiculo, onSuccess }: ModalAlocarVeiculoProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
    const [selectedTecnico, setSelectedTecnico] = useState<string>('');
    const [loadingTecnicos, setLoadingTecnicos] = useState(false);

    useEffect(() => {
        if (isOpen) {
            carregarTecnicos();
            setSelectedTecnico('');
        }
    }, [isOpen]);

    const carregarTecnicos = async () => {
        setLoadingTecnicos(true);
        try {
            const { data } = await supabase
                .from('tecnicos' as any)
                .select('id, nome_completo')
                .order('nome_completo');

            setTecnicos((data || []) as Tecnico[]);
        } catch (error) {
            console.error('Erro ao carregar técnicos:', error);
        } finally {
            setLoadingTecnicos(false);
        }
    };

    if (!isOpen || !veiculo) return null;

    const handleAlocar = async () => {
        if (!selectedTecnico) return;

        setLoading(true);
        try {
            await frotaService.alocarVeiculo(veiculo.id, selectedTecnico, user?.id);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Erro ao alocar veículo:', error);
            alert('Erro ao alocar veículo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md glass-card-enterprise p-6 rounded-2xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <UserPlus className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                Alocar Veículo
                            </h2>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] ml-11">
                            <span className="font-mono font-bold text-[var(--text-secondary)]">{veiculo.placa}</span>
                            {' · '}
                            {veiculo.marca} {veiculo.modelo}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors" disabled={loading}>
                        <X className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                </div>

                {/* Lista de Técnicos */}
                <div className="space-y-3 mb-6">
                    <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Selecione o Técnico
                    </label>

                    {loadingTecnicos ? (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <p className="text-sm">Carregando técnicos...</p>
                        </div>
                    ) : tecnicos.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <p className="text-sm">Nenhum técnico cadastrado</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {tecnicos.map((tecnico) => (
                                <button
                                    key={tecnico.id}
                                    onClick={() => setSelectedTecnico(tecnico.id)}
                                    className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between ${selectedTecnico === tecnico.id
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                                        }`}
                                    disabled={loading}
                                >
                                    <span className="font-semibold text-[var(--text-primary)]">
                                        {tecnico.nome_completo}
                                    </span>
                                    {selectedTecnico === tecnico.id && (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info do Veículo */}
                <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 mb-6">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Km Atual do Veículo</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                        {veiculo.km_atual?.toLocaleString('pt-BR')} km
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAlocar}
                        className="flex-1"
                        disabled={!selectedTecnico || loading}
                        isLoading={loading}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                        Alocar
                    </Button>
                </div>
            </div>
        </div>
    );
}
