import { supabase } from '@/lib/supabase';
import type { Database, UserRole } from '@/types/database.types';

export type Usuario = Database['public']['Tables']['profiles']['Row'];

export interface CriarUsuarioInput {
    email: string;
    senha: string;
    nome: string;
    sobrenome: string;
    role: UserRole;
}

export const usuarioService = {
    async list(): Promise<Usuario[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('role', { ascending: true })
            .order('username', { ascending: true });

        if (error) throw error;
        return data ?? [];
    },

    /**
     * Criar usuário exige a service_role key, que não pode viver no frontend.
     * Por isso passa pela Edge Function, que valida o papel de quem chama.
     */
    async criar(input: CriarUsuarioInput) {
        const { data, error } = await supabase.functions.invoke('criar-usuario', {
            body: input,
        });

        if (error) {
            // A Edge Function devolve a causa no corpo; o erro do invoke é genérico.
            const detalhe = await extrairErro(error);
            throw new Error(detalhe ?? error.message);
        }
        if (data?.error) throw new Error(data.error);

        return data;
    },

    /**
     * Só ADMIN consegue: a trigger protect_profile_privileges rejeita no banco.
     */
    async alterarPapel(id: string, role: UserRole) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async definirAtivo(id: string, isActive: boolean) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

async function extrairErro(error: unknown): Promise<string | null> {
    const contexto = (error as { context?: unknown })?.context;
    if (contexto instanceof Response) {
        try {
            const corpo = await contexto.json();
            return corpo?.error ?? null;
        } catch {
            return null;
        }
    }
    return null;
}
