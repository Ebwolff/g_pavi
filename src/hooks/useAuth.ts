import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getUserProfile } from '@/lib/supabase';

export function useAuth() {
    const { user, profile, isAuthenticated, isLoading, setUser, setProfile, setSession, setLoading, logout: storeLogout } = useAuthStore();

    useEffect(() => {
        // Variável para controlar se já finalizamos o loading
        let loadingFinished = false;

        // SAFETY TIMEOUT: Forçar fim do loading após 5 segundos
        // Isso evita hang infinito se o Supabase travar no navigator.locks
        const safetyTimeout = setTimeout(() => {
            if (!loadingFinished) {
                console.warn('⚠️ [useAuth] Safety timeout: forçando fim do loading após 5s');
                setLoading(false);
                loadingFinished = true;
            }
        }, 5000);

        const checkSession = async () => {
            try {
                console.log('🔐 [useAuth] Verificando sessão...');
                const session = await authService.getSession();
                console.log('🔐 [useAuth] Sessão verificada:', !!session);

                if (session?.user) {
                    setUser(session.user);
                    setSession(session);

                    // Busca perfil com tratamento de erro isolado
                    try {
                        const userProfile = await getUserProfile();
                        setProfile(userProfile);
                    } catch (error) {
                        console.warn('Falha ao carregar perfil:', error);
                        setProfile({
                            ...session.user,
                            role: 'consultor', // Fallback seguro
                            first_name: session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'Usuário',
                            last_name: session.user.user_metadata?.last_name || '',
                            username: session.user.email?.split('@')[0] || 'usuario'
                        } as any);
                    }
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                if (!loadingFinished) {
                    setLoading(false);
                    loadingFinished = true;
                    clearTimeout(safetyTimeout);
                    console.log('🔐 [useAuth] Loading finalizado');
                }
            }
        };

        checkSession();

        // Subscreve a mudanças de autenticação (incluindo refresh de token)
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 [useAuth] Evento de auth:', event, 'Sessão:', !!session);

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    setSession(session);
                    try {
                        const userProfile = await getUserProfile();
                        setProfile(userProfile);
                    } catch (e) {
                        console.warn('Erro ao carregar perfil no login:', e);
                    }
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    // Token foi renovado automaticamente
                    console.log('✅ [useAuth] Token renovado automaticamente');
                    setSession(session);
                    if (session.user) {
                        setUser(session.user);
                    }
                } else if (event === 'SIGNED_OUT' || !session) {
                    console.log('🚪 [useAuth] Sessão encerrada ou expirada');
                    setUser(null);
                    setProfile(null);
                    setSession(null);

                    // Redirecionar para login se não estiver na página de login
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        console.log('🔄 [useAuth] Redirecionando para login...');
                        window.location.href = '/login';
                    }
                }
            }
        );

        // Verificação periódica da sessão a cada 5 minutos
        const sessionCheckInterval = setInterval(async () => {
            try {
                const currentSession = await authService.getSession();
                if (!currentSession && window.location.pathname !== '/login' && window.location.pathname !== '/') {
                    console.warn('⚠️ [useAuth] Sessão expirada detectada na verificação periódica');
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                    window.location.href = '/login';
                }
            } catch (e) {
                console.warn('Erro na verificação periódica de sessão:', e);
            }
        }, 5 * 60 * 1000); // 5 minutos

        return () => {
            clearTimeout(safetyTimeout);
            clearInterval(sessionCheckInterval);
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
