import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getUserProfile } from '@/lib/supabase';

export function useAuth() {
    const { user, profile, isAuthenticated, isLoading, setUser, setProfile, setSession, setLoading, logout: storeLogout } = useAuthStore();

    useEffect(() => {
        // Verifica sessão ao montar
        // Verifica sessão ao montar
        const checkSession = async () => {
            // Timeout de proteção (5 segundos)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth check timeout')), 5000)
            );

            try {
                // Corrida entre a lógica de auth e o timeout
                await Promise.race([
                    (async () => {
                        const session = await authService.getSession();
                        if (session?.user) {
                            setUser(session.user);
                            setSession(session);

                            // Busca perfil com tratamento de erro isolado para não falhar toda a auth
                            try {
                                const userProfile = await getUserProfile();
                                setProfile(userProfile);
                            } catch (error) {
                                console.warn('Falha ao carregar perfil (AdBlock ou Rede):', error);
                                // Define perfil básico/mock se falhar
                                setProfile({
                                    ...session.user,
                                    role: 'consultor',
                                    first_name: 'Usuário',
                                    last_name: '(Offline/Mock)',
                                    username: session.user.email?.split('@')[0] || 'usuario'
                                } as any);
                            }
                        }
                    })(),
                    timeoutPromise
                ]);
            } catch (error) {
                console.error('Error checking session / Timeout:', error);
                // Mesmo com erro, se tivermos usuário no store, não deslogamos
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
