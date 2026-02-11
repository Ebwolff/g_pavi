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
    sessionChecked: boolean; // Novo flag para evitar loops
    setUser: (user: User | null) => void;
    setProfile: (profile: Profile | null) => void;
    setSession: (session: any | null) => void;
    setLoading: (loading: boolean) => void;
    setHydrated: (hydrated: boolean) => void;
    setSessionChecked: (checked: boolean) => void;
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
            sessionChecked: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            setSession: (session) => set({ session }),
            setLoading: (isLoading) => set({ isLoading }),
            setHydrated: (isHydrated) => set({ isHydrated }),
            setSessionChecked: (sessionChecked) => set({ sessionChecked }),
            logout: () =>
                set({
                    user: null,
                    profile: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                    sessionChecked: false,
                }),
        }),
        {
            name: 'visao360-auth-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
            partialize: (state) => ({
                user: state.user,
                profile: state.profile,
                session: state.session,
                // Não persistimos isAuthenticated, isLoading, isHydrated, sessionChecked
                // Eles devem ser recalculados no boot
            }),
        }
    )
);
