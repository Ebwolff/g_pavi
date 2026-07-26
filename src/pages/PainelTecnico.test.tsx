import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PainelTecnico from './PainelTecnico';
import { useAuth } from '@/hooks/useAuth';
import { tecnicoService } from '@/services/tecnico.service';
import { ordemServicoService } from '@/services/ordemServico.service';
import { frotaService } from '@/services/frotaService';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/tecnico.service', () => ({
    tecnicoService: { getByUserId: vi.fn() },
}));
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { list: vi.fn(), update: vi.fn() },
}));
vi.mock('@/services/frotaService', () => ({
    frotaService: { getVeiculoDoTecnico: vi.fn() },
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(result: { data: unknown; error: unknown }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'eq', 'in', 'order'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: typeof result) => void) => Promise.resolve(result).then(resolve);
    return builder;
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <PainelTecnico />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe('PainelTecnico', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable({ data: [], error: null }));
    });

    it('mostra aviso quando o usuário logado não tem cadastro de técnico vinculado', async () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { id: 'user-1' },
            profile: { role: 'TECNICO' },
        });
        (tecnicoService.getByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Perfil Técnico Não Encontrado/i)).toBeInTheDocument();
        });
    });

    it('lista as OS atribuídas ao técnico e mostra indicador de peças pendentes', async () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { id: 'user-1' },
            profile: { role: 'TECNICO' },
        });
        (tecnicoService.getByUserId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tec-1', nome_completo: 'João' });
        (frotaService.getVeiculoDoTecnico as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({
            data: [
                {
                    id: 'os-1',
                    numero_os: 'OS-100',
                    nome_cliente_digitavel: 'Fazenda Boa Vista',
                    modelo_maquina: 'Trator X',
                    status_atual: 'EM_EXECUCAO',
                    data_abertura: '2026-01-01T00:00:00Z',
                    descricao_problema: 'Motor falhando',
                    tecnico_id: 'tec-1',
                    itens: [{ status_separacao: 'PENDENTE' }],
                },
            ],
            count: 1,
        });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Minhas OS/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/Minhas OS/i));

        await waitFor(() => {
            expect(screen.getByText('#OS-100')).toBeInTheDocument();
        });
        expect(screen.getByText(/Fazenda Boa Vista/i)).toBeInTheDocument();
        expect(screen.getByText(/Peças Pendentes/i)).toBeInTheDocument();
    });

    it('exibe estado vazio quando o técnico não possui OS ativas', async () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
            user: { id: 'user-1' },
            profile: { role: 'TECNICO' },
        });
        (tecnicoService.getByUserId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tec-1', nome_completo: 'João' });
        (frotaService.getVeiculoDoTecnico as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (ordemServicoService.list as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], count: 0 });

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Minhas OS/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/Minhas OS/i));

        await waitFor(() => {
            expect(screen.getByText(/Nenhuma OS atribuída/i)).toBeInTheDocument();
        });
    });
});
