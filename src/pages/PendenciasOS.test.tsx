import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PendenciasOS } from './PendenciasOS';
import { pendenciaService } from '@/services/pendencia.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/services/pendencia.service', () => ({
    pendenciaService: { list: vi.fn() },
}));

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <PendenciasOS />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('PendenciasOS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calcula as estatísticas de pendências por status e lista os registros', async () => {
        (pendenciaService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'p1', tipo_pendencia: 'PECAS', descricao: 'Aguardando peça X', responsavel: 'João',
                status: 'PENDENTE', data_inicio: '2026-01-01T00:00:00Z', data_prevista: null, os_id: 'os-1',
                ordens_servico: { numero_os: 'OS-700', nome_cliente_digitavel: 'Cliente A' },
            },
            {
                id: 'p2', tipo_pendencia: 'SERVICO', descricao: 'Retrabalho', responsavel: null,
                status: 'RESOLVIDO', data_inicio: '2026-01-01T00:00:00Z', data_prevista: null, os_id: 'os-2',
                ordens_servico: { numero_os: 'OS-701', nome_cliente_digitavel: 'Cliente B' },
            },
        ]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Aguardando peça X')).toBeInTheDocument();
        });
        expect(screen.getByText('OS-700')).toBeInTheDocument();

        const totalCard = screen.getByText('Total de Pendências').closest('div');
        expect(totalCard).toBeTruthy();
    });

    it('mostra estado vazio quando não há pendências', async () => {
        (pendenciaService.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Nenhuma pendência localizada')).toBeInTheDocument();
        });
    });
});
