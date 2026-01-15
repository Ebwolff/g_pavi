import React from 'react';
import { AlertTriangle, Clock, DollarSign } from 'lucide-react';

interface AlertCardProps {
    type: 'critical' | 'warning' | 'info';
    title: string;
    message?: string;
    riskValue?: number;
    daysOverdue?: number;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
    type,
    title,
    message,
    riskValue,
    daysOverdue,
    actionLabel,
    onAction,
    className = ''
}) => {
    const styles = {
        critical: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-900',
            icon: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-500',
            text: 'text-yellow-900',
            icon: 'text-yellow-600',
            button: 'bg-yellow-600 hover:bg-yellow-700'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            text: 'text-blue-900',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700'
        }
    };

    const style = styles[type];

    return (
        <div className={`${style.bg} border-2 ${style.border} rounded-lg p-4 shadow-md ${className}`}>
            <div className="flex items-start gap-3">
                <AlertTriangle className={`${style.icon} flex-shrink-0 mt-1`} size={24} />

                <div className="flex-1">
                    <h3 className={`${style.text} font-bold text-lg mb-2`}>
                        {title}
                    </h3>

                    {message && (
                        <p className={`${style.text} opacity-90 text-sm mb-3`}>
                            {message}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 mb-3">
                        {riskValue !== undefined && riskValue > 0 && (
                            <div className="flex items-center gap-2">
                                <DollarSign className={style.icon} size={18} />
                                <div>
                                    <p className="text-xs opacity-75">Valor em Risco</p>
                                    <p className={`${style.text} font-bold`}>
                                        R$ {riskValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {daysOverdue !== undefined && daysOverdue > 0 && (
                            <div className="flex items-center gap-2">
                                <Clock className={style.icon} size={18} />
                                <div>
                                    <p className="text-xs opacity-75">Tempo em Atraso</p>
                                    <p className={`${style.text} font-bold`}>
                                        {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className={`${style.button} text-white px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                        >
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
