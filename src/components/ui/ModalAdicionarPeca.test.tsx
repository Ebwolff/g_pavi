import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalAdicionarPeca } from './ModalAdicionarPeca';
import { supabase } from '@/lib/supabase';
import { notifyPartsRequested } from '@/lib/notificationHelper';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/lib/notificationHelper', () => ({
    notifyPartsRequested: vi.fn().mockResolvedValue(undefined),
}));

/** Devolve o builder encadeável do supabase-js com o resultado desejado. */
function builderPara(tipoOs: string, capturas: { insert?: unknown[] }) {
    return () => {
        const b: Record<string, unknown> = {};
        ['select', 'eq', 'update'].forEach((m) => { b[m] = vi.fn(() => b); });
        b.single = vi.fn(() => Promise.resolve({ data: { tipo_os: tipoOs }, error: null }));
        b.insert = vi.fn((payload: unknown[]) => {
            capturas.insert = payload;
            return Promise.resolve({ error: null });
        });
        b.then = (res: (v: unknown) => void) => Promise.resolve({ error: null }).then(res);
        return b;
    };
}

async function preencherEEnviar() {
    fireEvent.change(screen.getByPlaceholderText('Ex: Filtro de óleo motor'), {
        target: { value: 'KIT DE VEDACAO' },
    });
    fireEvent.click(screen.getByText('Salvar Peças'));
}

describe('ModalAdicionarPeca — status de aprovação por tipo de OS', () => {
    beforeEach(() => vi.clearAllMocks());

    it('peça de OS de GARANTIA nasce APROVADO, pulando a aprovação financeira', async () => {
        const capturas: { insert?: unknown[] } = {};
        (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(builderPara('GARANTIA', capturas));

        render(<ModalAdicionarPeca isOpen onClose={vi.fn()} osId="os-1" onSuccess={vi.fn()} />);
        await preencherEEnviar();

        await waitFor(() => expect(capturas.insert).toBeTruthy());
        expect((capturas.insert as Array<{ status_aprovacao: string }>)[0].status_aprovacao).toBe('APROVADO');
        expect(notifyPartsRequested).toHaveBeenCalledWith('os-1', expect.any(String), true);
    });

    it('peça de OS NORMAL continua exigindo aprovação do consultor', async () => {
        const capturas: { insert?: unknown[] } = {};
        (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(builderPara('NORMAL', capturas));

        render(<ModalAdicionarPeca isOpen onClose={vi.fn()} osId="os-2" onSuccess={vi.fn()} />);
        await preencherEEnviar();

        await waitFor(() => expect(capturas.insert).toBeTruthy());
        expect((capturas.insert as Array<{ status_aprovacao: string }>)[0].status_aprovacao).toBe('PENDENTE_CONSULTOR');
        expect(notifyPartsRequested).toHaveBeenCalledWith('os-2', expect.any(String), false);
    });
});
