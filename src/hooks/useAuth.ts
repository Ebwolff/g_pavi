import { logger } from '@/lib/logger';
import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { getUserProfile } from '@/lib/supabase';

export function useAuth() {
    // Usar useRef para evitar execução duplicada em Strict Mode ou re-renders rápidos
    const checkInProgress = useRef(false);

    const user = useAuthStore(state => state.user);
    const profile = useAuthStore(state => state.profile);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const isLoading = useAuthStore(state => state.isLoading);
    const isHydrated = useAuthStore(state => state.isHydrated);
    const sessionChecked = useAuthStore(state => state.sessionChecked);

    const setUser = useAuthStore(state => state.setUser);
    const setProfile = useAuthStore(state => state.setProfile);
    const setSession = useAuthStore(state => state.setSession);
    const setLoading = useAuthStore(state => state.setLoading);
    const setSessionChecked = useAuthStore(state => state.setSessionChecked);
    const storeLogout = useAuthStore(state => state.logout);

    const checkSession = useCallback(async (force = false) => {
        // Se já verificamos a sessão e não é forçado, abortar
        if (sessionChecked && !force) {
            return;
        }

        // Se já existe uma checagem em andamento, abortar
        if (checkInProgress.current) {
            return;
        }

        try {
            checkInProgress.current = true;
            logger.log('🔐 [useAuth] Verificando sessão...');

            // Só ativa loading se não tiver usuário (para evitar flicker se já tiver dados persistidos)
            if (!user) setLoading(true);

            // Tenta obter sessão com timeout de 5s para redes lentas
            const sessionPromise = authService.getSession();
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000)
            );

            const session = await Promise.race([sessionPromise, timeoutPromise]);

            if (session === null) {
                logger.warn('⚠️ [useAuth] Timeout ou falha ao verificar sessão');
                // Não deslogar agressivamente em timeout, manter estado anterior se existir
                // Mas se não tinha user, confirma que não tem
                if (!user) {
                    setLoading(false);
                    setSessionChecked(true);
                }
                return;
            }

            if (session?.user) {
                // Atualiza store apenas se houver mudanças reais para evitar re-renders
                if (user?.id !== session.user.id || !isAuthenticated) {
                    setUser(session.user);
                    setSession(session);
                }

                // Carrega perfil se não existir ou se mudou o user
                if (!profile || profile.id !== session.user.id) {
                    try {
                        const userProfile = await getUserProfile();
                        setProfile(userProfile);
                    } catch (error) {
                        logger.warn('Falha ao carregar perfil:', error);
                        // Sem fallback de role por segurança — perfil null força revalidação
                        setProfile(null);
                    }
                }
            } else {
                // Se o Supabase diz que não tem sessão, limpamos tudo
                if (user || isAuthenticated) {
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                }
            }
        } catch (error) {
            logger.error('Error checking session:', error);
        } finally {
            checkInProgress.current = false;
            setLoading(false);
            setSessionChecked(true); // Marca como verificado para impedir novos loops
        }
    }, [user, profile, isAuthenticated, sessionChecked, setUser, setProfile, setSession, setLoading, setSessionChecked]);

    useEffect(() => {
        if (!isHydrated) return;

        // Apenas chama checkSession se ainda não foi verificado
        if (!sessionChecked) {
            checkSession();
        }

        // Subscreve a mudanças de autenticação (SIGN_IN, SIGN_OUT)
        // Isso lida com login/logout explícito, não precisa de polling agressivo
        const { data: { subscription } } = authService.onAuthStateChange(
            async (event, session) => {
                logger.log('🔄 [useAuth] Evento de auth:', event);

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    setSession(session);
                    if (!profile) {
                        const userProfile = await getUserProfile();
                        setProfile(userProfile);
                    }
                    setLoading(false);
                    setSessionChecked(true);
                } else if (event === 'TOKEN_REFRESHED') {
                    // Apenas atualiza sessão, sem re-renderizar todo o app se user é o mesmo
                    if (session) setSession(session);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                    setSession(null);
                    setSessionChecked(false); // Permite nova checagem no futuro login
                    setLoading(false);
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
                        window.location.href = '/login';
                    }
                }
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, [isHydrated, sessionChecked, checkSession, setUser, setProfile, setSession, setSessionChecked, setLoading]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const result = await authService.login({ email, password });
            setUser(result.user);
            setSession(result.session);
            setProfile(result.profile);
            setSessionChecked(true);
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
            // Redirecionamento é tratado pelo evento onAuthStateChange
        }
    };

    return {
        user,
        profile,
        // Retorna true se tiver user, ignorando isLoading para evitar flicker se hydrated
        isAuthenticated: !!user,
        // Só mostra loading se NÃO tiver user e ainda estiver carregando/hidratando
        // Se já tem user (persistido), mostra app imediatamente (stale-while-revalidate)
        isLoading: !isHydrated || (isLoading && !user),
        login,
        logout,
    };
}
