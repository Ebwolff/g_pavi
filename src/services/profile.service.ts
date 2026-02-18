import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
    /**
     * Atualiza o perfil do usuário atual
     */
    async updateProfile(id: string, updates: ProfileUpdate) {
        const { data, error } = await (supabase as any)
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Verifica se um username já está em uso
     */
    async checkUsernameAvailability(username: string, currentUserId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .neq('id', currentUserId)
            .maybeSingle();

        if (error) throw error;
        return !data;
    }
};
