import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ListaOrcamentos } from './ListaOrcamentos';
import { useAuth } from '@/hooks/useAuth';
import { orcamentoService } from '@/services/orcamento.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/orcamento.service', () => ({
    orcamentoService: { list: vi.fn() },
}));

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <ListaOrcamentos />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('ListaOrcamentos', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile: { id: 'user-1', role: 'CONSULTOR_NORMAL' } });
    });

    it('lista os orçamentos com o nome do cliente e o status traduzido', async () => {
        (orcamentoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'orc-1', numero_orcamento: 'ORC-050', nome_cliente_digitavel: 'Fazenda Sol',
                    modelo_maquina: 'Colheitadeira', chassi: 'CH50', data_criacao: '2026-01-01T00:00:00Z',
                    valor_liquido_total: 3000, status_orcamento: 'APROVADO',
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('ORC-050')).toBeInTheDocument();
        });
        expect(screen.getByText('Fazenda Sol')).toBeInTheDocument();
        expect(screen.getAllByText('Aprovado').length).toBeGreaterThan(0);
    });

    it('usa o nome do cliente cadastrado como fallback quando não há nome digitado', async () => {
        (orcamentoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'orc-2', numero_orcamento: 'ORC-051', nome_cliente_digitavel: null,
                    cliente: { nome_cliente: 'Cliente Cadastrado' },
                    modelo_maquina: null, chassi: null, data_criacao: '2026-01-01T00:00:00Z',
                    valor_liquido_total: 0, status_orcamento: 'EM_ELABORACAO',
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Cliente Cadastrado')).toBeInTheDocument();
        });
    });

    it('limpa a busca e o filtro de status ao clicar em Limpar', async () => {
        (orcamentoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage();

        fireEvent.change(screen.getByPlaceholderText(/Buscar por N° ORC/i), { target: { value: 'ORC-050' } });
        await waitFor(() => expect(screen.getByText('Limpar')).toBeInTheDocument());

        fireEvent.click(screen.getByText('Limpar'));

        expect(screen.getByPlaceholderText(/Buscar por N° ORC/i)).toHaveValue('');
    });
});
