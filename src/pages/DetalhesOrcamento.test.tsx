import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { DetalhesOrcamento } from './DetalhesOrcamento';
import { orcamentoService } from '@/services/orcamento.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useParams: () => ({ id: 'orc-1' }), useNavigate: () => vi.fn() };
});
vi.mock('@/services/orcamento.service', () => ({
    orcamentoService: { getById: vi.fn(), updateStatus: vi.fn(), converterParaOS: vi.fn() },
}));

const orcamentoBase = {
    id: 'orc-1',
    numero_orcamento: 'ORC-200',
    status_orcamento: 'EM_ELABORACAO' as const,
    data_criacao: '2026-01-01T00:00:00Z',
    nome_cliente_digitavel: 'Fazenda Teste',
    modelo_maquina: 'Trator Y',
    chassi: 'CH200',
    descricao_problema: 'Barulho no motor',
    observacoes: null,
    valor_mao_de_obra: 100,
    valor_pecas: 50,
    valor_deslocamento: 20,
    valor_liquido_total: 170,
    itens_orcamento: null,
    pdf_nbs_url: null,
    consultor: null,
};

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <DetalhesOrcamento />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('DetalhesOrcamento', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('mostra os dados do orçamento carregado', async () => {
        (orcamentoService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(orcamentoBase);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('ORC-200')).toBeInTheDocument();
        });
        expect(screen.getByText('Fazenda Teste')).toBeInTheDocument();
        expect(screen.getByText('Barulho no motor')).toBeInTheDocument();
    });

    it('envia o orçamento para "Enviado ao Cliente" ao clicar no botão de status', async () => {
        (orcamentoService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(orcamentoBase);
        (orcamentoService.updateStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ ...orcamentoBase, status_orcamento: 'ENVIADO_CLIENTE' });

        renderPage();

        await waitFor(() => screen.getByText('ORC-200'));
        fireEvent.click(screen.getByText('Marcar como Enviado'));

        await waitFor(() => {
            expect(orcamentoService.updateStatus).toHaveBeenCalledWith('orc-1', 'ENVIADO_CLIENTE');
        });
    });

    it('mostra o botão de gerar OS apenas quando o orçamento está aprovado', async () => {
        (orcamentoService.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
            ...orcamentoBase, status_orcamento: 'APROVADO',
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Gerar Ordem de Serviço')).toBeInTheDocument();
        });
    });
});
