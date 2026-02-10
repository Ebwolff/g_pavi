import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
    user: User | null;
    profile: Profile | null;
    session: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setSession: (session: any | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: true,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setSession: (session) => set({ session }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () =>
                set({
                    user: null,
                    profile: null,
                    session: null,
                    isAuthenticated: false,
                }),
        }),
        {
            name: 'visao360-auth-storage',
            partialize: (state) => ({
                // Não persistir dados sensíveis
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
