import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getUserProfile } from '@/lib/supabase';

export function useAuth() {
    const { user, profile, isAuthenticated, isLoading, setUser, setProfile, setSession, setLoading, logout: storeLogout } = useAuthStore();

    useEffect(() => {
        // Verifica sessão ao montar
        const checkSession = async () => {
            try {
                const session = await authService.getSession();
                if (session?.user) {
                    setUser(session.user);
                    setSession(session);

                    // Busca perfil
                    const userProfile = await getUserProfile();
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Subscreve a mudanças de autenticação
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    setSession(session);

                    const userProfile = await getUserProfile();
                    setProfile(userProfile);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const { user: loggedUser, session, profile: userProfile } = await authService.login({ email, password });
            setUser(loggedUser);
            setSession(session);
            setProfile(userProfile);
            return { user: loggedUser, profile: userProfile };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await authService.logout();
            storeLogout();
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        profile,
        isAuthenticated,
        isLoading,
        login,
        logout,
    };
}
