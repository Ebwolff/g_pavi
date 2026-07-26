import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PainelAlmoxarifado from './PainelAlmoxarifado';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));
vi.mock('@/services/ordemServico.service', () => ({
    ordemServicoService: { update: vi.fn() },
}));

function chainable(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'in', 'eq', 'update'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
    builder.then = (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data, error: null }).then(resolve);
    return builder;
}

describe('PainelAlmoxarifado', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    function mockSupabase(estoque: unknown[], compras: unknown[]) {
        let itensOsCalls = 0;
        (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
            if (table === 'itens_os') {
                itensOsCalls++;
                if (itensOsCalls === 1) return chainable(estoque);
                return chainable([]);
            }
            if (table === 'solicitacoes_compra') return chainable(compras);
            return chainable([]);
        });
    }

    it('agrupa peças a separar por OS e abre o modal de separação ao clicar', async () => {
        mockSupabase(
            [
                {
                    id: 'item-1', codigo_peca: 'P100', descricao: 'Filtro de óleo', quantidade: 2,
                    status_separacao: 'SOLICITADO_ESTOQUE',
                    ordens_servico: { id: 'os-1', numero_os: 'OS-800', nome_cliente_digitavel: 'Cliente A', modelo_maquina: 'Trator X' },
                },
            ],
            []
        );

        render(<PainelAlmoxarifado />);

        await waitFor(() => {
            expect(screen.getByText('OS #OS-800')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('OS #OS-800'));

        await waitFor(() => {
            expect(screen.getByText('Separar Peças')).toBeInTheDocument();
        });
        expect(screen.getByText('Filtro de óleo')).toBeInTheDocument();
    });

    it('marca uma peça como separada ao clicar em Separar', async () => {
        mockSupabase(
            [
                {
                    id: 'item-1', codigo_peca: 'P100', descricao: 'Filtro de óleo', quantidade: 2,
                    status_separacao: 'SOLICITADO_ESTOQUE',
                    ordens_servico: { id: 'os-1', numero_os: 'OS-800', nome_cliente_digitavel: 'Cliente A', modelo_maquina: 'Trator X' },
                },
            ],
            []
        );

        render(<PainelAlmoxarifado />);

        await waitFor(() => screen.getByText('OS #OS-800'));
        fireEvent.click(screen.getByText('OS #OS-800'));
        await waitFor(() => screen.getByText('Separar Peças'));

        const separarButtons = screen.getAllByText('Separar');
        fireEvent.click(separarButtons[separarButtons.length - 1]);

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('itens_os');
        });
    });

    it('lista as OS com peças a caminho na aba Chegando', async () => {
        mockSupabase(
            [],
            [
                {
                    id: 'sol-1', codigo_peca: 'P200', descricao_peca: 'Correia', quantidade: 1,
                    status: 'COMPRADO', data_previsao_entrega: null, ordem_servico_id: 'os-2',
                    ordens_servico: { id: 'os-2', numero_os: 'OS-801', nome_cliente_digitavel: 'Cliente B' },
                },
            ]
        );

        render(<PainelAlmoxarifado />);

        await waitFor(() => screen.getByText('Almoxarifado'));
        fireEvent.click(screen.getByText('Chegando'));

        await waitFor(() => {
            expect(screen.getByText('OS #OS-801')).toBeInTheDocument();
        });
    });
});
