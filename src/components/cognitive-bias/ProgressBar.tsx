import React from 'react';

interface ProgressBarProps {
    currentStep: number;
    totalSteps: number;
    estimatedTimeRemaining?: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    currentStep,
    totalSteps,
    estimatedTimeRemaining,
    className = ''
}) => {
    const percentage = Math.round((currentStep / totalSteps) * 100);

    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span className="font-medium">
                    Passo {currentStep} de {totalSteps}
                </span>
                <span className="text-indigo-600 font-semibold">
                    {percentage}% completo
                </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tempo estimado restante: {estimatedTimeRemaining} min
                </p>
            )}
        </div>
    );
};
