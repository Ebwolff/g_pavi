import { describe, it, expect, vi, beforeEach } from 'vitest';
import { despesasService } from './despesasService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
        auth: { getUser: vi.fn() },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://storage/comprovante.png' } })),
            })),
        },
    },
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

function makeFile(name: string, type: string, sizeBytes: number): File {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: sizeBytes });
    return file;
}

describe('despesasService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getResumoDespesas', () => {
        it('agrega o valor total por tipo de despesa e soma o total geral', async () => {
            const despesas = [
                { tipo: 'KM', valor_total: 50 },
                { tipo: 'KM', valor_total: 30 },
                { tipo: 'ABASTECIMENTO', valor_total: 100 },
                { tipo: 'ALIMENTACAO', valor_total: 40 },
                { tipo: 'HOSPEDAGEM', valor_total: 200 },
                { tipo: 'PEDAGIO', valor_total: 15 },
                { tipo: 'MAO_DE_OBRA', valor_total: 300 },
                { tipo: 'OUTROS', valor_total: 10 },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: despesas, error: null }));

            const resumo = await despesasService.getResumoDespesas('os-1');

            expect(resumo).toEqual({
                totalKm: 80,
                totalAbastecimento: 100,
                totalAlimentacao: 40,
                totalHospedagem: 200,
                totalPedagio: 15,
                totalOutros: 10,
                totalMaoDeObra: 300,
                totalGeral: 745,
            });
        });
    });

    describe('getTotalKmRodados', () => {
        it('soma apenas a quantidade das despesas do tipo KM', async () => {
            const despesas = [
                { tipo: 'KM', quantidade: 120 },
                { tipo: 'KM', quantidade: 80 },
                { tipo: 'ABASTECIMENTO', quantidade: 999 },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: despesas, error: null }));

            const totalKm = await despesasService.getTotalKmRodados('os-1');

            expect(totalKm).toBe(200);
        });
    });

    describe('uploadComprovante', () => {
        it('rejeita se o usuário não estiver autenticado', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
            const file = makeFile('nota.png', 'image/png', 1000);

            await expect(despesasService.uploadComprovante('os-1', file)).rejects.toThrow('não autenticado');
        });

        it('rejeita tipo de arquivo não permitido', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } } });
            const file = makeFile('script.exe', 'application/x-msdownload', 1000);

            await expect(despesasService.uploadComprovante('os-1', file)).rejects.toThrow(/Tipo de arquivo não permitido/);
        });

        it('rejeita arquivo maior que 10MB', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } } });
            const file = makeFile('nota.png', 'image/png', 11 * 1024 * 1024);

            await expect(despesasService.uploadComprovante('os-1', file)).rejects.toThrow(/muito grande/);
        });

        it('aceita PDF dentro do limite e retorna a URL pública', async () => {
            (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'u1' } } });
            (supabase.from as any).mockReturnValue(chainable({ data: null, error: null }));
            const file = makeFile('nota.pdf', 'application/pdf', 1024);

            const url = await despesasService.uploadComprovante('os-1', file);

            expect(url).toBe('https://storage/comprovante.png');
        });
    });
});
