import { describe, it, expect, vi, beforeEach } from 'vitest';
import { alertasService } from './alertasService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(result: { data: any; error: any; count?: number }) {
    const builder: any = {};
    const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'lt', 'order'];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('alertasService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getAlertasNaoLidos filtra por usuário e por lido=false', async () => {
        const builder = chainable({ data: [], error: null });
        (supabase.from as any).mockReturnValue(builder);

        await alertasService.getAlertasNaoLidos('user-1');

        expect(builder.eq).toHaveBeenCalledWith('usuario_id', 'user-1');
        expect(builder.eq).toHaveBeenCalledWith('lido', false);
    });

    it('contarNaoLidos retorna 0 quando count vem null', async () => {
        (supabase.from as any).mockReturnValue(chainable({ data: null, error: null, count: null } as any));

        const total = await alertasService.contarNaoLidos('user-1');

        expect(total).toBe(0);
    });

    it('marcarTodosComoLidos só afeta alertas não lidos do usuário', async () => {
        const builder = chainable({ data: null, error: null });
        (supabase.from as any).mockReturnValue(builder);

        await alertasService.marcarTodosComoLidos('user-1');

        expect(builder.update).toHaveBeenCalledWith({ lido: true });
        expect(builder.eq).toHaveBeenCalledWith('usuario_id', 'user-1');
        expect(builder.eq).toHaveBeenCalledWith('lido', false);
    });

    it('limparAlertasAntigos só deleta alertas lidos com mais de 30 dias', async () => {
        const builder = chainable({ data: null, error: null });
        (supabase.from as any).mockReturnValue(builder);

        const antes = Date.now();
        await alertasService.limparAlertasAntigos();

        expect(builder.eq).toHaveBeenCalledWith('lido', true);
        const cutoffArg = builder.lt.mock.calls[0][1];
        expect(builder.lt).toHaveBeenCalledWith('created_at', cutoffArg);

        const cutoffMs = new Date(cutoffArg).getTime();
        const trintaDiasMs = 30 * 24 * 60 * 60 * 1000;
        // O corte deve ser ~30 dias atrás a partir de agora (com folga de 1s pra execução do teste)
        expect(Math.abs((antes - trintaDiasMs) - cutoffMs)).toBeLessThan(1000);
    });

    it('propaga erro do Supabase em criarAlerta', async () => {
        (supabase.from as any).mockReturnValue(chainable({ data: null, error: { message: 'falhou' } }));

        await expect(
            alertasService.criarAlerta({
                usuario_id: 'user-1',
                tipo_alerta: 'NOVA_OS',
                titulo: 'Teste',
                mensagem: 'Teste',
            } as any)
        ).rejects.toBeTruthy();
    });
});
