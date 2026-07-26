import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DashboardNovo } from './DashboardNovo';
import { useAuth } from '@/hooks/useAuth';
import { statsService } from '@/services/statsService';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/hooks/useAuth');
vi.mock('@/components/ui/Charts', () => ({
    TendenciaChart: () => <div data-testid="tendencia-chart-stub" />,
    DistribuicaoStatusChart: () => <div data-testid="distribuicao-chart-stub" />,
    UrgenciaDistributionChart: () => <div data-testid="urgencia-chart-stub" />,
}));
vi.mock('@/services/statsService', () => ({
    statsService: {
        getDashboardStats: vi.fn(),
        getTendenciaOS: vi.fn(),
        getDistribuicaoStatus: vi.fn(),
        getTopClientes: vi.fn(),
        getGlobalProfitabilityStats: vi.fn(),
    },
}));
vi.mock('@/services/relatoriosService', () => ({
    relatoriosService: { exportarRelatorioPerformance: vi.fn() },
}));

describe('DashboardNovo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ profile: { role: 'GERENTE' } });
        (statsService.getTendenciaOS as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (statsService.getDistribuicaoStatus as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (statsService.getTopClientes as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (statsService.getGlobalProfitabilityStats as ReturnType<typeof vi.fn>).mockResolvedValue({
            receitaTotal: 8000, custoTotal: 3000, lucroBruto: 5000, margemMedia: 62.5,
        });
    });

    it('mostra os KPIs principais após carregar os dados do dashboard', async () => {
        (statsService.getDashboardStats as ReturnType<typeof vi.fn>).mockResolvedValue({
            valorTotal: 120000,
            valorEmAberto: 30000,
            osAbertas: 12,
            totalPendencias: 3,
            tempoMedioResolucao: 5.4,
            osCriticas: 1,
            osAltas: 2,
            osMedias: 3,
            osNormais: 6,
            osEmExecucao: 4,
            osAguardandoPecas: 2,
            osAguardandoPagamento: 1,
            osConcluidas: 5,
        });

        render(<MemoryRouter><DashboardNovo /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Visão Geral')).toBeInTheDocument();
        });
        expect(screen.getByText('OS em Aberto')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('exibe tela de erro com opção de tentar novamente quando o carregamento falha', async () => {
        (statsService.getDashboardStats as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Falha de rede'));

        render(<MemoryRouter><DashboardNovo /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
        });
        expect(screen.getByText('Falha de rede')).toBeInTheDocument();
    });
});
