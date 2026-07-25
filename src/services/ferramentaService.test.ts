import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ferramentaService } from './ferramentaService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(result: { data: any; error: any; count?: number }) {
    const builder: any = {};
    const chainMethods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'or', 'order', 'range', 'limit',
    ];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('ferramentaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('retirar', () => {
        it('atualiza a ferramenta com o técnico e registra a movimentação de RETIRADA', async () => {
            const ferramentasBuilder = chainable({ data: null, error: null });
            const movBuilder = chainable({ data: null, error: null });
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'ferramentas' ? ferramentasBuilder : movBuilder
            );

            await ferramentaService.retirar('ferr-1', 'tec-1', 'user-1', 'sem observação');

            expect(ferramentasBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ tecnico_id: 'tec-1', data_retirada: expect.any(String) })
            );
            expect(movBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    ferramenta_id: 'ferr-1',
                    tecnico_id: 'tec-1',
                    tipo: 'RETIRADA',
                    registrado_por: 'user-1',
                })
            );
        });

        it('lança erro se a atualização da ferramenta falhar', async () => {
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'ferramentas'
                    ? chainable({ data: null, error: { message: 'falhou' } })
                    : chainable({ data: null, error: null })
            );

            await expect(ferramentaService.retirar('ferr-1', 'tec-1')).rejects.toBeTruthy();
        });

        it('NÃO lança erro se só o registro de movimentação falhar (best-effort)', async () => {
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'ferramentas'
                    ? chainable({ data: null, error: null })
                    : chainable({ data: null, error: { message: 'log falhou' } })
            );

            await expect(ferramentaService.retirar('ferr-1', 'tec-1')).resolves.toBeUndefined();
        });
    });

    describe('devolver', () => {
        it('limpa o técnico da ferramenta e registra DEVOLUCAO com o técnico que estava com ela', async () => {
            const movBuilder = chainable({ data: null, error: null });
            (supabase.from as any).mockImplementation((table: string) => {
                if (table === 'ferramentas') {
                    const b = chainable({ data: { tecnico_id: 'tec-1' }, error: null });
                    return b;
                }
                return movBuilder;
            });

            await ferramentaService.devolver('ferr-1', 'user-2');

            expect(movBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    ferramenta_id: 'ferr-1',
                    tecnico_id: 'tec-1',
                    tipo: 'DEVOLUCAO',
                    registrado_por: 'user-2',
                })
            );
        });

        it('limpa tecnico_id e data_retirada da ferramenta', async () => {
            const ferramentasBuilder = chainable({ data: { tecnico_id: 'tec-1' }, error: null });
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'ferramentas' ? ferramentasBuilder : chainable({ data: null, error: null })
            );

            await ferramentaService.devolver('ferr-1');

            expect(ferramentasBuilder.update).toHaveBeenCalledWith({
                tecnico_id: null,
                data_retirada: null,
            });
        });
    });

    describe('getEstatisticas', () => {
        it('classifica ferramentas em estoque, com técnico e avariadas', async () => {
            const ferramentas = [
                { id: '1', tecnico_id: null, estado: 'BOM' },
                { id: '2', tecnico_id: 'tec-1', estado: 'BOM' },
                { id: '3', tecnico_id: 'tec-2', estado: 'AVARIADO' },
                { id: '4', tecnico_id: null, estado: 'AVARIADO' },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: ferramentas, error: null }));

            const stats = await ferramentaService.getEstatisticas();

            expect(stats).toEqual({
                total: 4,
                noEstoque: 2,
                comTecnico: 2,
                avariadas: 2,
            });
        });
    });
});
