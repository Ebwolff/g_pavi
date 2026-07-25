import { describe, it, expect } from 'vitest';
import {
    hasPermission,
    getPermittedRoutes,
    getDefaultRoute,
    isManagerRole,
    canEditOS,
    canAssignTechnician,
    canCreateOS,
    canManageParts,
} from './permissions';

describe('permissions', () => {
    describe('hasPermission', () => {
        it('nega acesso quando o role é null/undefined/vazio', () => {
            expect(hasPermission(null, '/dashboard')).toBe(false);
            expect(hasPermission(undefined, '/dashboard')).toBe(false);
            expect(hasPermission('', '/dashboard')).toBe(false);
        });

        it('nega acesso para um role desconhecido', () => {
            expect(hasPermission('ROLE_INEXISTENTE', '/dashboard')).toBe(false);
        });

        it('é case-insensitive (normaliza para maiúsculas)', () => {
            expect(hasPermission('gerente', '/dashboard')).toBe(true);
            expect(hasPermission('Gerente', '/diretoria')).toBe(true);
        });

        it('TECNICO só acessa suas próprias rotas, não as de outros papéis', () => {
            expect(hasPermission('TECNICO', '/tecnico')).toBe(true);
            expect(hasPermission('TECNICO', '/compras')).toBe(false);
            expect(hasPermission('TECNICO', '/diretoria')).toBe(false);
            expect(hasPermission('TECNICO', '/os/nova')).toBe(false);
        });

        it('GERENTE tem acesso amplo mas não a criação de OS (regra de negócio explícita)', () => {
            expect(hasPermission('GERENTE', '/os/lista')).toBe(true);
            expect(hasPermission('GERENTE', '/diretoria')).toBe(true);
            expect(hasPermission('GERENTE', '/compras')).toBe(true);
            expect(hasPermission('GERENTE', '/os/nova')).toBe(false);
        });

        it('CONSULTOR_GARANTIA acessa criação de OS e orçamentos, mas não painéis de outros papéis', () => {
            expect(hasPermission('CONSULTOR_GARANTIA', '/os/nova')).toBe(true);
            expect(hasPermission('CONSULTOR_GARANTIA', '/orcamentos')).toBe(true);
            expect(hasPermission('CONSULTOR_GARANTIA', '/almoxarifado')).toBe(false);
            expect(hasPermission('CONSULTOR_GARANTIA', '/diretoria')).toBe(false);
        });

        it('permite rota com parâmetro dinâmico dentro do escopo permitido (/os/editar/:id)', () => {
            expect(hasPermission('TECNICO', '/os/editar/abc-123')).toBe(false);
            expect(hasPermission('CHEFE_OFICINA', '/os/editar/abc-123')).toBe(true);
        });

        it('ALMOXARIFADO e COMPRAS só acessam seus próprios painéis', () => {
            expect(hasPermission('ALMOXARIFADO', '/almoxarifado')).toBe(true);
            expect(hasPermission('ALMOXARIFADO', '/compras')).toBe(false);
            expect(hasPermission('COMPRAS', '/compras')).toBe(true);
            expect(hasPermission('COMPRAS', '/almoxarifado')).toBe(false);
        });
    });

    describe('getPermittedRoutes', () => {
        it('retorna lista vazia para role ausente', () => {
            expect(getPermittedRoutes(null)).toEqual([]);
        });

        it('retorna as rotas do role para um role válido', () => {
            const rotas = getPermittedRoutes('TECNICO');
            expect(rotas).toContain('/tecnico');
            expect(rotas).not.toContain('/diretoria');
        });
    });

    describe('getDefaultRoute', () => {
        it('retorna /login quando não há role', () => {
            expect(getDefaultRoute(null)).toBe('/login');
        });

        it('retorna a home correta de cada role', () => {
            expect(getDefaultRoute('TECNICO')).toBe('/tecnico');
            expect(getDefaultRoute('CHEFE_OFICINA')).toBe('/chefe-oficina');
            expect(getDefaultRoute('GERENTE')).toBe('/dashboard');
        });

        it('cai em /configuracoes para role desconhecido', () => {
            expect(getDefaultRoute('ROLE_INEXISTENTE')).toBe('/configuracoes');
        });
    });

    describe('regras de negócio auxiliares', () => {
        it('isManagerRole identifica papéis de gestão', () => {
            expect(isManagerRole('GERENTE')).toBe(true);
            expect(isManagerRole('CHEFE_OFICINA')).toBe(true);
            expect(isManagerRole('TECNICO')).toBe(false);
            expect(isManagerRole(null)).toBe(false);
        });

        it('canEditOS permite papéis operacionais mas não almoxarifado/compras', () => {
            expect(canEditOS('TECNICO')).toBe(true);
            expect(canEditOS('CHEFE_OFICINA')).toBe(true);
            expect(canEditOS('ALMOXARIFADO')).toBe(false);
            expect(canEditOS('COMPRAS')).toBe(false);
        });

        it('canAssignTechnician só permite GERENTE e CHEFE_OFICINA', () => {
            expect(canAssignTechnician('GERENTE')).toBe(true);
            expect(canAssignTechnician('CHEFE_OFICINA')).toBe(true);
            expect(canAssignTechnician('CONSULTOR_GARANTIA')).toBe(false);
            expect(canAssignTechnician('TECNICO')).toBe(false);
        });

        it('canCreateOS só permite gerente e consultores', () => {
            expect(canCreateOS('GERENTE')).toBe(true);
            expect(canCreateOS('CONSULTOR_GARANTIA')).toBe(true);
            expect(canCreateOS('CONSULTOR_POS_VENDA')).toBe(true);
            expect(canCreateOS('CHEFE_OFICINA')).toBe(false);
            expect(canCreateOS('TECNICO')).toBe(false);
        });

        it('canManageParts permite gerente, tecnico e almoxarifado', () => {
            expect(canManageParts('GERENTE')).toBe(true);
            expect(canManageParts('TECNICO')).toBe(true);
            expect(canManageParts('ALMOXARIFADO')).toBe(true);
            expect(canManageParts('COMPRAS')).toBe(false);
            expect(canManageParts('CONSULTOR_GARANTIA')).toBe(false);
        });
    });
});
