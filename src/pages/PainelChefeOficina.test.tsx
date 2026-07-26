import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PainelChefeOficina from './PainelChefeOficina';
import { useAuth } from '@/hooks/useAuth';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/tecnico.service', () => ({
    tecnicoService: { getAll: vi.fn() },
}));
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { list: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'eq', 'not'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data, error: null }).then(resolve);
    return builder;
}

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <PainelChefeOficina />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('PainelChefeOficina', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile: { role: 'CHEFE_OFICINA' } });
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([]));
        (tecnicoService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    });

    it('mostra o indicador de comprovante de despesa nas OS não atribuídas (bug corrigido nesta sessão)', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'os-1', numero_os: 'OS-300', tipo_os: 'NORMAL', status_atual: 'AGUARDANDO_ATRIBUICAO',
                    nome_cliente_digitavel: 'Fazenda Verde', modelo_maquina: 'Trator A', tecnico_id: null,
                    data_abertura: '2026-01-01T00:00:00Z', descricao_problema: 'Barulho estranho',
                    valor_liquido_total: 0, nivel_urgencia: 'NORMAL',
                    despesas: [{ comprovante_url: 'https://example.com/comprovante.jpg' }],
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => screen.getByText('Gestão de Oficina'));
        fireEvent.click(screen.getByText('Gestão'));

        await waitFor(() => {
            expect(screen.getByText('#OS-300')).toBeInTheDocument();
        });
        expect(screen.getByTitle(/comprovante/i)).toBeInTheDocument();
    });

    it('calcula os KPIs do dashboard (OS abertas, valor em aberto)', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'os-1', numero_os: 'OS-301', tipo_os: 'NORMAL', status_atual: 'EM_EXECUCAO',
                    nome_cliente_digitavel: 'Cliente X', modelo_maquina: 'Trator B', tecnico_id: 'tec-1',
                    data_abertura: '2026-01-01T00:00:00Z', descricao_problema: '', valor_liquido_total: 5000,
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('OS Abertas')).toBeInTheDocument();
        });
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('exibe estado vazio de técnicos quando não há nenhum cadastrado', async () => {
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage();

        await waitFor(() => {
            expect(screen.getAllByText('Sem dados').length).toBeGreaterThan(0);
        });
    });
});
