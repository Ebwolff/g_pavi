import React from 'react';
import { CheckCircle2, Target } from 'lucide-react';

interface ChecklistProgressProps {
    completed: number;
    total: number;
    nextAction?: string;
    targetPercentage?: number;
    className?: string;
}

export const ChecklistProgress: React.FC<ChecklistProgressProps> = ({
    completed,
    total,
    nextAction,
    targetPercentage = 80,
    className = ''
}) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isAboveTarget = percentage >= targetPercentage;
    const progressColor = isAboveTarget ? 'bg-green-600' : 'bg-indigo-600';
    const textColor = isAboveTarget ? 'text-green-900' : 'text-indigo-900';
    const bgColor = isAboveTarget ? 'bg-green-50' : 'bg-indigo-50';
    const borderColor = isAboveTarget ? 'border-green-200' : 'border-indigo-200';

    return (
        <div className={`${bgColor} border ${borderColor} rounded-lg p-4 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className={isAboveTarget ? 'text-green-600' : 'text-indigo-600'} size={24} />
                    <h3 className={`${textColor} font-bold text-lg`}>
                        Progresso de Hoje
                    </h3>
                </div>
                <span className={`${textColor} text-2xl font-bold`}>
                    {completed}/{total}
                </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden shadow-inner">
                <div
                    className={`${progressColor} h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2`}
                    style={{ width: `${percentage}%` }}
                >
                    {percentage > 15 && (
                        <span className="text-white text-xs font-bold">
                            {percentage}%
                        </span>
                    )}
                </div>
            </div>

            {isAboveTarget && (
                <div className="flex items-center gap-2 text-green-700 text-sm mb-2">
                    <Target size={16} />
                    <span className="font-semibold">
                        Excelente! Você está {percentage - targetPercentage}% acima da meta!
                    </span>
                </div>
            )}

            {nextAction && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Próxima Ação:</p>
                    <p className={`${textColor} font-semibold`}>
                        {nextAction}
                    </p>
                </div>
            )}
        </div>
    );
};
