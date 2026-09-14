import { logger } from '@/lib/logger';
import type { UserRole } from '@/types/database.types';
/**
 * Visão 360 - Sistema de Permissões por Role
 *
 * Define quais páginas/funcionalidades cada role pode acessar
 */

export type { UserRole };

// Definição de todas as rotas do sistema
export type AppRoute =
    | '/dashboard'
    | '/os/nova'
    | '/os/lista'
    | '/os/faturadas'
    | '/os/editar'
    | '/orcamentos'
    | '/pendencias'
    | '/consultor'
    | '/chefe-oficina'
    | '/tecnico'
    | '/compras'
    | '/almoxarifado'
    | '/diretoria'
    | '/feramental'
    | '/relatorios'
    | '/alertas'
    | '/usuarios'
    | '/configuracoes';

// Mapeamento de permissões: quais roles podem acessar quais rotas
const ROLE_PERMISSIONS: Record<UserRole, AppRoute[]> = {
    // Admin: acesso irrestrito, incluindo a gestão de usuários
    ADMIN: [
        '/dashboard',
        '/os/nova',
        '/os/lista',
        '/os/faturadas',
        '/os/editar',
        '/orcamentos',
        '/pendencias',
        '/consultor',
        '/chefe-oficina',
        '/tecnico',
        '/compras',
        '/almoxarifado',
        '/feramental',
        '/diretoria',
        '/relatorios',
        '/alertas',
        '/usuarios',
        '/configuracoes',
    ],

    // Gerente: acesso total (exceto criação de OS conforme solicitado)
    GERENTE: [
        '/dashboard',
        '/os/lista',
        '/os/faturadas',
        '/os/editar',
        '/orcamentos',
        '/pendencias',
        '/consultor',
        '/chefe-oficina',
        '/tecnico',
        '/compras',
        '/almoxarifado',
        '/feramental',
        '/diretoria',
        '/relatorios',
        '/alertas',
        '/configuracoes',
    ],

    // Consultor Garantia: foco em OS de garantia
    CONSULTOR_GARANTIA: [
        '/dashboard',
        '/os/nova',
        '/os/lista',
        '/os/faturadas',
        '/os/editar',
        '/orcamentos',
        '/pendencias',
        '/consultor',
        '/alertas',
        '/configuracoes',
    ],

    // Consultor Pós-Venda: foco em OS normais
    CONSULTOR_POS_VENDA: [
        '/dashboard',
        '/os/nova',
        '/os/lista',
        '/os/faturadas',
        '/os/editar',
        '/orcamentos',
        '/pendencias',
        '/consultor',
        '/alertas',
        '/configuracoes',
    ],

    // Chefe de Oficina: gerencia técnicos e atribui OS
    CHEFE_OFICINA: [
        '/os/lista',
        '/os/editar',
        '/pendencias',
        '/chefe-oficina',
        '/configuracoes',
    ],

    // Técnico: apenas seu painel e suas OS
    TECNICO: [
        '/tecnico',
        '/configuracoes',
    ],

    // Almoxarifado: gestão de peças e estoque
    ALMOXARIFADO: [
        '/almoxarifado',
        '/configuracoes',
    ],

    // Compras: gestão de compras
    COMPRAS: [
        '/compras',
        '/configuracoes',
    ],

    // Feramental: gestão de frota/veículos
    FERAMENTAL: [
        '/feramental',
        '/almoxarifado',
        '/configuracoes',
    ],
};

// Nome legível de cada papel, para exibição na interface
export const ROLE_LABELS: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    GERENTE: 'Gerente',
    CONSULTOR_GARANTIA: 'Consultor de Garantia',
    CONSULTOR_POS_VENDA: 'Consultor de Pós-Venda',
    CHEFE_OFICINA: 'Chefe de Oficina',
    TECNICO: 'Técnico',
    ALMOXARIFADO: 'Almoxarifado',
    COMPRAS: 'Compras',
    FERAMENTAL: 'Ferramental',
};

// Página inicial padrão para cada role
export const DEFAULT_ROUTE: Record<UserRole, string> = {
    ADMIN: '/dashboard',
    GERENTE: '/dashboard',
    CONSULTOR_GARANTIA: '/dashboard',
    CONSULTOR_POS_VENDA: '/dashboard',
    CHEFE_OFICINA: '/chefe-oficina',
    TECNICO: '/tecnico',
    ALMOXARIFADO: '/almoxarifado',
    COMPRAS: '/compras',
    FERAMENTAL: '/feramental',
};

/**
 * Verifica se um role tem permissão para acessar uma rota
 */
export function hasPermission(role: string | undefined | null, route: string): boolean {
    if (!role) return false;

    const normalizedRole = role.toUpperCase() as UserRole;
    const permissions = ROLE_PERMISSIONS[normalizedRole];

    if (!permissions) {
        logger.warn(`Role desconhecido: ${role}`);
        return false;
    }

    // Verifica se a rota exata está permitida
    if (permissions.includes(route as AppRoute)) {
        return true;
    }

    // Verifica rotas com parâmetros dinâmicos (ex: /os/editar/:id)
    const baseRoute = route.split('/').slice(0, 3).join('/');
    if (permissions.some(p => route.startsWith(p) || baseRoute === p)) {
        return true;
    }

    return false;
}

/**
 * Retorna a lista de rotas permitidas para um role
 */
export function getPermittedRoutes(role: string | undefined | null): AppRoute[] {
    if (!role) return [];

    const normalizedRole = role.toUpperCase() as UserRole;
    return ROLE_PERMISSIONS[normalizedRole] || [];
}

/**
 * Retorna a rota padrão para um role
 */
export function getDefaultRoute(role: string | undefined | null): string {
    if (!role) return '/login';

    const normalizedRole = role.toUpperCase() as UserRole;
    return DEFAULT_ROUTE[normalizedRole] || '/configuracoes';
}

/**
 * Verifica se um role é de gestão (pode ver mais informações)
 */
export function isManagerRole(role: string | undefined | null): boolean {
    if (!role) return false;
    const managerRoles = ['ADMIN', 'GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA'];
    return managerRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode criar usuários e definir o papel de cada um.
 * Espelha a trigger protect_profile_privileges no banco: só ADMIN altera papéis.
 */
export function canManageUsers(role: string | undefined | null): boolean {
    if (!role) return false;
    return role.toUpperCase() === 'ADMIN';
}

/**
 * Verifica se um role pode editar uma OS
 */
export function canEditOS(role: string | undefined | null): boolean {
    if (!role) return false;
    const editRoles = ['ADMIN', 'GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO'];
    return editRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode atribuir técnicos a OS
 */
export function canAssignTechnician(role: string | undefined | null): boolean {
    if (!role) return false;
    const assignRoles = ['ADMIN', 'GERENTE', 'CHEFE_OFICINA'];
    return assignRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode criar nova OS
 */
export function canCreateOS(role: string | undefined | null): boolean {
    if (!role) return false;
    const createRoles = ['ADMIN', 'GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA'];
    return createRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode lançar peças
 */
export function canManageParts(role: string | undefined | null): boolean {
    if (!role) return false;
    const partsRoles = ['ADMIN', 'GERENTE', 'TECNICO', 'ALMOXARIFADO'];
    return partsRoles.includes(role.toUpperCase());
}
