import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PainelFeramental from './PainelFeramental';
import { useAuth } from '@/hooks/useAuth';
import { frotaService } from '@/services/frotaService';
import { ferramentaService } from '@/services/ferramentaService';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/services/frotaService', () => ({
    frotaService: {
        getVeiculos: vi.fn(),
        getEstatisticasDashboard: vi.fn(),
        excluirVeiculo: vi.fn(),
        atualizarVeiculo: vi.fn(),
        desalocarVeiculo: vi.fn(),
    },
}));
vi.mock('@/services/ferramentaService', () => ({
    ferramentaService: { getAll: vi.fn(), getMovimentacoes: vi.fn() },
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(data: unknown, count = 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'gte', 'order'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: { data: unknown; count: number; error: null }) => void) =>
        Promise.resolve({ data, count, error: null }).then(resolve);
    return builder;
}

const dashDataBase = {
    porStatus: { total: 2, disponiveis: 1, emUso: 1, manutencao: 0, inativos: 0 },
    movHoje: 0,
    kmRodado: 1200,
    movimentacoes: [],
};

function renderPage() {
    return render(<PainelFeramental />);
}

describe('PainelFeramental', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: { id: 'user-1' } });
        (ferramentaService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (ferramentaService.getMovimentacoes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([], 0));
    });

    it('mostra os KPIs de frota no painel após carregar os dados', async () => {
        (frotaService.getVeiculos as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (frotaService.getEstatisticasDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(dashDataBase);

        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Veículos em Rota')).toBeInTheDocument();
        });
        expect(screen.getByText('2 na frota total')).toBeInTheDocument();
    });

    it('lista os veículos da frota e permite filtrar por status', async () => {
        (frotaService.getVeiculos as ReturnType<typeof vi.fn>).mockResolvedValue([
            {
                id: 'v1', placa: 'ABC1234', marca: 'Ford', modelo: 'Ranger', status: 'DISPONIVEL',
                km_atual: 15000, ano: 2022, cor: 'Branco', tecnico: null,
            },
            {
                id: 'v2', placa: 'XYZ5678', marca: 'Fiat', modelo: 'Toro', status: 'EM_USO',
                km_atual: 30000, ano: 2021, cor: 'Preto', tecnico: { nome_completo: 'Carlos' },
            },
        ]);
        (frotaService.getEstatisticasDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(dashDataBase);

        renderPage();

        await waitFor(() => screen.getByText('Veículos em Rota'));
        fireEvent.click(screen.getByText('Frota'));

        await waitFor(() => {
            expect(screen.getByText('ABC1234')).toBeInTheDocument();
        });
        expect(screen.getByText('XYZ5678')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Disponível' }));

        await waitFor(() => {
            expect(screen.getByText('ABC1234')).toBeInTheDocument();
            expect(screen.queryByText('XYZ5678')).not.toBeInTheDocument();
        });
    });

    it('mostra estado vazio quando não há veículos cadastrados', async () => {
        (frotaService.getVeiculos as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (frotaService.getEstatisticasDashboard as ReturnType<typeof vi.fn>).mockResolvedValue({
            ...dashDataBase, porStatus: { total: 0, disponiveis: 0, emUso: 0, manutencao: 0, inativos: 0 },
        });

        renderPage();

        await waitFor(() => screen.getByText('Veículos em Rota'));
        fireEvent.click(screen.getByText('Frota'));

        await waitFor(() => {
            expect(screen.getByText('Nenhum veículo encontrado')).toBeInTheDocument();
        });
    });
});
