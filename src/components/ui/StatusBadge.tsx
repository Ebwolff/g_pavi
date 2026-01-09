import React from 'react';
import { StatusOS, TipoOS, NivelUrgencia, StatusPendencia } from '../../types/database.types';
import { getCoresUrgencia } from '../../utils/osHelpers';

interface StatusBadgeProps {
    status: StatusOS | StatusPendencia;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const getStatusConfig = (status: StatusOS | StatusPendencia) => {
        const configs: Record<string, { label: string; color: string }> = {
            // Status OS
            EM_EXECUCAO: { label: 'Em Execução', color: 'bg-blue-100 text-blue-800 border-blue-300' },
            AGUARDANDO_PECAS: { label: 'Aguardando Peças', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
            PAUSADA: { label: 'Pausada', color: 'bg-gray-100 text-gray-800 border-gray-300' },
            CONCLUIDA: { label: 'Concluída', color: 'bg-green-100 text-green-800 border-green-300' },
            FATURADA: { label: 'Faturada', color: 'bg-purple-100 text-purple-800 border-purple-300' },
            CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800 border-red-300' },
            // Status Pendência
            PENDENTE: { label: 'Pendente', color: 'bg-orange-100 text-orange-800 border-orange-300' },
            EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800 border-blue-300' },
            RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800 border-green-300' },
            CANCELADO: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300' },
        };
        return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
    };

    const config = getStatusConfig(status);

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}
        >
            {config.label}
        </span>
    );
};

interface TipoBadgeProps {
    tipo: TipoOS;
    className?: string;
}

export const TipoBadge: React.FC<TipoBadgeProps> = ({ tipo, className = '' }) => {
    const config = {
        NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        GARANTIA: { label: 'Garantia', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    };

    const { label, color } = config[tipo];

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color} ${className}`}
        >
            {label}
        </span>
    );
};

interface UrgenciaBadgeProps {
    nivel: NivelUrgencia;
    diasEmAberto: number;
    className?: string;
}

export const UrgenciaBadge: React.FC<UrgenciaBadgeProps> = ({ nivel, diasEmAberto, className = '' }) => {
    const cores = getCoresUrgencia(nivel);

    const labels: Record<NivelUrgencia, string> = {
        NORMAL: 'Normal',
        MEDIO: 'Atenção',
        ALTO: 'Urgente',
        CRITICO: 'Crítico',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cores.bg} ${cores.text} ${cores.border} ${className}`}
            title={`${diasEmAberto} dias em aberto`}
        >
            <span className={`mr-1.5 h-2 w-2 rounded-full ${cores.badge}`} />
            {labels[nivel]} ({diasEmAberto}d)
        </span>
    );
};

interface CustomBadgeProps {
    label: string;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';
    icon?: React.ReactNode;
    className?: string;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
    label,
    color = 'gray',
    icon,
    className = ''
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 border-blue-300',
        green: 'bg-green-100 text-green-800 border-green-300',
        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        red: 'bg-red-100 text-red-800 border-red-300',
        purple: 'bg-purple-100 text-purple-800 border-purple-300',
        gray: 'bg-gray-100 text-gray-800 border-gray-300',
        orange: 'bg-orange-100 text-orange-800 border-orange-300',
    };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[color]} ${className}`}
        >
            {icon && <span className="mr-1.5">{icon}</span>}
            {label}
        </span>
    );
};
