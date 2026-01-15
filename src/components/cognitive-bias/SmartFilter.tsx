import React from 'react';
import { Filter } from 'lucide-react';

interface SmartFilterProps {
    urgentCount: number;
    pendingCount: number;
    allCount: number;
    onFilterChange: (filter: 'urgent' | 'pending' | 'all') => void;
    activeFilter?: 'urgent' | 'pending' | 'all';
    className?: string;
}

export const SmartFilter: React.FC<SmartFilterProps> = ({
    urgentCount,
    pendingCount,
    allCount,
    onFilterChange,
    activeFilter = 'urgent',
    className = ''
}) => {
    const filters = [
        {
            id: 'urgent' as const,
            label: 'Urgentes',
            count: urgentCount,
            color: 'red',
            description: 'Requerem atenção imediata'
        },
        {
            id: 'pending' as const,
            label: 'Aguardando Você',
            count: pendingCount,
            color: 'yellow',
            description: 'Pendentes de sua ação'
        },
        {
            id: 'all' as const,
            label: 'Ver Todas',
            count: allCount,
            color: 'gray',
            description: 'Todos os itens'
        }
    ];

    const getButtonStyles = (filterId: string, color: string) => {
        const isActive = activeFilter === filterId;

        const colorStyles = {
            red: isActive
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
            yellow: isActive
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
            gray: isActive
                ? 'bg-gray-600 text-white border-gray-600'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
        };

        return colorStyles[color as keyof typeof colorStyles];
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border p-4 ${className}`}>
            <div className="flex items-center gap-2 mb-3">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filtros Inteligentes</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`
                            flex flex-col items-start p-4 rounded-lg border-2 transition-all
                            ${getButtonStyles(filter.id, filter.color)}
                        `}
                    >
                        <div className="flex items-center justify-between w-full mb-2">
                            <span className="font-semibold">{filter.label}</span>
                            <span className="text-2xl font-bold">{filter.count}</span>
                        </div>
                        <p className="text-xs opacity-75">{filter.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};
