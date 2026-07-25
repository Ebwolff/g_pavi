import { describe, it, expect, vi, beforeEach } from 'vitest';
import { frotaService } from './frotaService';
import { supabase } from '@/lib/supabase';

vi.mock('@/lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

function chainable(result: { data: any; error: any; count?: number }) {
    const builder: any = {};
    const chainMethods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'or', 'is', 'order', 'range', 'limit',
    ];
    chainMethods.forEach((m) => {
        builder[m] = vi.fn(() => builder);
    });
    builder.single = vi.fn(() => Promise.resolve(result));
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject);
    return builder;
}

describe('frotaService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('alocarVeiculo', () => {
        it('atualiza o veículo para EM_USO e registra o início da alocação com o km atual', async () => {
            const veiculo = { id: 'v1', km_atual: 1000, status: 'DISPONIVEL' };
            const veiculosBuilder = chainable({ data: veiculo, error: null });
            const histBuilder = chainable({ data: null, error: null });
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'veiculos' ? veiculosBuilder : histBuilder
            );

            await frotaService.alocarVeiculo('v1', 'tec-1', 'user-1');

            expect(veiculosBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ tecnico_id: 'tec-1', status: 'EM_USO' })
            );
            expect(histBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({ veiculo_id: 'v1', tecnico_id: 'tec-1', km_inicio: 1000, alocado_por: 'user-1' })
            );
        });

        it('lança erro se o veículo não existir', async () => {
            (supabase.from as any).mockReturnValue(chainable({ data: null, error: { message: 'não achou' } }));

            await expect(frotaService.alocarVeiculo('inexistente', 'tec-1')).rejects.toThrow('Veículo não encontrado');
        });
    });

    describe('desalocarVeiculo', () => {
        it('fecha o histórico aberto com o km atual e libera o veículo', async () => {
            const veiculo = { id: 'v1', km_atual: 1500, status: 'EM_USO' };
            const veiculosBuilder = chainable({ data: veiculo, error: null });
            const histBuilder = chainable({ data: null, error: null });
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'veiculos' ? veiculosBuilder : histBuilder
            );

            await frotaService.desalocarVeiculo('v1', 'Fim do atendimento');

            expect(histBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ km_fim: 1500, motivo: 'Fim do atendimento' })
            );
            expect(histBuilder.is).toHaveBeenCalledWith('data_fim', null);
            expect(veiculosBuilder.update).toHaveBeenCalledWith({
                tecnico_id: null,
                status: 'DISPONIVEL',
                data_alocacao: null,
            });
        });
    });

    describe('getEstatisticas', () => {
        it('conta veículos por status', async () => {
            const veiculos = [
                { id: '1', status: 'DISPONIVEL' },
                { id: '2', status: 'EM_USO' },
                { id: '3', status: 'EM_USO' },
                { id: '4', status: 'MANUTENCAO' },
                { id: '5', status: 'INATIVO' },
            ];
            (supabase.from as any).mockReturnValue(chainable({ data: veiculos, error: null }));

            const stats = await frotaService.getEstatisticas();

            expect(stats).toEqual({
                total: 5,
                disponiveis: 1,
                emUso: 2,
                manutencao: 1,
                inativos: 1,
            });
        });
    });

    describe('getEstatisticasDashboard', () => {
        it('calcula km rodado somando apenas movimentações com km_inicio e km_fim', async () => {
            const veiculos = [{ id: '1', status: 'DISPONIVEL' }];
            const movimentacoes = [
                { id: 'm1', data_inicio: new Date().toISOString(), km_inicio: 100, km_fim: 150 },
                { id: 'm2', data_inicio: new Date().toISOString(), km_inicio: 200, km_fim: null },
                { id: 'm3', data_inicio: '2020-01-01T00:00:00.000Z', km_inicio: 500, km_fim: 550 },
            ];
            (supabase.from as any).mockImplementation((table: string) =>
                table === 'veiculos'
                    ? chainable({ data: veiculos, error: null })
                    : chainable({ data: movimentacoes, error: null })
            );

            const dash = await frotaService.getEstatisticasDashboard();

            // m1: 150-100=50, m2: sem km_fim (ignorado), m3: 550-500=50
            expect(dash.kmRodado).toBe(100);
            // m1 e m2 são de hoje, m3 é de 2020
            expect(dash.movHoje).toBe(2);
        });
    });
});
