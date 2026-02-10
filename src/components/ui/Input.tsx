import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, icon: Icon, error, id, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const hasValue = props.value !== '' && props.value !== undefined;

        // Generate a random ID if none provided and label needs it
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div
                        className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 pointer-events-none z-10",
                            isFocused ? "text-[#16a34a]" : "text-gray-400",
                            error && "text-red-400"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:outline-none transition-all duration-200",
                        "text-[var(--text-primary)] font-medium placeholder:text-[var(--text-muted)] disabled:opacity-50 disabled:cursor-not-allowed",
                        // Size & Padding
                        "py-3.5",
                        Icon ? "pl-12 pr-4" : "px-4",
                        // Border & Shadow States
                        isFocused
                            ? "border-blue-500 ring-2 ring-blue-500/10"
                            : "hover:border-[var(--border-hover)]",
                        // Error State
                        error && "border-rose-500 focus:ring-rose-500/10",
                        className
                    )}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    {...props}
                />

                {/* Floating Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className={cn(
                            "absolute left-4 transition-all duration-200 pointer-events-none px-1",
                            (isFocused || hasValue)
                                ? "-top-2.5 text-xs font-bold uppercase tracking-wider bg-[var(--bg-primary)] rounded-md py-0.5"
                                : "top-1/2 -translate-y-1/2 text-[var(--text-muted)]",
                            // Icon adjustment for label
                            Icon && !isFocused && !hasValue && "left-11", // Align with text when placeholder usually is
                            Icon && (isFocused || hasValue) && "left-4", // Return to left when floating

                            isFocused ? "text-blue-400" : "text-[var(--text-muted)]",
                            error && "text-rose-400"
                        )}
                    >
                        {label}
                    </label>
                )}

                {/* Error Message */}
                {error && (
                    <p className="mt-1 text-xs text-red-500 pl-1">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
