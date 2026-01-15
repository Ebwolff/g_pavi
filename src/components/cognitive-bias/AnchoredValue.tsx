import React from 'react';
import { DollarSign, Clock, TrendingUp } from 'lucide-react';

interface AnchoredValueProps {
    mainValue: number;
    currency?: boolean;
    deadline?: Date;
    comparison?: string;
    label?: string;
    className?: string;
}

export const AnchoredValue: React.FC<AnchoredValueProps> = ({
    mainValue,
    currency = true,
    deadline,
    comparison,
    label = 'Valor Total',
    className = ''
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getDaysRemaining = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const daysRemaining = deadline ? getDaysRemaining(deadline) : null;
    const isUrgent = daysRemaining !== null && daysRemaining <= 3;

    return (
        <div className={`border-l-4 ${isUrgent ? 'border-red-600 bg-red-50' : 'border-blue-600 bg-blue-50'} rounded-lg p-6 shadow-md ${className}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">{label}</p>
                    <div className="flex items-baseline gap-2">
                        {currency && <DollarSign className={`w-6 h-6 ${isUrgent ? 'text-red-700' : 'text-blue-700'}`} />}
                        <span className={`text-4xl font-bold ${isUrgent ? 'text-red-900' : 'text-blue-900'}`}>
                            {currency ? formatCurrency(mainValue) : mainValue.toLocaleString('pt-BR')}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {deadline && (
                    <div className={`flex items-center gap-2 ${isUrgent ? 'text-red-700' : 'text-blue-700'}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                            {daysRemaining !== null && daysRemaining > 0
                                ? `Faltam ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'} para o prazo`
                                : daysRemaining === 0
                                    ? 'Prazo é hoje!'
                                    : `Atrasado há ${Math.abs(daysRemaining!)} ${Math.abs(daysRemaining!) === 1 ? 'dia' : 'dias'}`
                            }
                        </span>
                    </div>
                )}

                {comparison && (
                    <div className="flex items-center gap-2 text-gray-700">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">{comparison}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
