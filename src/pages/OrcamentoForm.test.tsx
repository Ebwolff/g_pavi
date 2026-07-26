import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { OrcamentoForm } from './OrcamentoForm';
import { useAuth } from '@/hooks/useAuth';
import { orcamentoService } from '@/services/orcamento.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/orcamento.service', () => ({
    orcamentoService: { create: vi.fn() },
}));

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <OrcamentoForm />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('OrcamentoForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile: { id: 'consultor-1' } });
    });

    it('cria o orçamento com os dados preenchidos e o consultor logado', async () => {
        (orcamentoService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'orc-novo' });

        renderPage();

        fireEvent.change(screen.getByPlaceholderText('Digite o nome...'), { target: { value: 'Cliente Orçamento' } });
        fireEvent.change(screen.getByPlaceholderText(/JD 7J/), { target: { value: 'Trator Z' } });
        fireEvent.click(screen.getByText('Salvar Orçamento'));

        await waitFor(() => {
            expect(orcamentoService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nome_cliente_digitavel: 'Cliente Orçamento',
                    modelo_maquina: 'Trator Z',
                    consultor_id: 'consultor-1',
                    status_orcamento: 'EM_ELABORACAO',
                })
            );
        });
    });

    it('calcula o valor líquido estimado a partir dos campos financeiros', async () => {
        renderPage();

        const pecasInputs = screen.getAllByPlaceholderText('0.00');
        fireEvent.change(pecasInputs[0], { target: { value: '100' } });
        fireEvent.change(pecasInputs[1], { target: { value: '50' } });
        fireEvent.change(pecasInputs[2], { target: { value: '25' } });

        await waitFor(() => {
            expect(screen.getByText('R$ 175,00')).toBeInTheDocument();
        });
    });

    it('mostra alerta quando a criação do orçamento falha', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        (orcamentoService.create as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Erro de rede'));

        renderPage();
        fireEvent.click(screen.getByText('Salvar Orçamento'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro de rede'));
        });
        alertSpy.mockRestore();
    });
});
