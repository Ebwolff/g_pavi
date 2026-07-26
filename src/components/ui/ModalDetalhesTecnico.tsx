import React from 'react';
import {
    X,
    Wrench,
    Clock,
    CheckCircle,
    ChevronRight,
    User
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';
import type { StatusOS } from '@/types/database.types';

interface OSShort {
    id: string;
    numero_os: string;
    nome_cliente_digitavel: string | null;
    modelo_maquina: string | null;
    status_atual: StatusOS;
    data_abertura: string;
}

interface ModalDetalhesTecnicoProps {
    isOpen: boolean;
    onClose: () => void;
    tecnico: {
        id: string;
        nome: string;
        isRegistered: boolean;
        stats?: {
            osAtribuidas: number;
            osEmExecucao: number;
            osConcluidas: number;
        };
        ordens_servico?: OSShort[];
    } | null;
}

export const ModalDetalhesTecnico: React.FC<ModalDetalhesTecnicoProps> = ({ isOpen, onClose, tecnico }) => {
    const navigate = useNavigate();

    if (!isOpen || !tecnico) return null;

    const osAtivas = tecnico.ordens_servico?.filter(os => !['CONCLUIDA', 'FATURADA', 'CANCELADA'].includes(os.status_atual)) || [];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[var(--surface)] border border-[var(--border-subtle)] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--surface-light)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <User className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">
                                {tecnico.nome}
                            </h2>
                            <p className="text-[var(--text-muted)] text-sm font-medium">
                                {tecnico.isRegistered ? 'Técnico Registrado' : 'Perfil Pendente'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto scrollbar-visao360 space-y-8">
                    {/* KPIs Rápidos */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl text-center">
                            <Wrench className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                            <p className="text-2xl font-black text-[var(--text-primary)]">{tecnico.stats?.osAtribuidas || 0}</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Ativo</p>
                        </div>
                        <div className="p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl text-center">
                            <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                            <p className="text-2xl font-black text-[var(--text-primary)]">{tecnico.stats?.osEmExecucao || 0}</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Em Execução</p>
                        </div>
                        <div className="p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl text-center">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                            <p className="text-2xl font-black text-[var(--text-primary)]">{tecnico.stats?.osConcluidas || 0}</p>
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Concluídas</p>
                        </div>
                    </div>

                    {/* Lista de OS Ativas */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-2">
                            <Wrench className="w-4 h-4" />
                            Ordens de Serviço Ativas ({osAtivas.length})
                        </h3>

                        {osAtivas.length === 0 ? (
                            <div className="py-8 text-center border border-dashed border-[var(--border-subtle)] rounded-2xl">
                                <p className="text-sm text-[var(--text-muted)]">Nenhuma OS em andamento para este técnico.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {osAtivas.map(os => (
                                    <div
                                        key={os.id}
                                        className="p-4 bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-2xl hover:bg-[var(--surface-hover)] transition-all group flex items-center justify-between"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-blue-400">#{os.numero_os}</span>
                                                <StatusBadge status={os.status_atual} size="sm" />
                                            </div>
                                            <h4 className="text-sm font-black text-[var(--text-primary)] uppercase truncate">
                                                {os.nome_cliente_digitavel || 'S/ Proprietário'}
                                            </h4>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                                {os.modelo_maquina || 'Máquina não identificada'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate(`/os/editar/${os.id}`)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            leftIcon={<ChevronRight className="w-4 h-4" />}
                                        >
                                            Ver OS
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[var(--surface-light)] border-t border-[var(--border-subtle)] flex justify-end">
                    <Button variant="primary" onClick={onClose}>Fechar Detalhes</Button>
                </div>
            </div>
        </div>
    );
};
