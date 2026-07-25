import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pendenciaService } from './pendencia.service';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(result: { data: any; error: any }) {
    const builder: any = {};
    const chainMethods = ['select', 'insert', 'update', 'delete', 'eq', 'order'];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('pendenciaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('normaliza ordens_servico quando o Supabase retorna array em vez de objeto', async () => {
            const rows = [
                { id: '1', ordens_servico: [{ numero_os: 'OS-001', nome_cliente_digitavel: 'João' }] },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: rows, error: null }));

            const result = await pendenciaService.list();

            expect(result[0].ordens_servico).toEqual({ numero_os: 'OS-001', nome_cliente_digitavel: 'João' });
        });

        it('mantém ordens_servico como objeto quando já vem assim', async () => {
            const rows = [
                { id: '1', ordens_servico: { numero_os: 'OS-002', nome_cliente_digitavel: 'Maria' } },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: rows, error: null }));

            const result = await pendenciaService.list();

            expect(result[0].ordens_servico).toEqual({ numero_os: 'OS-002', nome_cliente_digitavel: 'Maria' });
        });

        it('ignora o filtro de tipo/status quando o valor é "TODOS"', async () => {
            const builder = chainable({ data: [], error: null });
            (supabase.from as any).mockReturnValue(builder);

            await pendenciaService.list({ tipo: 'TODOS', status: 'TODOS' });

            expect(builder.eq).not.toHaveBeenCalled();
        });

        it('aplica o filtro quando um tipo/status específico é passado', async () => {
            const builder = chainable({ data: [], error: null });
            (supabase.from as any).mockReturnValue(builder);

            await pendenciaService.list({ tipo: 'PECAS', status: 'PENDENTE' });

            expect(builder.eq).toHaveBeenCalledWith('tipo_pendencia', 'PECAS');
            expect(builder.eq).toHaveBeenCalledWith('status', 'PENDENTE');
        });
    });

    describe('getById', () => {
        it('normaliza ordens_servico também na busca por ID', async () => {
            (supabase.from as any).mockReturnValue(
                chainable({
                    data: { id: '1', ordens_servico: [{ numero_os: 'OS-003', nome_cliente_digitavel: null }] },
                    error: null,
                })
            );

            const result = await pendenciaService.getById('1');

            expect(result.ordens_servico).toEqual({ numero_os: 'OS-003', nome_cliente_digitavel: null });
        });
    });
});
