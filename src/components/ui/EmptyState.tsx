import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon: Icon = PackageOpen,
    action,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn ${className}`}>
            <div className="p-4 rounded-2xl bg-[var(--surface-light)] border border-[var(--border-subtle)] mb-4">
                <Icon className="w-12 h-12 text-[var(--text-muted)] opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-[var(--text-muted)] max-w-xs mx-auto mb-6">
                    {description}
                </p>
            )}
            {action && (
                <Button
                    variant="primary"
                    onClick={action.onClick}
                    leftIcon={action.icon && <action.icon className="w-4 h-4" />}
                >
                    {action.label}
                </Button>
            )}
        </div>
    );
};
