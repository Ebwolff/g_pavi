import React from 'react';
import { Trophy, Star, Target, Zap, Award } from 'lucide-react';

interface BadgeProps {
    type: 'gold' | 'silver' | 'bronze' | 'platinum';
    title: string;
    description: string;
    icon?: 'trophy' | 'star' | 'target' | 'zap' | 'award';
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    type,
    title,
    description,
    icon = 'trophy',
    className = ''
}) => {
    const styles = {
        platinum: {
            bg: 'bg-gradient-to-br from-purple-500 to-purple-700',
            border: 'border-purple-400',
            glow: 'shadow-lg shadow-purple-500/50'
        },
        gold: {
            bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
            border: 'border-yellow-300',
            glow: 'shadow-lg shadow-yellow-500/50'
        },
        silver: {
            bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
            border: 'border-gray-200',
            glow: 'shadow-lg shadow-gray-400/50'
        },
        bronze: {
            bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
            border: 'border-orange-300',
            glow: 'shadow-lg shadow-orange-500/50'
        }
    };

    const icons = {
        trophy: Trophy,
        star: Star,
        target: Target,
        zap: Zap,
        award: Award
    };

    const Icon = icons[icon];
    const style = styles[type];

    return (
        <div className={`${style.bg} ${style.glow} border-2 ${style.border} rounded-xl p-4 text-white ${className}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{title}</h3>
                    <p className="text-sm opacity-90">{description}</p>
                </div>
            </div>
        </div>
    );
};
