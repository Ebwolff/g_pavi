import React, { useState, useEffect } from 'react';
import { StatusOS, TipoDiagnostico } from '../../types/database.types';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import {
    X,
    ClipboardList,
    Calendar,
    Hash,
    Settings,
    Activity,
    Truck,
    Search,
    PauseCircle,
    CheckCircle2,
    type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusUpdateData {
    novoStatus: StatusOS;
    numero_orcamento?: string;
    data_envio_orcamento?: string;
    numero_pedido?: string;
    data_pedido?: string;
    previsao_chegada_pecas?: string;
    data_conclusao_servico?: string;
    valor_servico?: number;
    data_inicio_diagnostico?: string;
    tipo_diagnostico?: TipoDiagnostico;
    observacoes_diagnostico?: string;
    data_saida?: string;
    previsao_retorno?: string;
    localizacao_atual?: string;
    roteiro?: string;
    motivo_pausa?: string;
    data_pausa?: string;
}

interface ModalAtualizarStatusOSProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: StatusUpdateData) => Promise<void>;
    currentStatus: StatusOS;
    osId: string;
    numeroOS: string;
}

const STATUS_OPTIONS: { value: StatusOS; label: string; description: string; icon: LucideIcon; color: string }[] = [
    { value: 'EM_EXECUCAO', label: 'Em Execução', description: 'OS está sendo trabalhada ativamente', icon: Activity, color: 'blue' },
    { value: 'AGUARDANDO_APROVACAO_ORCAMENTO', label: 'Aguardando Orçamento', description: 'Aguardando aprovação do orçamento pelo cliente', icon: ClipboardList, color: 'amber' },
    { value: 'AGUARDANDO_PECAS', label: 'Aguardando Peças', description: 'Aguardando chegada de peças', icon: Settings, color: 'yellow' },
    { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento', description: 'Serviço concluído, aguardando pagamento', icon: CheckCircle2, color: 'emerald' },
    { value: 'EM_DIAGNOSTICO', label: 'Em Diagnóstico', description: 'Analisando o problema', icon: Search, color: 'cyan' },
    { value: 'EM_TRANSITO', label: 'Em Trânsito', description: 'Técnico em deslocamento', icon: Truck, color: 'indigo' },
    { value: 'PAUSADA', label: 'Pausada', description: 'Trabalho temporariamente interrompido', icon: PauseCircle, color: 'slate' },
    { value: 'CONCLUIDA', label: 'Concluída', description: 'Serviço finalizado', icon: CheckCircle2, color: 'emerald' },
    { value: 'FATURADA', label: 'Faturada', description: 'OS já foi faturada', icon: Hash, color: 'blue' },
    { value: 'CANCELADA', label: 'Cancelada', description: 'OS cancelada', icon: X, color: 'rose' },
];

const TIPO_DIAGNOSTICO_OPTIONS: { value: TipoDiagnostico; label: string }[] = [
    { value: 'SIMPLES', label: 'Simples' },
    { value: 'COMPLEXO', label: 'Complexo' },
    { value: 'ESPECIALIZADO', label: 'Especializado' },
];

export const ModalAtualizarStatusOS: React.FC<ModalAtualizarStatusOSProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentStatus,
    osId: _osId,
    numeroOS,
}) => {
    const [formData, setFormData] = useState<StatusUpdateData>({
        novoStatus: currentStatus,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({ novoStatus: currentStatus });
            setError(null);
        }
    }, [isOpen, currentStatus]);

    const handleStatusChange = (status: StatusOS) => {
        setFormData({ novoStatus: status });
    };

    const handleInputChange = (field: keyof StatusUpdateData, value: string | number | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getTodayDate = () => new Date().toISOString().split('T')[0];

    const handleSubmit = async () => {
        setError(null);
        setIsLoading(true);
        try {
            if (formData.novoStatus === 'AGUARDANDO_APROVACAO_ORCAMENTO' && !formData.numero_orcamento) {
                throw new Error('Número do orçamento é obrigatório');
            }
            if (formData.novoStatus === 'AGUARDANDO_PECAS' && !formData.numero_pedido) {
                throw new Error('Número do pedido é obrigatório');
            }
            if (formData.novoStatus === 'PAUSADA' && !formData.motivo_pausa) {
                throw new Error('Motivo da pausa é obrigatório');
            }
            await onConfirm(formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCamposEspecificos = () => {
        const inputBg = 'bg-[var(--surface-light)]';

        switch (formData.novoStatus) {
            case 'AGUARDANDO_APROVACAO_ORCAMENTO':
                return (
                    <div className="space-y-6 mt-6 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Dados do Orçamento
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Número do Orçamento"
                                icon={Hash}
                                value={formData.numero_orcamento || ''}
                                onChange={(e) => handleInputChange('numero_orcamento', e.target.value)}
                                placeholder="Ex: ORC-2026-001"
                                className={cn(inputBg, "border-amber-500/20")}
                            />
                            <Input
                                label="Data de Envio"
                                type="date"
                                icon={Calendar}
                                value={formData.data_envio_orcamento || getTodayDate()}
                                onChange={(e) => handleInputChange('data_envio_orcamento', e.target.value)}
                                className={cn(inputBg, "border-amber-500/20")}
                            />
                        </div>
                    </div>
                );
            case 'AGUARDANDO_PECAS':
                return (
                    <div className="space-y-6 mt-6 p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
                        <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Dados do Pedido
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Número do Pedido"
                                icon={Hash}
                                value={formData.numero_pedido || ''}
                                onChange={(e) => handleInputChange('numero_pedido', e.target.value)}
                                placeholder="Ex: PED-2026-001"
                                className={cn(inputBg, "border-yellow-500/20")}
                            />
                            <Input
                                label="Previsão de Chegada"
                                type="date"
                                icon={Calendar}
                                value={formData.previsao_chegada_pecas || ''}
                                onChange={(e) => handleInputChange('previsao_chegada_pecas', e.target.value)}
                                className={cn(inputBg, "border-yellow-500/20")}
                            />
                        </div>
                    </div>
                );
            case 'EM_DIAGNOSTICO':
                return (
                    <div className="space-y-6 mt-6 p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
                        <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Dados do Diagnóstico
                        </h4>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider ml-1">Tipo de Diagnóstico</label>
                            <div className="relative group">
                                <select
                                    value={formData.tipo_diagnostico || ''}
                                    onChange={(e) => handleInputChange('tipo_diagnostico', e.target.value as TipoDiagnostico || undefined)}
                                    className="w-full bg-[var(--surface-light)] border border-cyan-500/20 rounded-2xl px-5 py-4 text-[var(--text-primary)] font-bold focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="">Selecione...</option>
                                    {TIPO_DIAGNOSTICO_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500">
                                    <Activity className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'EM_TRANSITO':
                return (
                    <div className="space-y-6 mt-6 p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Dados do Deslocamento
                        </h4>
                        <div className="space-y-6">
                            <Input
                                label="Localização Atual"
                                icon={Truck}
                                value={formData.localizacao_atual || ''}
                                onChange={(e) => handleInputChange('localizacao_atual', e.target.value)}
                                placeholder="Ex: Fazenda São João"
                                className={cn(inputBg, "border-indigo-500/20")}
                            />
                            <Input
                                label="Previsão de Retorno"
                                type="date"
                                icon={Calendar}
                                value={formData.previsao_retorno || ''}
                                onChange={(e) => handleInputChange('previsao_retorno', e.target.value)}
                                className={cn(inputBg, "border-indigo-500/20")}
                            />
                        </div>
                    </div>
                );
            case 'PAUSADA':
                return (
                    <div className="space-y-6 mt-6 p-6 rounded-2xl border border-slate-500/20 bg-slate-500/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <PauseCircle className="w-4 h-4" />
                            Dados da Pausa
                        </h4>
                        <Textarea
                            label="Motivo da Pausa"
                            icon={PauseCircle}
                            value={formData.motivo_pausa || ''}
                            onChange={(e) => handleInputChange('motivo_pausa', e.target.value)}
                            placeholder="Descreva o motivo da pausa..."
                            className={cn(inputBg, "border-slate-500/20")}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-[var(--surface)] text-[var(--text-primary)] rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-[var(--border-subtle)] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 border-b border-[var(--border-subtle)] bg-[var(--surface-light)]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Fluxo de Atendimento</h3>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight">Status da OS #{numeroOS}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-[var(--surface-hover)] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all hover:scale-110 active:scale-95"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                    {/* Status Selection */}
                    <div>
                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4 block ml-1">Selecione o Novo Estágio</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {STATUS_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = formData.novoStatus === option.value;
                                const isCurrent = currentStatus === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleStatusChange(option.value)}
                                        disabled={isCurrent}
                                        className={cn(
                                            "flex flex-col items-start p-4 border rounded-3xl text-left transition-all duration-300 group",
                                            isSelected
                                                ? "bg-blue-500/10 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]"
                                                : "bg-[var(--surface-light)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] hover:border-[var(--text-muted)]",
                                            isCurrent && "opacity-40 cursor-not-allowed filter grayscale"
                                        )}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={cn(
                                                "p-2 rounded-xl transition-colors",
                                                isSelected ? "bg-blue-500 text-white" : "bg-[var(--surface-hover)] text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={cn(
                                                "font-black text-sm uppercase tracking-tighter",
                                                isSelected ? "text-white" : "text-[var(--text-secondary)]"
                                            )}>
                                                {option.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed">
                                            {option.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {renderCamposEspecificos()}

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                            <div className="p-1.5 bg-rose-500 rounded-lg text-white">
                                <X className="w-4 h-4" />
                            </div>
                            <p className="text-sm font-bold text-rose-500">{error}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-8 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[var(--surface-light)]/30">
                    <div className="hidden sm:block">
                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Confirmação de Registro</p>
                        <p className="text-[11px] font-medium text-[var(--text-muted)]">Histórico será atualizado automaticamente</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                            className="bg-transparent border-[var(--border-subtle)]"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            disabled={formData.novoStatus === currentStatus}
                            className="px-10 shadow-xl shadow-blue-500/20"
                        >
                            Confirmar Mudança
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAtualizarStatusOS;
