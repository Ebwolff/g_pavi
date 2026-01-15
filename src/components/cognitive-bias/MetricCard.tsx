import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    value: number | string;
    label: string;
    comparison?: {
        value: number;
        period: string;
    };
    trend?: 'up' | 'down' | 'stable';
    format?: 'number' | 'currency' | 'percentage';
    className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    value,
    label,
    comparison,
    trend = 'stable',
    format = 'number',
    className = ''
}) => {
    const formatValue = (val: number | string) => {
        if (typeof val === 'string') return val;

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(val);
            case 'percentage':
                return `${val}%`;
            default:
                return val.toLocaleString('pt-BR');
        }
    };

    const trendStyles = {
        up: {
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20'
        },
        down: {
            icon: TrendingDown,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20'
        },
        stable: {
            icon: Minus,
            color: 'text-slate-400',
            bg: 'bg-slate-500/10',
            border: 'border-slate-500/20'
        }
    };

    const style = trendStyles[trend];
    const TrendIcon = style.icon;

    // Enquadramento positivo: sempre mostrar como ganho quando possível
    const isPositive = trend === 'up' || (trend === 'stable' && typeof value === 'number' && value > 0);

    return (
        <div className={`glass-card-enterprise p-6 rounded-2xl ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] mb-2">{label}</p>
                    <p className={`text-3xl font-black ${isPositive ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}>
                        {formatValue(value)}
                    </p>
                </div>
                {trend !== 'stable' && (
                    <div className={`p-2 ${style.bg} border ${style.border} rounded-xl shadow-lg`}>
                        <TrendIcon className={`w-6 h-6 ${style.color}`} />
                    </div>
                )}
            </div>

            {comparison && (
                <div className={`flex items-center gap-2 text-xs ${style.color} bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5`}>
                    <div className={`p-1 rounded-md ${style.bg}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-black tracking-tight">
                        {comparison.value > 0 ? '+' : ''}{comparison.value}%
                    </span>
                    <span className="text-[var(--text-muted)] font-medium">vs. {comparison.period}</span>
                </div>
            )}
        </div>
    );
};
