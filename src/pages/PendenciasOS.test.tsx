import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { PendenciasOS } from './PendenciasOS';
import { pendenciaService } from '@/services/pendencia.service';
import { ordemServicoService } from '@/services/ordemServico.service';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/services/pendencia.service', () => ({
    pendenciaService: { list: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { list: vi.fn() },
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

    it('abre o modal de criação pelo botão Nova Pendência e oferece as OS disponíveis', async () => {
        (pendenciaService.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [{ id: 'os-1', numero_os: 'OS-900', nome_cliente_digitavel: 'Fazenda Boa Vista' }],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Nenhuma pendência localizada')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Nova Pendência'));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Nova Pendência' })).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText(/OS-900/)).toBeInTheDocument();
        });
    });

    it('abre o modal em modo edição já preenchido ao clicar em Ver Detalhes', async () => {
        (pendenciaService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'p1', tipo_pendencia: 'PECAS', descricao: 'Aguardando peça X', responsavel: 'João',
                status: 'PENDENTE', data_inicio: '2026-01-01T00:00:00Z', data_prevista: null, os_id: 'os-1',
                observacoes: null,
                ordens_servico: { numero_os: 'OS-700', nome_cliente_digitavel: 'Cliente A' },
            },
        ]);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Ver Detalhes'));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Editar Pendência' })).toBeInTheDocument();
        });
        expect(screen.getByDisplayValue('Aguardando peça X')).toBeInTheDocument();
        expect(screen.getByDisplayValue('João')).toBeInTheDocument();
        // Na edição a OS é fixa: não deve haver seletor de OS.
        expect(screen.queryByText('Selecione a OS')).not.toBeInTheDocument();
    });

    it('salva a edição pelo serviço e carimba a data de resolução ao marcar como resolvida', async () => {
        (pendenciaService.list as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'p1', tipo_pendencia: 'PECAS', descricao: 'Aguardando peça X', responsavel: null,
                status: 'PENDENTE', data_inicio: '2026-01-01T00:00:00Z', data_prevista: null, os_id: 'os-1',
                observacoes: null,
                ordens_servico: { numero_os: 'OS-700', nome_cliente_digitavel: 'Cliente A' },
            },
        ]);
        (pendenciaService.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'p1' });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Ver Detalhes')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Ver Detalhes'));

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'Editar Pendência' })).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'RESOLVIDO' } });
        fireEvent.click(screen.getByText('Salvar Alterações'));

        await waitFor(() => {
            expect(pendenciaService.update).toHaveBeenCalled();
        });
        const [id, payload] = (pendenciaService.update as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(id).toBe('p1');
        expect(payload.status).toBe('RESOLVIDO');
        expect(payload.data_resolucao).toEqual(expect.any(String));
    });
});
