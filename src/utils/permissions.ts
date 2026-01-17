/**
 * MARDISA Agro - Sistema de Permissões por Role
 * 
 * Define quais páginas/funcionalidades cada role pode acessar
 */

export type UserRole =
    | 'GERENTE'
    | 'CONSULTOR_GARANTIA'
    | 'CONSULTOR_POS_VENDA'
    | 'CHEFE_OFICINA'
    | 'TECNICO'
    | 'ALMOXARIFADO'
    | 'COMPRAS'
    | 'FERAMENTAL';

// Definição de todas as rotas do sistema
export type AppRoute =
    | '/dashboard'
    | '/os/nova'
    | '/os/lista'
    | '/os/editar'
    | '/consultor'
    | '/chefe-oficina'
    | '/tecnico'
    | '/compras'
    | '/almoxarifado'
    | '/diretoria'
    | '/feramental'
    | '/relatorios'
    | '/alertas'
    | '/configuracoes';

// Mapeamento de permissões: quais roles podem acessar quais rotas
const ROLE_PERMISSIONS: Record<UserRole, AppRoute[]> = {
    // Gerente: acesso total
    GERENTE: [
        '/dashboard',
        '/os/nova',
        '/os/lista',
        '/os/editar',
        '/consultor',
        '/chefe-oficina',
        '/tecnico',
        '/compras',
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
        '/os/editar',
        '/consultor',
        '/alertas',
        '/configuracoes',
    ],

    // Consultor Pós-Venda: foco em OS normais
    CONSULTOR_POS_VENDA: [
        '/dashboard',
        '/os/nova',
        '/os/lista',
        '/os/editar',
        '/consultor',
        '/alertas',
        '/configuracoes',
    ],

    // Chefe de Oficina: gerencia técnicos e atribui OS
    CHEFE_OFICINA: [
        '/os/lista',
        '/os/editar',
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
        '/os/lista',
        '/compras',
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

// Página inicial padrão para cada role
export const DEFAULT_ROUTE: Record<UserRole, string> = {
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
        console.warn(`Role desconhecido: ${role}`);
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
    const managerRoles = ['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA'];
    return managerRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode editar uma OS
 */
export function canEditOS(role: string | undefined | null): boolean {
    if (!role) return false;
    const editRoles = ['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA', 'CHEFE_OFICINA', 'TECNICO'];
    return editRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode atribuir técnicos a OS
 */
export function canAssignTechnician(role: string | undefined | null): boolean {
    if (!role) return false;
    const assignRoles = ['GERENTE', 'CHEFE_OFICINA'];
    return assignRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode criar nova OS
 */
export function canCreateOS(role: string | undefined | null): boolean {
    if (!role) return false;
    const createRoles = ['GERENTE', 'CONSULTOR_GARANTIA', 'CONSULTOR_POS_VENDA'];
    return createRoles.includes(role.toUpperCase());
}

/**
 * Verifica se um role pode lançar peças
 */
export function canManageParts(role: string | undefined | null): boolean {
    if (!role) return false;
    const partsRoles = ['GERENTE', 'TECNICO', 'ALMOXARIFADO'];
    return partsRoles.includes(role.toUpperCase());
}
