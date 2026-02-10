import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
// import { cn } from '@/lib/utils'; // Unused

export interface CardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    subtitle?: string;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
        isNeutral?: boolean;
    };
    anchor?: {
        value: string | number;
        label: string;
    };
    color?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'orange' | 'emerald' | 'gray' | 'rose';
    className?: string;
    onClick?: () => void;
    priority?: number;
}

export function Card({
    title,
    value,
    icon: Icon,
    subtitle,
    trend,
    anchor,
    color = 'blue',
    className = '',
    onClick,
    priority = 0,
}: CardProps) {

    // Map colors to design system CSS variables
    const colorMap: Record<string, { bg: string; text: string; glow: string; border: string }> = {
        blue: {
            bg: 'rgba(59, 130, 246, 0.1)',
            text: '#60A5FA',
            glow: 'rgba(59, 130, 246, 0.4)',
            border: 'rgba(59, 130, 246, 0.2)'
        },
        green: {
            bg: 'rgba(34, 197, 94, 0.1)',
            text: '#4ADE80',
            glow: 'rgba(34, 197, 94, 0.4)',
            border: 'rgba(34, 197, 94, 0.2)'
        },
        emerald: {
            bg: 'rgba(16, 185, 129, 0.1)',
            text: '#34D399',
            glow: 'rgba(16, 185, 129, 0.4)',
            border: 'rgba(16, 185, 129, 0.2)'
        },
        amber: {
            bg: 'rgba(251, 191, 36, 0.1)',
            text: '#FBBF24',
            glow: 'rgba(251, 191, 36, 0.4)',
            border: 'rgba(251, 191, 36, 0.2)'
        },
        orange: {
            bg: 'rgba(249, 115, 22, 0.1)',
            text: '#FB923C',
            glow: 'rgba(249, 115, 22, 0.4)',
            border: 'rgba(249, 115, 22, 0.2)'
        },
        red: {
            bg: 'rgba(239, 68, 68, 0.1)',
            text: '#F87171',
            glow: 'rgba(239, 68, 68, 0.4)',
            border: 'rgba(239, 68, 68, 0.2)'
        },
        rose: {
            bg: 'rgba(244, 63, 94, 0.1)',
            text: '#FB7185',
            glow: 'rgba(244, 63, 94, 0.4)',
            border: 'rgba(244, 63, 94, 0.2)'
        },
        violet: {
            bg: 'rgba(139, 92, 246, 0.1)',
            text: '#A78BFA',
            glow: 'rgba(139, 92, 246, 0.4)',
            border: 'rgba(139, 92, 246, 0.2)'
        },
        gray: {
            bg: 'rgba(156, 163, 175, 0.1)',
            text: '#9CA3AF',
            glow: 'rgba(156, 163, 175, 0.4)',
            border: 'rgba(156, 163, 175, 0.2)'
        }
    };

    const theme = colorMap[color] || colorMap.blue;

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            style={{
                background: 'rgba(17, 24, 39, 0.6)', // glass-bg
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'var(--shadow-card)',
                animationDelay: `${priority * 0.1}s`
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 20px 40px -5px rgba(0,0,0,0.4), 0 0 15px ${theme.glow}`;
                e.currentTarget.style.borderColor = theme.border;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
            }}
        >
            {/* Top Color Line */}
            <div
                className="absolute top-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `linear-gradient(90deg, transparent, ${theme.text}, transparent)`
                }}
            />

            <div className="p-6 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    {/* Icon Container */}
                    <div
                        className="p-3 rounded-xl transition-all duration-300"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <Icon
                            className="w-6 h-6 transition-colors duration-300"
                            style={{ color: theme.text }}
                        />
                    </div>

                    {/* Trend Badge */}
                    {trend && (
                        <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md"
                            style={{
                                background: trend.isNeutral
                                    ? 'rgba(156, 163, 175, 0.1)'
                                    : (trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'),
                                color: trend.isNeutral
                                    ? '#9CA3AF'
                                    : (trend.isPositive ? '#4ADE80' : '#F87171'),
                                border: `1px solid ${trend.isNeutral
                                    ? 'rgba(156, 163, 175, 0.2)'
                                    : (trend.isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)')}`
                            }}
                        >
                            {trend.isNeutral ? (
                                <Minus className="w-3 h-3" />
                            ) : trend.isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1 tracking-wide">
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-white">
                            {value}
                        </span>
                        {trend && (
                            <span className="text-xs text-gray-500">
                                {trend.label}
                            </span>
                        )}
                    </div>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}

                    {/* Ancoragem */}
                    {anchor && (
                        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs">
                            <span className="text-gray-500">{anchor.label}</span>
                            <span className="font-medium text-gray-400">{anchor.value}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Background Glow Effect */}
            <div
                className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ background: theme.text }}
            />
        </div>
    );
}

export interface MiniCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
}

export function MiniCard({ label, value, icon: Icon, color = 'blue' }: MiniCardProps) {
    const colorClasses = {
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-400',
        green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-400',
        red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400',
        yellow: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
        purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-400',
        orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-400',
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-4 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</h3>
                {Icon && <Icon className="w-4 h-4" />}
            </div>
            <p className="text-2xl font-black">{value}</p>
        </div>
    );
}

export interface ProgressCardProps {
    title: string;
    current: number;
    target: number;
    unit?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow';
}

export function ProgressCard({
    title,
    current,
    target,
    unit = '',
    color = 'blue',
}: ProgressCardProps) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    const bgColors = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
    };

    return (
        <div className="glass-card-enterprise p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-400">{title}</h3>
                <span className="text-xs text-gray-500 font-mono">{percentage.toFixed(0)}%</span>
            </div>

            <div className="flex items-end gap-2 mb-3">
                <span className="text-2xl font-bold text-white">
                    {current}
                    {unit}
                </span>
                <span className="text-sm text-gray-600 mb-1">
                    / {target}
                    {unit}
                </span>
            </div>

            <div className="w-full bg-white/[0.05] rounded-full h-2 overflow-hidden">
                <div
                    className={`${bgColors[color]} h-2 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
