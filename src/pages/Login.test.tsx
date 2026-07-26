import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Login } from './Login';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );
}

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('chama login com email e senha digitados e navega para a rota do perfil', async () => {
        const loginMock = vi.fn().mockResolvedValue({ profile: { role: 'GERENTE' } });
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ login: loginMock });

        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Corporativo/i), { target: { value: 'joao@mardisa.com' } });
        fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'segredo123' } });
        fireEvent.click(screen.getByText('Entrar no Sistema'));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith('joao@mardisa.com', 'segredo123');
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('mostra mensagem amigável quando as credenciais estão erradas', async () => {
        const loginMock = vi.fn().mockRejectedValue(new Error('Invalid login credentials'));
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ login: loginMock });

        renderPage();

        fireEvent.change(screen.getByLabelText(/Email Corporativo/i), { target: { value: 'joao@mardisa.com' } });
        fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'errada' } });
        fireEvent.click(screen.getByText('Entrar no Sistema'));

        await waitFor(() => {
            expect(screen.getByText('E-mail ou senha incorretos.')).toBeInTheDocument();
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
