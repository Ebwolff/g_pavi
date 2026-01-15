import React from 'react';
import { StatusOS, TipoOS, NivelUrgencia, StatusPendencia } from '../../types/database.types';

interface StatusBadgeProps {
    status: StatusOS | StatusPendencia;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
    const getStatusConfig = (status: StatusOS | StatusPendencia) => {
        const configs: Record<string, { label: string; style: React.CSSProperties; className: string }> = {
            // Status OS
            EM_EXECUCAO: {
                label: 'Em Execução',
                style: { background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' },
                className: 'badge-enterprise'
            },
            AGUARDANDO_PECAS: {
                label: 'Aguardando Peças',
                style: { background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                className: 'badge-enterprise'
            },
            PAUSADA: {
                label: 'Pausada',
                style: { background: 'var(--surface-light)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' },
                className: 'badge-enterprise'
            },
            CONCLUIDA: {
                label: 'Concluída',
                style: { background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' },
                className: 'badge-enterprise'
            },
            FATURADA: {
                label: 'Faturada',
                style: { background: 'var(--accent-violet-glow)', color: 'var(--accent-violet)', borderColor: 'rgba(139, 92, 246, 0.3)' },
                className: 'badge-enterprise'
            },
            CANCELADA: {
                label: 'Cancelada',
                style: { background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', borderColor: 'rgba(244, 114, 114, 0.3)' },
                className: 'badge-enterprise'
            },
            // Status Pendência
            PENDENTE: {
                label: 'Pendente',
                style: { background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' },
                className: 'badge-enterprise'
            },
            EM_ANDAMENTO: {
                label: 'Em Andamento',
                style: { background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' },
                className: 'badge-enterprise'
            },
            RESOLVIDO: {
                label: 'Resolvido',
                style: { background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' },
                className: 'badge-enterprise'
            },
            CANCELADO: {
                label: 'Cancelado',
                style: { background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', borderColor: 'rgba(244, 114, 114, 0.3)' },
                className: 'badge-enterprise'
            },
        };
        return configs[status] || {
            label: status,
            style: { background: 'var(--surface-light)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' },
            className: 'badge-enterprise'
        };
    };

    const config = getStatusConfig(status);

    return (
        <span
            className={`${config.className} ${className} border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider`}
            style={config.style}
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
        NORMAL: {
            label: 'Normal',
            style: { background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' }
        },
        GARANTIA: {
            label: 'Garantia',
            style: { background: 'var(--accent-violet-glow)', color: 'var(--accent-violet)', borderColor: 'rgba(139, 92, 246, 0.3)' }
        },
    };

    const { label, style } = config[tipo] || config.NORMAL;

    return (
        <span
            className={`badge-enterprise border px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${className}`}
            style={style}
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
    const getUrgenciaConfig = (nivel: NivelUrgencia) => {
        const configs: Record<NivelUrgencia, { label: string; color: string; bg: string; border: string }> = {
            NORMAL: { label: 'Normal', color: 'var(--text-muted)', bg: 'var(--surface-light)', border: 'var(--border-subtle)' },
            MEDIO: { label: 'Atenção', color: 'var(--accent-amber)', bg: 'var(--accent-amber-glow)', border: 'rgba(245, 158, 11, 0.3)' },
            ALTO: { label: 'Urgente', color: 'var(--accent-rose)', bg: 'var(--accent-rose-glow)', border: 'rgba(244, 114, 114, 0.3)' },
            CRITICO: { label: 'Crítico', color: '#fff', bg: 'var(--danger)', border: 'var(--danger-glow)' },
        };
        return configs[nivel] || configs.NORMAL;
    };

    const config = getUrgenciaConfig(nivel);

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${className}`}
            style={{
                backgroundColor: config.bg,
                color: config.color,
                borderColor: config.border,
                animation: nivel === 'CRITICO' ? 'pulse-soft 2s infinite' : 'none'
            }}
            title={`${diasEmAberto} dias em aberto`}
        >
            {config.label} ({diasEmAberto}d)
        </span>
    );
};

interface CustomBadgeProps {
    label: string;
    variant?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'orange';
    icon?: React.ReactNode;
    className?: string;
}

export const CustomBadge: React.FC<CustomBadgeProps> = ({
    label,
    variant = 'gray',
    icon,
    className = ''
}) => {
    const variants: Record<string, React.CSSProperties> = {
        blue: { background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', borderColor: 'rgba(59, 130, 246, 0.3)' },
        green: { background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' },
        yellow: { background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' },
        red: { background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', borderColor: 'rgba(244, 114, 114, 0.3)' },
        purple: { background: 'var(--accent-violet-glow)', color: 'var(--accent-violet)', borderColor: 'rgba(139, 92, 246, 0.3)' },
        gray: { background: 'var(--surface-light)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' },
        orange: { background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)', borderColor: 'rgba(245, 158, 11, 0.3)' },
    };

    return (
        <span
            className={`badge-enterprise border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}
            style={variants[variant]}
        >
            {icon && <span className="mr-1.5">{icon}</span>}
            {label}
        </span>
    );
};
