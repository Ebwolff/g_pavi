import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database.types';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpData extends LoginCredentials {
    username: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
}

class AuthService {
    async login({ email, password }: LoginCredentials) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Busca o perfil imediatamente após o login bem-sucedido
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.warn('⚠️ [AuthService] Perfil não encontrado ou erro:', profileError.message);
        }

        return {
            user: data.user,
            session: data.session,
            profile: profile || null,
        };
    }

    /**
     * Registra novo usuário (apenas Gerentes podem fazer)
     */
    async signUp({ email, password, username, firstName, lastName, role = 'TECNICO' }: SignUpData) {
        // 1. Cria o usuário no Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) throw signUpError;
        if (!data.user) throw new Error('Falha ao criar usuário');

        // 2. Cria o perfil do usuário
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: data.user.id,
                username,
                first_name: firstName,
                last_name: lastName,
                role,
            });

        if (profileError) {
            // Rollback: deleta o usuário se falhar
            throw profileError;
        }

        return data.user;
    }

    /**
     * Faz logout
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }

    /**
     * Obtém a sessão atual
     */
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    }

    /**
     * Força refresh do token da sessão
     */
    async refreshSession() {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        return data;
    }

    /**
     * Redefine senha (envia email)
     */
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    }

    /**
     * Atualiza senha
     */
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    }

    /**
     * Subscreve a mudanças de autenticação
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
}

export const authService = new AuthService();
