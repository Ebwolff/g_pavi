import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ListaOS } from './ListaOS';
import { useAuth } from '@/hooks/useAuth';
import { ordemServicoService } from '@/services/ordemServico.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { list: vi.fn(), updateStatus: vi.fn() },
}));

function renderPage(props?: { onlyFaturadas?: boolean }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <ListaOS {...props} />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('ListaOS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile: { role: 'GERENTE' } });
    });

    it('lista as ordens de serviço retornadas pelo serviço', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'os-1', numero_os: 'OS-900', tipo_os: 'NORMAL', status_atual: 'EM_EXECUCAO',
                    nome_cliente_digitavel: 'Cliente Teste', chassi: 'CH1', data_abertura: '2026-01-01T00:00:00Z',
                    valor_liquido_total: 1000,
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('OS-900')).toBeInTheDocument();
        });
        expect(screen.getByText('Cliente Teste')).toBeInTheDocument();
    });

    it('exclui OS faturadas da view padrão e força status FATURADA na view de faturadas', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage({ onlyFaturadas: true });

        await waitFor(() => {
            expect(ordemServicoService.list).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'FATURADA', excludeStatus: undefined }),
                1,
                25
            );
        });
    });

    it('mostra estado vazio quando não há OS', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Nenhuma Ordem de Serviço encontrada')).toBeInTheDocument();
        });
    });
});
