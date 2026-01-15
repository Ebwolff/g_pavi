import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
        isNeutral?: boolean;
    };
    color?: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'orange' | 'emerald';
    className?: string;
    onClick?: () => void;
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    className = '',
    onClick
}: StatsCardProps) {

    // Map colors to design system CSS variables
    const colorMap = {
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
        violet: {
            bg: 'rgba(139, 92, 246, 0.1)',
            text: '#A78BFA',
            glow: 'rgba(139, 92, 246, 0.4)',
            border: 'rgba(139, 92, 246, 0.2)'
        }
    };

    const theme = colorMap[color];

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
            style={{
                background: 'rgba(17, 24, 39, 0.6)', // glass-bg
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                boxShadow: 'var(--shadow-card)',
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
