/**
 * RoleGuard - Componente de proteção de rotas por role
 * 
 * Verifica se o usuário tem permissão para acessar a rota atual
 * Se não tiver, redireciona para sua página padrão
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, getDefaultRoute } from '@/utils/permissions';
import { ShieldX } from 'lucide-react';

interface RoleGuardProps {
    children: ReactNode;
    /** Se true, mostra mensagem ao invés de redirecionar */
    showForbidden?: boolean;
}

export function RoleGuard({ children, showForbidden = false }: RoleGuardProps) {
    const { profile, isLoading } = useAuth();
    const location = useLocation();

    // Aguarda carregamento
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                    <p className="mt-4 text-text-muted">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    const userRole = profile?.role;
    const currentPath = location.pathname;

    // Verifica permissão
    if (!hasPermission(userRole, currentPath)) {
        if (showForbidden) {
            return (
                <div className="min-h-screen flex items-center justify-center p-8 bg-background">
                    <div className="max-w-md w-full p-8 rounded-2xl text-center bg-surface border border-border-subtle">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center bg-red-500/10">
                            <ShieldX className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2 text-text-primary">
                            Acesso Restrito
                        </h2>
                        <p className="mb-6 text-text-muted">
                            Você não tem permissão para acessar esta página.
                            <br />
                            <span className="text-sm">
                                Sua função: <strong className="text-text-secondary">{userRole || 'Não definida'}</strong>
                            </span>
                        </p>
                        <button
                            onClick={() => window.location.href = getDefaultRoute(userRole)}
                            className="px-6 py-2.5 rounded-lg font-medium transition-colors bg-primary text-white hover:bg-primary-hover"
                        >
                            Ir para Página Inicial
                        </button>
                    </div>
                </div>
            );
        }

        // Redireciona para página padrão do role
        const defaultRoute = getDefaultRoute(userRole);
        console.warn(`[RoleGuard] Acesso negado a ${currentPath} para role ${userRole}. Redirecionando para ${defaultRoute}`);
        return <Navigate to={defaultRoute} replace />;
    }

    return <>{children}</>;
}
