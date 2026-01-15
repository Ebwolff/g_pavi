import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
    date: string;
    value: number;
}

interface TrendChartProps {
    data: DataPoint[];
    period: 7 | 30 | 90;
    highlightRecent?: boolean;
    label?: string;
    className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
    data,
    period,
    highlightRecent = true,
    label = 'Tendência',
    className = ''
}) => {
    if (data.length === 0) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
                <p className="text-gray-500 text-center">Sem dados disponíveis</p>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Calcular tendência
    const firstValue = data[0]?.value || 0;
    const lastValue = data[data.length - 1]?.value || 0;
    const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'stable';
    const trendPercentage = firstValue > 0 ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0;

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

    return (
        <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                <div className={`flex items-center gap-2 ${trendColor}`}>
                    <TrendIcon className="w-5 h-5" />
                    <span className="font-semibold">
                        {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
                    </span>
                </div>
            </div>

            {/* Mini gráfico de linha */}
            <div className="relative h-32">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
                        strokeWidth="2"
                        points={data.map((point, index) => {
                            const x = (index / (data.length - 1)) * 100;
                            const y = 100 - ((point.value - minValue) / range) * 100;
                            return `${x},${y}`;
                        }).join(' ')}
                    />
                    {highlightRecent && data.length > 0 && (
                        <circle
                            cx={100}
                            cy={100 - ((lastValue - minValue) / range) * 100}
                            r="3"
                            fill={trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'}
                        />
                    )}
                </svg>
            </div>

            <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>Últimos {period} dias</span>
                <span className="font-semibold">{lastValue.toLocaleString('pt-BR')}</span>
            </div>
        </div>
    );
};
