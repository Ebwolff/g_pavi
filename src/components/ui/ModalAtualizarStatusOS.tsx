import React, { useState, useEffect } from 'react';
import { StatusOS, TipoDiagnostico } from '../../types/database.types';

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

const STATUS_OPTIONS: { value: StatusOS; label: string; description: string }[] = [
    { value: 'EM_EXECUCAO', label: 'Em Execução', description: 'OS está sendo trabalhada ativamente' },
    { value: 'AGUARDANDO_APROVACAO_ORCAMENTO', label: 'Aguardando Orçamento', description: 'Aguardando aprovação do orçamento pelo cliente' },
    { value: 'AGUARDANDO_PECAS', label: 'Aguardando Peças', description: 'Aguardando chegada de peças' },
    { value: 'AGUARDANDO_PAGAMENTO', label: 'Aguardando Pagamento', description: 'Serviço concluído, aguardando pagamento' },
    { value: 'EM_DIAGNOSTICO', label: 'Em Diagnóstico', description: 'Analisando o problema' },
    { value: 'EM_TRANSITO', label: 'Em Trânsito', description: 'Técnico em deslocamento' },
    { value: 'PAUSADA', label: 'Pausada', description: 'Trabalho temporariamente interrompido' },
    { value: 'CONCLUIDA', label: 'Concluída', description: 'Serviço finalizado' },
    { value: 'FATURADA', label: 'Faturada', description: 'OS já foi faturada' },
    { value: 'CANCELADA', label: 'Cancelada', description: 'OS cancelada' },
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
    osId,
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
        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar status');
        } finally {
            setIsLoading(false);
        }
    };

    const renderCamposEspecificos = () => {
        switch (formData.novoStatus) {
            case 'AGUARDANDO_APROVACAO_ORCAMENTO':
                return (
                    <div className="space-y-4 mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <h4 className="font-medium text-amber-800">📋 Dados do Orçamento</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Orçamento *</label>
                                <input type="text" value={formData.numero_orcamento || ''} onChange={(e) => handleInputChange('numero_orcamento', e.target.value)} placeholder="Ex: ORC-2026-001" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Envio</label>
                                <input type="date" value={formData.data_envio_orcamento || getTodayDate()} onChange={(e) => handleInputChange('data_envio_orcamento', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                );
            case 'AGUARDANDO_PECAS':
                return (
                    <div className="space-y-4 mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800">📦 Dados do Pedido</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número do Pedido *</label>
                                <input type="text" value={formData.numero_pedido || ''} onChange={(e) => handleInputChange('numero_pedido', e.target.value)} placeholder="Ex: PED-2026-001" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Chegada</label>
                                <input type="date" value={formData.previsao_chegada_pecas || ''} onChange={(e) => handleInputChange('previsao_chegada_pecas', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                );
            case 'EM_DIAGNOSTICO':
                return (
                    <div className="space-y-4 mt-4 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
                        <h4 className="font-medium text-cyan-800">🔍 Dados do Diagnóstico</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Diagnóstico</label>
                                <select value={formData.tipo_diagnostico || ''} onChange={(e) => handleInputChange('tipo_diagnostico', e.target.value as TipoDiagnostico || undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                                    <option value="">Selecione...</option>
                                    {TIPO_DIAGNOSTICO_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 'EM_TRANSITO':
                return (
                    <div className="space-y-4 mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <h4 className="font-medium text-indigo-800">🚚 Dados do Deslocamento</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localização Atual</label>
                                <input type="text" value={formData.localizacao_atual || ''} onChange={(e) => handleInputChange('localizacao_atual', e.target.value)} placeholder="Ex: Fazenda São João" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Previsão de Retorno</label>
                                <input type="date" value={formData.previsao_retorno || ''} onChange={(e) => handleInputChange('previsao_retorno', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                    </div>
                );
            case 'PAUSADA':
                return (
                    <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-800">⏸️ Dados da Pausa</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Pausa *</label>
                            <textarea value={formData.motivo_pausa || ''} onChange={(e) => handleInputChange('motivo_pausa', e.target.value)} rows={3} placeholder="Descreva o motivo da pausa..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
                <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Atualizar Status da OS {numeroOS}</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className="px-6 py-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Novo Status</label>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_OPTIONS.map((option) => (
                                    <button key={option.value} type="button" onClick={() => handleStatusChange(option.value)}
                                        className={`flex flex-col items-start p-3 border rounded-lg text-left transition-all ${formData.novoStatus === option.value ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'} ${currentStatus === option.value ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        disabled={currentStatus === option.value}
                                    >
                                        <span className="font-medium text-sm">{option.label}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{option.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        {renderCamposEspecificos()}
                        {error && (<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>)}
                    </div>
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" disabled={isLoading}>Cancelar</button>
                        <button type="button" onClick={handleSubmit} disabled={isLoading || formData.novoStatus === currentStatus} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading ? 'Atualizando...' : 'Atualizar Status'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAtualizarStatusOS;
