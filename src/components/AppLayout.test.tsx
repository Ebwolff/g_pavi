import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { getPermittedRoutes } from '@/utils/permissions';
import type { UserRole } from '@/types/database.types';

vi.mock('@/hooks/useAuth');
vi.mock('@/lib/syncEngine', () => ({
    startAutoSync: vi.fn(),
    stopAutoSync: vi.fn(),
}));
vi.mock('@/services/pushNotificationService', () => ({
    requestNotificationPermission: vi.fn().mockResolvedValue(false),
    startPushListener: vi.fn(),
    stopPushListener: vi.fn(),
}));
vi.mock('@/components/ui/OfflineStatusBar', () => ({
    OfflineStatusBar: () => null,
}));

function renderComo(role: UserRole) {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'u-1' },
        profile: { role, first_name: 'Teste', last_name: 'Usuario' },
        signOut: vi.fn(),
    });
    return render(
        <MemoryRouter>
            <AppLayout><div>conteudo</div></AppLayout>
        </MemoryRouter>
    );
}

describe('AppLayout — menu lateral', () => {
    beforeEach(() => vi.clearAllMocks());

    it('mostra Usuários e Pendências para o ADMIN', () => {
        renderComo('ADMIN');
        expect(screen.getAllByText('Usuários').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Pendências').length).toBeGreaterThan(0);
    });

    it('esconde Usuários de quem não é ADMIN, inclusive do GERENTE', () => {
        renderComo('GERENTE');
        expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
        // Gerente continua com acesso a Pendências.
        expect(screen.getAllByText('Pendências').length).toBeGreaterThan(0);
    });

    it('técnico vê apenas o próprio painel e configurações', () => {
        renderComo('TECNICO');
        expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
        expect(screen.queryByText('Pendências')).not.toBeInTheDocument();
        expect(screen.queryByText('Lista de OS')).not.toBeInTheDocument();
        expect(screen.getAllByText('Técnico').length).toBeGreaterThan(0);
    });

    it('toda rota permitida ao ADMIN tem item de menu correspondente', () => {
        const { container } = renderComo('ADMIN');

        // Rotas que existem como destino de navegação interna, sem item próprio
        // no menu: são alcançadas a partir de outras telas.
        const semItemDeMenu = ['/os/editar'];

        const href = new Set(
            Array.from(container.querySelectorAll('[data-menu-path]'))
                .map((el) => el.getAttribute('data-menu-path'))
        );

        const faltando = getPermittedRoutes('ADMIN')
            .filter((rota) => !semItemDeMenu.includes(rota))
            .filter((rota) => !href.has(rota));

        expect(faltando).toEqual([]);
    });
});
