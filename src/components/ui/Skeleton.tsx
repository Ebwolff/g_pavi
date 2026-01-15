import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rect',
    width,
    height
}) => {
    const baseClass = "animate-pulse bg-[var(--surface-elevated)] opacity-40";

    const variantClasses = {
        text: "h-3 w-full rounded",
        rect: "rounded-lg",
        circle: "rounded-full"
    };

    const style: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div
            className={`${baseClass} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 1, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} variant="text" width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
        ))}
    </div>
);
