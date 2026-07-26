import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PainelConsultor from './PainelConsultor';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));
vi.mock('@/components/ui/Charts', () => ({
    DistribuicaoOperacionalChart: () => <div data-testid="chart-stub" />,
}));
vi.mock('@/components/consultor/PedidoPeca', () => ({
    PedidoPeca: () => <div data-testid="pedido-peca-stub" />,
}));

function chainableFor(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'eq', 'order'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data, error: null }).then(resolve);
    return builder;
}

function renderPage() {
    return render(
        <MemoryRouter>
            <PainelConsultor />
        </MemoryRouter>
    );
}

describe('PainelConsultor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            profile: { id: 'user-1', role: 'CONSULTOR_NORMAL' },
        });
        (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
            if (table === 'ordens_servico') {
                return chainableFor([
                    {
                        id: 'os-1',
                        numero_os: 'OS-200',
                        tipo_os: 'NORMAL',
                        status_atual: 'FATURADA',
                        nome_cliente_digitavel: 'Cliente Faturado',
                        modelo_maquina: 'Colheitadeira Y',
                        chassi: 'CH123',
                        data_abertura: '2026-01-01T00:00:00Z',
                        valor_liquido_total: 1500,
                        tecnico: [{ nome_completo: 'Carlos Técnico' }],
                        despesas: [{ comprovante_url: null }],
                        pdf_nbs_url: 'https://example.com/nota.pdf',
                        data_faturamento: '2026-02-01T00:00:00Z',
                    },
                ]);
            }
            // itens_os (peças pendentes / aprovação)
            return chainableFor([]);
        });
    });

    it('mostra as estatísticas do dashboard após carregar os dados', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Total OS')).toBeInTheDocument();
        });
        // 1 OS carregada, faturada -> conta em Total, Concluídas e Faturado
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('exibe o nome do técnico e o link do PDF na aba Faturadas (bug corrigido nesta sessão)', async () => {
        renderPage();

        await waitFor(() => screen.getByText('Total OS'));
        fireEvent.click(screen.getByText('Faturadas'));

        await waitFor(() => {
            expect(screen.getByText('Carlos Técnico')).toBeInTheDocument();
        });

        const pdfLink = screen.getByTitle('Ver PDF');
        expect(pdfLink).toHaveAttribute('href', 'https://example.com/nota.pdf');
    });

    it('filtra a lista pelo termo de busca', async () => {
        renderPage();

        await waitFor(() => screen.getByText('Total OS'));
        fireEvent.click(screen.getByText('Serviços'));

        fireEvent.change(screen.getByPlaceholderText(/Busca por OS/i), {
            target: { value: 'nao-existe' },
        });

        await waitFor(() => {
            expect(screen.getByText(/Nenhum registro encontrado/i)).toBeInTheDocument();
        });
    });
});
