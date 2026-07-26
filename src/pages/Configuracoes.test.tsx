import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Configuracoes } from './Configuracoes';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';
import { useThemeStore } from '@/stores/themeStore';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/profile.service', () => ({
    profileService: { checkUsernameAvailability: vi.fn(), updateProfile: vi.fn() },
}));

const profile = {
    id: 'user-1',
    first_name: 'João',
    last_name: 'Silva',
    username: 'joaosilva',
    role: 'GERENTE',
};

describe('Configuracoes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile, logout: vi.fn() });
        useThemeStore.setState({ theme: 'dark' });
    });

    it('exibe o nome e o cargo do usuário logado', () => {
        render(<Configuracoes />);
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getAllByText('GERENTE').length).toBeGreaterThan(0);
    });

    it('salva as alterações de perfil quando o username está disponível', async () => {
        (profileService.checkUsernameAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(true);
        (profileService.updateProfile as ReturnType<typeof vi.fn>).mockResolvedValue({ ...profile, first_name: 'Joana' });

        render(<Configuracoes />);
        fireEvent.click(screen.getByText('Editar Perfil'));
        fireEvent.change(screen.getByDisplayValue('João'), { target: { value: 'Joana' } });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(profileService.updateProfile).toHaveBeenCalledWith(
                'user-1',
                expect.objectContaining({ first_name: 'Joana' })
            );
        });
        await waitFor(() => {
            expect(screen.getByText('Perfil atualizado com sucesso!')).toBeInTheDocument();
        });
    });

    it('bloqueia o salvamento quando o username já está em uso', async () => {
        (profileService.checkUsernameAvailability as ReturnType<typeof vi.fn>).mockResolvedValue(false);

        render(<Configuracoes />);
        fireEvent.click(screen.getByText('Editar Perfil'));
        fireEvent.change(screen.getByDisplayValue('joaosilva'), { target: { value: 'outro_user' } });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(screen.getByText('Este username já está em uso.')).toBeInTheDocument();
        });
        expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it('altera o tema da aplicação ao clicar numa opção de aparência', () => {
        render(<Configuracoes />);
        fireEvent.click(screen.getByText('Claro'));
        expect(useThemeStore.getState().theme).toBe('light');
    });
});
