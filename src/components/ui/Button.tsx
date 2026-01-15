import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    disabled,
    ...props
}: ButtonProps) {

    // Base styles
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0F14] disabled:opacity-50 disabled:cursor-not-allowed";

    // Size styles
    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    // Variant styles (using inline styles for dynamic CSS variable usage in parent if needed, but Tailwind classes for structure)
    // We'll use a data-variant attribute for simpler CSS management if needed, but here we define classes.

    return (
        <button
            className={`${baseStyles} ${sizeStyles[size]} ${className}`}
            disabled={isLoading || disabled}
            {...props}
            style={{
                // Primary Variant
                ...(variant === 'primary' && {
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
                }),
                // Secondary Variant
                ...(variant === 'secondary' && {
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)', // border-subtle
                    color: 'var(--text-primary)',
                }),
                // Ghost Variant
                ...(variant === 'ghost' && {
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                }),
                // Danger Variant
                ...(variant === 'danger' && {
                    background: 'var(--danger)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.4)',
                }),
                ...props.style // Allow overriding
            }}
            onMouseEnter={(e) => {
                if (disabled || isLoading) return;

                if (variant === 'primary') {
                    e.currentTarget.style.background = 'var(--primary-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                } else if (variant === 'ghost') {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                } else if (variant === 'danger') {
                    e.currentTarget.style.background = '#DC2626'; // Darker red
                }

                if (props.onMouseEnter) props.onMouseEnter(e);
            }}
            onMouseLeave={(e) => {
                if (disabled || isLoading) return;

                if (variant === 'primary') {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.4)';
                } else if (variant === 'secondary') {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'transparent';
                } else if (variant === 'ghost') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                } else if (variant === 'danger') {
                    e.currentTarget.style.background = 'var(--danger)';
                }

                if (props.onMouseLeave) props.onMouseLeave(e);
            }}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Carregando...</span>
                </>
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    );
}
