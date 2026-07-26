import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { NovaOS } from './NovaOS';
import { ordemServicoService } from '@/services/ordemServico.service';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { create: vi.fn(), getNextOSNumber: vi.fn() },
}));
vi.mock('@/services/orcamento.service', () => ({
    orcamentoService: { findByNumeroNBS: vi.fn() },
}));
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn(() => ({ data: { publicUrl: '' } })) })) },
    },
}));

function chainable(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'eq'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.maybeSingle = vi.fn(() => Promise.resolve({ data, error: null }));
    return builder;
}

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <NovaOS />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('NovaOS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('cria a OS quando o número informado ainda não existe', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable(null));
        (ordemServicoService.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'os-1' });

        renderPage();

        fireEvent.change(screen.getByPlaceholderText('XXXX-0000'), { target: { value: 'OS-9999' } });
        fireEvent.change(screen.getByPlaceholderText('Digite o nome do cliente...'), { target: { value: 'Cliente Novo' } });
        fireEvent.click(screen.getByText('Finalizar Abertura'));

        await waitFor(() => {
            expect(ordemServicoService.create).toHaveBeenCalledWith(
                expect.objectContaining({ numero_os: 'OS-9999', nome_cliente_digitavel: 'Cliente Novo' })
            );
        });
    });

    it('bloqueia a criação e avisa quando o número de OS já existe', async () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable({ id: 'os-existente' }));

        renderPage();

        fireEvent.change(screen.getByPlaceholderText('XXXX-0000'), { target: { value: 'OS-1000' } });
        fireEvent.click(screen.getByText('Finalizar Abertura'));

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('já existe no sistema'));
        });
        expect(ordemServicoService.create).not.toHaveBeenCalled();
        alertSpy.mockRestore();
    });

    it('preenche o número da OS ao clicar em Gerar Próximo Disponível', async () => {
        (ordemServicoService.getNextOSNumber as ReturnType<typeof vi.fn>).mockResolvedValue('OS-1234');

        renderPage();

        fireEvent.click(screen.getByText('[ Gerar Próximo Disponível ]'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('XXXX-0000')).toHaveValue('OS-1234');
        });
    });
});
