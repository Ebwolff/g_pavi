import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('⚠️ CRITICAL: Missing Supabase environment variables! App will not work correctly.');
}

// Cliente Supabase com configurações para evitar deadlock de navigator.locks
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Storage key única para evitar conflitos entre abas
        storageKey: 'visao360-auth-session',
        // Usar fluxo PKCE que é mais estável
        flowType: 'pkce',
    },
});

// Helper para obter o usuário atual
export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

// Helper para obter o perfil completo do usuário
export async function getUserProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Erro ao buscar profile:', error);
        return null; // Retorna null em vez de throw
    }
    return data;
}
