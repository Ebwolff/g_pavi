import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { EditarOS } from './EditarOS';
import { ordemServicoService } from '@/services/ordemServico.service';
import { despesasService } from '@/services/despesasService';
import { anexosService } from '@/services/anexosService';
import { statsService } from '@/services/statsService';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: 'os-1' }),
        useNavigate: () => vi.fn(),
    };
});
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { getById: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/services/despesasService', () => ({
    despesasService: { getDespesasPorOS: vi.fn(), excluirDespesa: vi.fn() },
}));
vi.mock('@/services/anexosService', () => ({
    anexosService: { getAnexosByOS: vi.fn(), uploadAnexo: vi.fn(), excluirAnexo: vi.fn() },
}));
vi.mock('@/services/statsService', () => ({
    statsService: { getOSProfitability: vi.fn() },
}));

const osBase = {
    id: 'os-1',
    numero_os: 'OS-500',
    tipo_os: 'NORMAL' as const,
    status_atual: 'EM_EXECUCAO' as const,
    nome_cliente_digitavel: 'Fazenda Modelo',
    modelo_maquina: 'Trator Z',
    chassi: 'CH999',
    descricao_problema: 'Vazamento hidráulico',
    solucao_aplicada: '',
    valor_mao_de_obra: 100,
    valor_pecas: 50,
    valor_deslocamento: 20,
    data_abertura: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
};

function renderPage() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <EditarOS />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('EditarOS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ordemServicoService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(osBase);
        (despesasService.getDespesasPorOS as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (anexosService.getAnexosByOS as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (statsService.getOSProfitability as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    });

    it('carrega e exibe os dados da OS nos campos do formulário', async () => {
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Editar OS #OS-500')).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue('Fazenda Modelo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Trator Z')).toBeInTheDocument();
    });

    it('envia os valores editados ao salvar', async () => {
        renderPage();

        await waitFor(() => screen.getByDisplayValue('Fazenda Modelo'));

        fireEvent.change(screen.getByDisplayValue('Fazenda Modelo'), {
            target: { value: 'Novo Nome Cliente' },
        });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(ordemServicoService.update).toHaveBeenCalledWith(
                'os-1',
                expect.objectContaining({ nome_cliente_digitavel: 'Novo Nome Cliente' })
            );
        });
    });

    it('mostra estado vazio de rentabilidade em vez de travar quando não há dados de lucro (bug corrigido nesta sessão)', async () => {
        renderPage();

        await waitFor(() => screen.getByText('Editar OS #OS-500'));
        fireEvent.click(screen.getByText('Rentabilidade (Manager)'));

        await waitFor(() => {
            expect(screen.getByText(/Sem dados de rentabilidade/i)).toBeInTheDocument();
        });
    });
});
