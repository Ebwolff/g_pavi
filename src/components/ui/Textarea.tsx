import { TextareaHTMLAttributes, forwardRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    icon?: LucideIcon;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, label, icon: Icon, error, id, ...props }, ref) => {
        const [isFocused, setIsFocused] = useState(false);
        const hasValue = props.value !== '' && props.value !== undefined;

        // Generate a random ID if none provided and label needs it
        const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

        return (
            <div className="relative">
                {/* Icon */}
                {Icon && (
                    <div
                        className={cn(
                            "absolute left-4 top-4 transition-colors duration-200 pointer-events-none z-10",
                            isFocused ? "text-blue-400" : "text-gray-400",
                            error && "text-red-400"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                )}

                <textarea
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "w-full bg-[var(--surface-light)] border border-[var(--border-subtle)] rounded-xl focus:outline-none transition-all duration-200",
                        "text-[var(--text-primary)] font-medium disabled:opacity-50 disabled:cursor-not-allowed",
                        "min-h-[100px] py-4",
                        // Control placeholder visibility
                        (isFocused || hasValue) ? "placeholder:text-[var(--text-muted)]" : "placeholder:text-transparent",
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
                            "absolute left-4 transition-all duration-200 pointer-events-none px-1.5",
                            (isFocused || hasValue)
                                ? "-top-2.5 text-xs font-black uppercase tracking-widest bg-[var(--surface)] text-blue-400 shadow-sm rounded-md py-0.5 border border-[var(--border-subtle)]"
                                : "top-4 text-[var(--text-muted)] font-medium",

                            // Align with text when placeholder usually is
                            Icon && !isFocused && !hasValue ? "left-12" : "left-4",

                            isFocused ? "text-blue-500" : "text-[var(--text-muted)]",
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

Textarea.displayName = 'Textarea';
