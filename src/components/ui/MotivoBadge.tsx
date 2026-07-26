import React from 'react';
import { StatusOS, TipoDiagnostico } from '../../types/database.types';

interface MotivoBadgeProps {
    status: StatusOS;
    diasNoStatus?: number | null;
    numeroOrcamento?: string | null;
    numeroPedido?: string | null;
    tipoDiagnostico?: TipoDiagnostico | null;
    localizacaoAtual?: string | null;
    roteiro?: string | null;
    motivoPausa?: string | null;
    previsaoChegadaPecas?: string | null;
    previsaoRetorno?: string | null;
    className?: string;
    showDays?: boolean;
    compact?: boolean;
}

export const MotivoBadge: React.FC<MotivoBadgeProps> = ({
    status,
    diasNoStatus,
    numeroOrcamento,
    numeroPedido,
    tipoDiagnostico,
    localizacaoAtual,
    roteiro,
    motivoPausa,
    previsaoChegadaPecas,
    previsaoRetorno,
    className = '',
    showDays = true,
    compact = false
}) => {
    const getStatusConfig = (): {
        label: string;
        detail: string | null;
        subDetail?: string | null;
        color: string;
        iconColor: string;
        icon: string;
    } => {
        switch (status) {
            case 'AGUARDANDO_APROVACAO_ORCAMENTO':
                return {
                    label: 'Aguardando Orçamento',
                    detail: numeroOrcamento ? `#${numeroOrcamento}` : null,
                    color: 'bg-amber-50 text-amber-800 border-amber-300',
                    iconColor: 'bg-amber-500',
                    icon: '📋'
                };
            case 'AGUARDANDO_PECAS':
                return {
                    label: 'Aguardando Peças',
                    detail: numeroPedido ? `Pedido #${numeroPedido}` : null,
                    subDetail: previsaoChegadaPecas ? `Prev: ${formatDate(previsaoChegadaPecas)}` : null,
                    color: 'bg-yellow-50 text-yellow-800 border-yellow-300',
                    iconColor: 'bg-yellow-500',
                    icon: '📦'
                };
            case 'AGUARDANDO_PAGAMENTO':
                return {
                    label: 'Aguardando Pagamento',
                    detail: null,
                    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    iconColor: 'bg-emerald-500',
                    icon: '💰'
                };
            case 'EM_DIAGNOSTICO':
                return {
                    label: 'Em Diagnóstico',
                    detail: tipoDiagnostico ? getDiagnosticoLabel(tipoDiagnostico) : null,
                    color: 'bg-cyan-50 text-cyan-800 border-cyan-300',
                    iconColor: 'bg-cyan-500',
                    icon: '🔍'
                };
            case 'EM_TRANSITO':
                return {
                    label: 'Em Trânsito',
                    detail: localizacaoAtual || null,
                    subDetail: previsaoRetorno ? `Retorno: ${formatDate(previsaoRetorno)}` : null,
                    color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
                    iconColor: 'bg-indigo-500',
                    icon: '🚚'
                };
            case 'EM_EXECUCAO':
                return {
                    label: 'Em Execução',
                    detail: null,
                    color: 'bg-blue-50 text-blue-800 border-blue-300',
                    iconColor: 'bg-blue-500',
                    icon: '⚙️'
                };
            case 'PAUSADA':
                return {
                    label: 'Pausada',
                    detail: motivoPausa ? truncateText(motivoPausa, 30) : null,
                    color: 'bg-gray-50 text-gray-800 border-gray-300',
                    iconColor: 'bg-gray-500',
                    icon: '⏸️'
                };
            case 'CONCLUIDA':
                return {
                    label: 'Concluída',
                    detail: null,
                    color: 'bg-green-50 text-green-800 border-green-300',
                    iconColor: 'bg-green-500',
                    icon: '✅'
                };
            case 'FATURADA':
                return {
                    label: 'Faturada',
                    detail: null,
                    color: 'bg-purple-50 text-purple-800 border-purple-300',
                    iconColor: 'bg-purple-500',
                    icon: '💵'
                };
            case 'CANCELADA':
                return {
                    label: 'Cancelada',
                    detail: null,
                    color: 'bg-red-50 text-red-800 border-red-300',
                    iconColor: 'bg-red-500',
                    icon: '❌'
                };
            default:
                return {
                    label: status,
                    detail: null,
                    color: 'bg-gray-50 text-gray-800 border-gray-300',
                    iconColor: 'bg-gray-500',
                    icon: '📄'
                };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    };

    const getDiagnosticoLabel = (tipo: TipoDiagnostico) => {
        const labels: Record<TipoDiagnostico, string> = {
            'SIMPLES': 'Simples',
            'COMPLEXO': 'Complexo',
            'ESPECIALIZADO': 'Especializado'
        };
        return labels[tipo] || tipo;
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const config = getStatusConfig();

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}
                title={config.detail ? `${config.label}: ${config.detail}` : config.label}
            >
                <span>{config.icon}</span>
                <span>{config.label}</span>
                {showDays && diasNoStatus !== null && diasNoStatus !== undefined && (
                    <span className="text-xs opacity-75">({diasNoStatus}d)</span>
                )}
            </span>
        );
    }

    return (
        <div className={`inline-flex flex-col p-2 rounded-lg border ${config.color} ${className}`}>
            <div className="flex items-center gap-2">
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-white text-sm ${config.iconColor}`}>
                    {config.icon}
                </span>
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{config.label}</span>
                    {config.detail && (
                        <span className="text-xs opacity-80">{config.detail}</span>
                    )}
                </div>
                {showDays && diasNoStatus !== null && diasNoStatus !== undefined && (
                    <span className="ml-auto bg-white px-2 py-0.5 rounded text-xs font-bold">
                        {diasNoStatus} dias
                    </span>
                )}
            </div>
            {config.subDetail && (
                <span className="text-xs mt-1 opacity-70">
                    {config.subDetail}
                </span>
            )}
            {roteiro && status === 'EM_TRANSITO' && (
                <span className="text-xs mt-1 opacity-70 italic">
                    Roteiro: {truncateText(roteiro, 50)}
                </span>
            )}
        </div>
    );
};

export default MotivoBadge;
