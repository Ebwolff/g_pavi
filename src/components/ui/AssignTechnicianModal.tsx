/**
 * Modal para atribuir técnico a uma OS
 * Usado pelo Chefe de Oficina
 */

import { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { Button } from './Button';

interface Tecnico {
    id: string;
    nome: string;
    osAtribuidas: number;
    osEmExecucao: number;
}

interface AssignTechnicianModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (tecnicoId: string) => Promise<void>;
    tecnicos: Tecnico[];
    osNumero: string;
    osCliente?: string;
}

export function AssignTechnicianModal({
    isOpen,
    onClose,
    onAssign,
    tecnicos,
    osNumero,
    osCliente
}: AssignTechnicianModalProps) {
    const [selectedTecnico, setSelectedTecnico] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleAssign = async () => {
        if (!selectedTecnico) return;

        setLoading(true);
        try {
            await onAssign(selectedTecnico);
            onClose();
            setSelectedTecnico('');
        } catch (error) {
            console.error('Erro ao atribuir técnico:', error);
            alert('Erro ao atribuir técnico. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-md glass-card-enterprise p-6 rounded-2xl shadow-2xl border border-white/10"
                style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <UserPlus className="w-5 h-5 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                Atribuir Técnico
                            </h2>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] ml-11">
                            OS: <span className="font-mono font-semibold text-[var(--text-secondary)]">{osNumero}</span>
                            {osCliente && (
                                <>
                                    <br />
                                    Cliente: <span className="font-medium text-[var(--text-secondary)]">{osCliente}</span>
                                </>
                            )}
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

                {/* Lista de Técnicos */}
                <div className="space-y-3 mb-6">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Selecione o Técnico
                    </label>

                    {tecnicos.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)]">
                            <p className="text-sm">Nenhum técnico disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tecnicos.map((tecnico) => (
                                <button
                                    key={tecnico.id}
                                    onClick={() => setSelectedTecnico(tecnico.id)}
                                    className={`w-full p-4 rounded-xl border transition-all text-left ${selectedTecnico === tecnico.id
                                            ? 'border-amber-500 bg-amber-500/10'
                                            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                                        }`}
                                    disabled={loading}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-[var(--text-primary)]">
                                                    {tecnico.nome}
                                                </p>
                                                {selectedTecnico === tecnico.id && (
                                                    <Check className="w-4 h-4 text-amber-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                                                <span>
                                                    <strong className="text-[var(--text-secondary)]">{tecnico.osAtribuidas}</strong> OS ativas
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    <strong className="text-blue-400">{tecnico.osEmExecucao}</strong> em execução
                                                </span>
                                            </div>
                                        </div>

                                        {/* Indicador de carga */}
                                        <div className="ml-4">
                                            <div className={`w-2 h-8 rounded-full ${tecnico.osAtribuidas >= 5 ? 'bg-rose-500' :
                                                    tecnico.osAtribuidas >= 3 ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                }`} />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAssign}
                        className="flex-1"
                        disabled={!selectedTecnico || loading}
                        isLoading={loading}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                    >
                        Atribuir
                    </Button>
                </div>
            </div>
        </div>
    );
}
