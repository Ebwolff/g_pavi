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
    isHydrated: boolean;
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setSession: (session: any | null) => void;
    setLoading: (loading: boolean) => void;
    setHydrated: (hydrated: boolean) => void;
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
            isHydrated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setSession: (session) => set({ session }),
            setLoading: (isLoading) => set({ isLoading }),
            setHydrated: (isHydrated) => set({ isHydrated }),
            logout: () =>
                set({
                    user: null,
                    profile: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),
        }),
        {
            name: 'visao360-auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
            partialize: (state) => ({
                // Não persistir isAuthenticated de forma isolada se 
                // não persistirmos o profile, pois isso confunde o RoleGuard
                // Melhor deixar o useAuth re-validar tudo no mount
                isAuthenticated: false,
            }),
        }
    )
);
