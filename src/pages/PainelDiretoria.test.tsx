import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PainelDiretoria from './PainelDiretoria';
import { supabase } from '@/lib/supabase';
import { statsService } from '@/services/statsService';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));
vi.mock('@/services/statsService', () => ({
    statsService: { getGlobalProfitabilityStats: vi.fn() },
}));

function chainable(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'gte'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data, error: null }).then(resolve);
    return builder;
}

describe('PainelDiretoria', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (statsService.getGlobalProfitabilityStats as ReturnType<typeof vi.fn>).mockResolvedValue({
            receitaTotal: 10000, custoTotal: 4000, lucroBruto: 6000, margemMedia: 60,
        });
    });

    it('calcula e exibe os KPIs corporativos a partir das OS do período', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([
            {
                id: '1', status_atual: 'FATURADA', tipo_os: 'NORMAL',
                data_abertura: '2026-01-01T00:00:00Z', data_fechamento: '2026-01-05T00:00:00Z',
                valor_liquido_total: 2000, consultor_id: 'c1',
                consultor: { first_name: 'Ana', last_name: 'Souza' },
            },
            {
                id: '2', status_atual: 'EM_EXECUCAO', tipo_os: 'GARANTIA',
                data_abertura: '2026-01-10T00:00:00Z', data_fechamento: null,
                valor_liquido_total: 500, consultor_id: 'c2',
                consultor: { first_name: 'Bruno', last_name: 'Lima' },
            },
        ]));

        render(<PainelDiretoria />);

        await waitFor(() => {
            expect(screen.getByText('Painel Executivo')).toBeInTheDocument();
        });
        await waitFor(() => {
            expect(screen.getByText('Total Registros')).toBeInTheDocument();
        });
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Ana Souza')).toBeInTheDocument();
    });

    it('mostra estado vazio de gargalos quando não há OS em aberto', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([]));

        render(<PainelDiretoria />);

        await waitFor(() => {
            expect(screen.getByText('Cadeia de produção livre')).toBeInTheDocument();
        });
    });
});
