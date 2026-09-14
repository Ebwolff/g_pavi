import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { GestaoUsuarios } from './GestaoUsuarios';
import { usuarioService } from '@/services/usuario.service';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/usuario.service', () => ({
    usuarioService: {
        list: vi.fn(),
        criar: vi.fn(),
        alterarPapel: vi.fn(),
        definirAtivo: vi.fn(),
    },
}));

const ADMIN = {
    id: 'u-admin', username: 'admin', first_name: 'Super', last_name: 'Admin',
    role: 'ADMIN', is_active: true,
};
const TECNICO = {
    id: 'u-tec', username: 'joao', first_name: 'João', last_name: 'Silva',
    role: 'TECNICO', is_active: true,
};

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <GestaoUsuarios />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('GestaoUsuarios', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { id: 'u-admin' },
            profile: { role: 'ADMIN' },
        });
    });

    it('lista os usuários com o papel e as telas que cada papel libera', async () => {
        (usuarioService.list as ReturnType<typeof vi.fn>).mockResolvedValue([ADMIN, TECNICO]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('João Silva')).toBeInTheDocument();
        });
        expect(screen.getByText('Super Admin')).toBeInTheDocument();
        // O técnico só enxerga /tecnico e /configuracoes.
        expect(screen.getAllByText('/tecnico').length).toBeGreaterThan(0);
    });

    it('altera o papel de outro usuário pelo seletor', async () => {
        (usuarioService.list as ReturnType<typeof vi.fn>).mockResolvedValue([ADMIN, TECNICO]);
        (usuarioService.alterarPapel as ReturnType<typeof vi.fn>).mockResolvedValue({ ...TECNICO, role: 'COMPRAS' });

        renderPage();

        await waitFor(() => {
            expect(screen.getByLabelText('Papel de joao')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByLabelText('Papel de joao'), { target: { value: 'COMPRAS' } });

        await waitFor(() => {
            expect(usuarioService.alterarPapel).toHaveBeenCalledWith('u-tec', 'COMPRAS');
        });
    });

    it('impede o admin logado de rebaixar ou desativar a si mesmo', async () => {
        (usuarioService.list as ReturnType<typeof vi.fn>).mockResolvedValue([ADMIN, TECNICO]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByLabelText('Papel de admin')).toBeInTheDocument();
        });
        expect(screen.getByLabelText('Papel de admin')).toBeDisabled();
        // A linha do próprio admin é a primeira; seu botão de desativar fica travado.
        expect(screen.getAllByText('Desativar')[0].closest('button')).toBeDisabled();
    });

    it('mostra o erro devolvido pelo banco quando a alteração de papel é rejeitada', async () => {
        (usuarioService.list as ReturnType<typeof vi.fn>).mockResolvedValue([ADMIN, TECNICO]);
        (usuarioService.alterarPapel as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('Apenas administradores podem alterar o papel de um usuário')
        );

        renderPage();

        await waitFor(() => {
            expect(screen.getByLabelText('Papel de joao')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByLabelText('Papel de joao'), { target: { value: 'COMPRAS' } });

        await waitFor(() => {
            expect(
                screen.getByText('Apenas administradores podem alterar o papel de um usuário')
            ).toBeInTheDocument();
        });
    });
});
