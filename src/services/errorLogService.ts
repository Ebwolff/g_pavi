import { supabase } from '@/lib/supabase';

export type ErrorLogContext = 'error_boundary' | 'window_error' | 'unhandled_rejection';

interface LogErrorInput {
    message: string;
    stack?: string | null;
    componentStack?: string | null;
    context: ErrorLogContext;
}

/**
 * Registra um erro de frontend na tabela error_logs (Supabase), como
 * substituto sem custo/conta externa para um serviço tipo Sentry.
 * Best-effort: nunca lança — um erro ao registrar erro não pode derrubar o app.
 */
export async function logError({ message, stack, componentStack, context }: LogErrorInput): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('error_logs').insert({
            message: message.slice(0, 2000),
            stack: stack?.slice(0, 8000) || null,
            component_stack: componentStack?.slice(0, 8000) || null,
            context,
            url: window.location.href,
            user_agent: navigator.userAgent,
            user_id: user?.id || null,
        });
    } catch {
        // Silenciado de propósito: log de erro nunca deve gerar novo erro visível ao usuário.
    }
}
