import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getUserProfile } from '@/lib/supabase';

export function useAuth() {
    // Usar seletores para evitar re-renders desnecessários
    const user = useAuthStore(state => state.user);
    const profile = useAuthStore(state => state.profile);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const isLoading = useAuthStore(state => state.isLoading);
    const isHydrated = useAuthStore(state => state.isHydrated);

    const setUser = useAuthStore(state => state.setUser);
    const setProfile = useAuthStore(state => state.setProfile);
    const setSession = useAuthStore(state => state.setSession);
    const setLoading = useAuthStore(state => state.setLoading);
    const storeLogout = useAuthStore(state => state.logout);

    const checkSession = useCallback(async () => {
        try {
            console.log('🔐 [useAuth] Verificando sessão...');

            setLoading(true);

            // Tenta obter sessão com timeout de 3s
            const sessionPromise = authService.getSession();
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 3000)
            );

            const session = await Promise.race([sessionPromise, timeoutPromise]);

            if (session === null) {
                console.warn('⚠️ [useAuth] Timeout ao verificar sessão');
                setLoading(false);
                return;
            }

            if (session?.user) {
                setUser(session.user);
                setSession(session);

                try {
                    const userProfile = await getUserProfile();
                    setProfile(userProfile);
                } catch (error) {
                    console.warn('Falha ao carregar perfil:', error);
                    // Fallback se perfil falhar mas user existir
                    setProfile({
                        id: session.user.id,
                        role: 'TECNICO', // Fallback conservador
                        first_name: session.user.user_metadata?.first_name || 'Usuário',
                        last_name: session.user.user_metadata?.last_name || '',
                    } as any);
                }
            } else {
                setUser(null);
                setProfile(null);
                setSession(null);
            }
        } catch (error) {
            console.error('Error checking session:', error);
        } finally {
            setLoading(false);
        }
    }, [setUser, setProfile, setSession, setLoading]);

    useEffect(() => {
        if (!isHydrated) return;

        checkSession();

        // Subscreve a mudanças de autenticação
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 [useAuth] Evento de auth:', event);

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    setSession(session);
                    const userProfile = await getUserProfile();
                    setProfile(userProfile);
                } else if (event === 'TOKEN_REFRESHED' && session) {
                    setSession(session);
                    if (session.user) setUser(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                }
            }
        );

        // Verificação periódica usando getState() para evitar closures estáticas
        const sessionCheckInterval = setInterval(async () => {
            const { user: currentUser } = useAuthStore.getState();
            if (!currentUser) return;

            try {
                const currentSession = await authService.getSession();
                if (!currentSession) {
                    const refreshData = await authService.refreshSession();
                    if (!refreshData?.session) {
                        // Logout forçado se refresh falhar
                        window.location.href = '/login';
                    }
                }
            } catch (e) {
                console.warn('Erro na verificação de sessão:', e);
            }
        }, 5 * 60 * 1000); // 5 minutos

        return () => {
            clearInterval(sessionCheckInterval);
            subscription?.unsubscribe();
        };
    }, [isHydrated, checkSession, setUser, setProfile, setSession]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await authService.login({ email, password });
            setUser(result.user);
            setSession(result.session);
            setProfile(result.profile);
            return result;
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
        isLoading: isLoading || !isHydrated,
        login,
        logout,
    };
}
