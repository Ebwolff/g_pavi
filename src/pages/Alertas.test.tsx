import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Alertas } from './Alertas';
import { alertasService } from '@/services/alertasService';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/services/alertasService', () => ({
    alertasService: {
        getAlertas: vi.fn(),
        marcarComoLido: vi.fn(),
        marcarTodosComoLidos: vi.fn(),
        deletarAlerta: vi.fn(),
    },
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { auth: { getUser: vi.fn() } },
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <Alertas />
        </MemoryRouter>
    );
}

describe('Alertas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { user: { id: 'user-1' } } });
    });

    it('lista os alertas do usuário logado', async () => {
        (alertasService.getAlertas as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'a1', titulo: 'OS Vencida', mensagem: 'A OS-100 está atrasada', tipo_alerta: 'OS_VENCIDA',
                prioridade: 'URGENTE', lido: false, created_at: '2026-01-01T00:00:00Z', os_id: 'os-1',
            },
        ]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('OS Vencida')).toBeInTheDocument();
        });
        expect(screen.getByText('A OS-100 está atrasada')).toBeInTheDocument();
    });

    it('marca um alerta como lido e recarrega a lista', async () => {
        (alertasService.getAlertas as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'a1', titulo: 'Peças chegando', mensagem: 'Chegada prevista', tipo_alerta: 'PECAS_CHEGANDO',
                prioridade: 'NORMAL', lido: false, created_at: '2026-01-01T00:00:00Z', os_id: null,
            },
        ]);
        (alertasService.marcarComoLido as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

        renderPage();

        await waitFor(() => screen.getByText('Peças chegando'));
        fireEvent.click(screen.getByTitle('Marcar como lido'));

        await waitFor(() => {
            expect(alertasService.marcarComoLido).toHaveBeenCalledWith('a1');
        });
        expect(alertasService.getAlertas).toHaveBeenCalledTimes(2);
    });

    it('mostra estado vazio quando não há alertas', async () => {
        (alertasService.getAlertas as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Tudo Silencioso')).toBeInTheDocument();
        });
    });
});
