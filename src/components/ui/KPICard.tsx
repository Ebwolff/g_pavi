import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    };
    // Ancoragem: mostrar referência comparativa
    anchor?: {
        value: string | number;
        label: string; // ex: "mês anterior", "meta"
    };
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
    onClick?: () => void;
    // UX Enhancement: priority determines animation delay
    priority?: number;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    anchor,
    color = 'blue',
    onClick,
    priority = 0,
}) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        red: 'bg-red-50 text-red-600',
        yellow: 'bg-yellow-50 text-yellow-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        gray: 'bg-gray-50 text-gray-600',
    };

    const borderClasses = {
        blue: 'border-blue-200 hover:border-blue-300',
        green: 'border-green-200 hover:border-green-300',
        red: 'border-red-200 hover:border-red-300',
        yellow: 'border-yellow-200 hover:border-yellow-300',
        purple: 'border-purple-200 hover:border-purple-300',
        orange: 'border-orange-200 hover:border-orange-300',
        gray: 'border-gray-200 hover:border-gray-300',
    };

    // Determinar ícone de tendência
    const TrendIcon = trend ? (trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus) : null;

    return (
        <div
            className={`kpi-card ${borderClasses[color]} ${onClick ? 'kpi-card-clickable' : ''}`}
            onClick={onClick}
            style={{ animationDelay: `${priority * 0.1}s` }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[color]} transition-transform group-hover:scale-110`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>

            {/* Ancoragem + Trend em linha */}
            <div className="flex items-center justify-between text-sm">
                {/* Ancoragem: referência comparativa (Viés de Ancoragem) */}
                {anchor && (
                    <span className="text-gray-400 text-xs">
                        {anchor.label}: <span className="font-medium text-gray-500">{anchor.value}</span>
                    </span>
                )}

                {/* Trend indicator */}
                {trend && (
                    <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${trend.value > 0
                                ? 'bg-green-50 text-green-600'
                                : trend.value < 0
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-gray-50 text-gray-500'
                            }`}
                    >
                        {TrendIcon && <TrendIcon className="w-3 h-3" />}
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>
        </div>
    );
};

interface MiniKPICardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
}

export const MiniKPICard: React.FC<MiniKPICardProps> = ({ label, value, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'from-blue-50 to-blue-100/50 border-blue-200 text-blue-700',
        green: 'from-green-50 to-green-100/50 border-green-200 text-green-700',
        red: 'from-red-50 to-red-100/50 border-red-200 text-red-700',
        yellow: 'from-yellow-50 to-yellow-100/50 border-yellow-200 text-yellow-700',
        purple: 'from-purple-50 to-purple-100/50 border-purple-200 text-purple-700',
        orange: 'from-orange-50 to-orange-100/50 border-orange-200 text-orange-700',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg border p-4`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{label}</h3>
                {Icon && <Icon className="w-5 h-5" />}
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
};

interface ProgressKPICardProps {
    title: string;
    current: number;
    target: number;
    unit?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow';
}

export const ProgressKPICard: React.FC<ProgressKPICardProps> = ({
    title,
    current,
    target,
    unit = '',
    color = 'blue',
}) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
    };

    const bgColorClasses = {
        blue: 'bg-blue-100',
        green: 'bg-green-100',
        red: 'bg-red-100',
        yellow: 'bg-yellow-100',
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{title}</h3>
                <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
            </div>

            <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl font-bold text-gray-900">
                    {current}
                    {unit}
                </span>
                <span className="text-sm text-gray-500 mb-1">
                    / {target}
                    {unit}
                </span>
            </div>

            <div className={`w-full ${bgColorClasses[color]} rounded-full h-2`}>
                <div
                    className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
