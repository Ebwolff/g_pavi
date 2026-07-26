import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PainelCompras from './PainelCompras';
import { supabase } from '@/lib/supabase';

vi.mock('@/components/AppLayout', () => ({
    AppLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(data: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {};
    ['select', 'not', 'order', 'eq', 'update'].forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.then = (resolve: (v: { data: unknown; error: null }) => void) =>
        Promise.resolve({ data, error: null }).then(resolve);
    return builder;
}

describe('PainelCompras', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('agrupa solicitações de compra por OS e mostra contagem de pendentes', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([
            {
                id: 'sol-1', codigo_peca: 'P900', descricao_peca: 'Rolamento', quantidade: 3, unidade: 'UN',
                urgencia: 'NORMAL', status: 'PENDENTE', valor_unitario: null, fornecedor: null,
                data_previsao_entrega: null, data_solicitacao: '2026-01-01T00:00:00Z', observacoes: null,
                ordem_servico_id: 'os-1',
                ordens_servico: { id: 'os-1', numero_os: 'OS-950', nome_cliente_digitavel: 'Cliente Compras' },
            },
        ]));

        render(<PainelCompras />);

        await waitFor(() => {
            expect(screen.getByText('OS #OS-950')).toBeInTheDocument();
        });
        expect(screen.getByText('1 pendente')).toBeInTheDocument();
    });

    it('inicia a cotação de um item pendente ao clicar no botão', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([
            {
                id: 'sol-1', codigo_peca: 'P900', descricao_peca: 'Rolamento', quantidade: 3, unidade: 'UN',
                urgencia: 'NORMAL', status: 'PENDENTE', valor_unitario: null, fornecedor: null,
                data_previsao_entrega: null, data_solicitacao: '2026-01-01T00:00:00Z', observacoes: null,
                ordem_servico_id: 'os-1',
                ordens_servico: { id: 'os-1', numero_os: 'OS-950', nome_cliente_digitavel: 'Cliente Compras' },
            },
        ]));

        render(<PainelCompras />);

        await waitFor(() => screen.getByText('OS #OS-950'));
        fireEvent.click(screen.getByText('OS #OS-950'));

        await waitFor(() => screen.getByText('Peças para Compra'));
        fireEvent.click(screen.getByText('Iniciar Cotação'));

        await waitFor(() => {
            expect(supabase.from).toHaveBeenCalledWith('solicitacoes_compra');
        });
    });

    it('mostra estado vazio quando não há solicitações ativas', async () => {
        (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(chainable([]));

        render(<PainelCompras />);

        await waitFor(() => {
            expect(screen.getByText('Nenhuma solicitação ativa')).toBeInTheDocument();
        });
    });
});
